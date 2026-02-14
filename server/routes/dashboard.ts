import { Router, Request, Response } from 'express';
import Product from '../models/Product';
import Receipt from '../models/Receipt';
import SupplierInvoice from '../models/SupplierInvoice';
import CustomerInvoice from '../models/CustomerInvoice';
import CustomerReturn from '../models/CustomerReturn';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Apply authentication to all dashboard routes
router.use(authenticateToken);

// Get dashboard statistics
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const { period = 'this_month' } = req.query;
    const userId = req.user?.userId;
    const isAdmin = req.user?.role === 'admin';
    
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'this_week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'this_month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const periodDuration = endDate.getTime() - startDate.getTime();
    const lastStartDate = new Date(startDate.getTime() - periodDuration);

    // Build filter for employee-specific data
    const employeeFilter = isAdmin ? {} : { createdBy: userId };

    // Run static stats in parallel (not period dependent)
    const [staticStats, periodStats, recentStats, chartStats] = await Promise.all([
      // Static stats: Warehouse value, Low stock, Debts
      (async () => {
        const [warehouseValueRes, lowStockRes, creditorRes, debtorRes] = await Promise.all([
          Product.aggregate([{ $group: { _id: null, total: { $sum: { $multiply: ["$quantity", "$costPrice"] } } } }]),
          Product.find({ minStock: { $gt: 0 }, $expr: { $lte: ["$quantity", "$minStock"] } }).select('name quantity minStock').limit(5).lean(),
          SupplierInvoice.aggregate([{ $match: { status: { $ne: 'paid' } } }, { $group: { _id: null, total: { $sum: { $subtract: ["$totalAmount", "$paidAmount"] } } } }]),
          CustomerInvoice.aggregate([
            { $match: { ...employeeFilter, status: { $nin: ['paid', 'cancelled'] } } }, 
            { $group: { _id: null, total: { $sum: { $subtract: ["$totalAmount", "$paidAmount"] } } } }
          ])
        ]);
        return {
          warehouseValue: warehouseValueRes[0]?.total || 0,
          lowStockItems: lowStockRes,
          creditorDebt: creditorRes[0]?.total || 0,
          debtorDebt: debtorRes[0]?.total || 0
        };
      })(),

      // Period stats: Revenue, Profit, Rankings
      (async () => {
        const getRangeStats = async (start: Date, end: Date) => {
          const result = await CustomerInvoice.aggregate([
            { $match: { ...employeeFilter, invoiceDate: { $gte: start, $lte: end }, status: { $ne: 'cancelled' } } },
            {
              $project: {
                totalAmount: 1,
                profit: {
                  $reduce: {
                    input: "$items",
                    initialValue: 0,
                    in: { $add: ["$$value", { $multiply: [{ $subtract: ["$$this.sellingPrice", "$$this.costPrice"] }, "$$this.quantity"] }] }
                  }
                }
              }
            },
            {
              $group: {
                _id: null,
                revenue: { $sum: "$totalAmount" },
                profit: { $sum: "$profit" },
                count: { $sum: 1 }
              }
            }
          ]);

          const returns = await CustomerReturn.aggregate([
            { $match: { returnDate: { $gte: start, $lte: end }, status: 'accepted' } },
            { $group: { _id: null, total: { $sum: "$totalAmount" } } }
          ]);

          const data = result[0] || { revenue: 0, profit: 0, count: 0 };
          const returnsAmt = returns[0]?.total || 0;
          return { revenue: data.revenue - returnsAmt, profit: data.profit, count: data.count };
        };

        const [current, last, rankings] = await Promise.all([
          getRangeStats(startDate, endDate),
          getRangeStats(lastStartDate, startDate),
          (async () => {
            const [topProds, topCusts, topSupps] = await Promise.all([
              CustomerInvoice.aggregate([
                { $match: { ...employeeFilter, invoiceDate: { $gte: startDate, $lte: endDate }, status: { $ne: 'cancelled' } } },
                { $unwind: "$items" },
                { $group: { _id: "$items.productName", quantity: { $sum: "$items.quantity" }, sales: { $sum: "$items.total" } } },
                { $sort: { sales: -1 } },
                { $limit: 5 },
                { $project: { name: "$_id", quantity: 1, sales: 1, _id: 0 } }
              ]),
              CustomerInvoice.aggregate([
                { $match: { ...employeeFilter, invoiceDate: { $gte: startDate, $lte: endDate }, status: { $ne: 'cancelled' } } },
                { $group: { _id: "$customerName", count: { $sum: 1 }, sales: { $sum: "$totalAmount" } } },
                { $sort: { sales: -1 } },
                { $limit: 5 },
                { $project: { name: "$_id", orders: "$count", sales: 1, _id: 0 } }
              ]),
              Receipt.aggregate([
                { $match: { ...employeeFilter, receiptDate: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: "$supplierName", count: { $sum: 1 }, sales: { $sum: "$totalAmount" } } },
                { $sort: { sales: -1 } },
                { $limit: 5 },
                { $project: { name: "$_id", orders: "$count", sales: 1, _id: 0 } }
              ])
            ]);
            return { topProducts: topProds, topCustomers: topCusts, topSuppliers: topSupps };
          })()
        ]);

        return { current, last, ...rankings };
      })(),

      // Recent Transactions
      (async () => {
        const [invoices, receipts] = await Promise.all([
          CustomerInvoice.find(employeeFilter).sort({ invoiceDate: -1, createdAt: -1 }).limit(5).select('invoiceNumber customerName invoiceDate totalAmount status').lean(),
          Receipt.find(employeeFilter).sort({ receiptDate: -1, createdAt: -1 }).limit(5).select('receiptNumber supplierName receiptDate totalAmount').lean()
        ]);
        const trans = [
          ...invoices.map(inv => ({
            id: inv._id.toString(),
            date: new Date(inv.invoiceDate).toISOString().split('T')[0],
            type: 'Savdo',
            amount: inv.totalAmount,
            status: inv.status === 'paid' ? 'Bajarildi' : inv.status === 'cancelled' ? 'Bekor qilindi' : 'Kutilmoqda'
          })),
          ...receipts.map(rec => ({
            id: rec._id.toString(),
            date: new Date(rec.receiptDate).toISOString().split('T')[0],
            type: 'Xarid',
            amount: rec.totalAmount,
            status: 'Bajarildi'
          }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
        return trans;
      })(),

      // Monthly Chart (Last 6 months)
      (async () => {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
        sixMonthsAgo.setDate(1);

        const aggregation = await CustomerInvoice.aggregate([
          { $match: { ...employeeFilter, invoiceDate: { $gte: sixMonthsAgo }, status: { $ne: 'cancelled' } } },
          { $group: { _id: { month: { $month: "$invoiceDate" }, year: { $year: "$invoiceDate" } }, total: { $sum: "$totalAmount" } } },
          { $sort: { "_id.year": 1, "_id.month": 1 } }
        ]);

        const monthNames = ["Yan", "Fev", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const result = [];
        for (let i = 0; i < 6; i++) {
          const d = new Date();
          d.setMonth(d.getMonth() - (5 - i));
          const m = d.getMonth() + 1;
          const y = d.getFullYear();
          const match = aggregation.find(item => item._id.month === m && item._id.year === y);
          result.push({
            month: monthNames[m - 1],
            savdo: match ? match.total : 0
          });
        }
        return result;
      })()
    ]);

    const revChange = periodStats.last.revenue > 0 ? ((periodStats.current.revenue - periodStats.last.revenue) / periodStats.last.revenue) * 100 : 0;
    const profChange = periodStats.last.profit > 0 ? ((periodStats.current.profit - periodStats.last.profit) / periodStats.last.profit) * 100 : 0;
    const curCheck = periodStats.current.count > 0 ? periodStats.current.revenue / periodStats.current.count : 0;
    const lastCheck = periodStats.last.count > 0 ? periodStats.last.revenue / periodStats.last.count : 0;
    const checkChange = lastCheck > 0 ? ((curCheck - lastCheck) / lastCheck) * 100 : 0;

    res.json({
      revenue: { current: periodStats.current.revenue, change: Math.round(revChange * 10) / 10 },
      profit: { current: periodStats.current.profit, change: Math.round(profChange * 10) / 10 },
      averageCheck: { current: curCheck, change: Math.round(checkChange * 10) / 10 },
      ...staticStats,
      topProducts: periodStats.topProducts,
      topCustomers: periodStats.topCustomers,
      topSuppliers: periodStats.topSuppliers,
      recentTransactions: recentStats,
      monthlySales: chartStats,
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
