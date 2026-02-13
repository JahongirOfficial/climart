import { Router, Request, Response } from 'express';
import CustomerInvoice from '../models/CustomerInvoice';

const router = Router();

// Get profit report
router.get('/profit', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, customerId, productId } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        message: 'startDate and endDate are required' 
      });
    }

    // Build query
    const query: any = {
      invoiceDate: {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      },
      status: { $ne: 'cancelled' }
    };

    if (customerId) {
      query.customer = customerId;
    }

    if (productId) {
      query['items.product'] = productId;
    }

    // Fetch invoices
    const invoices = await CustomerInvoice.find(query)
      .sort({ invoiceDate: -1 })
      .lean();

    // Calculate profit for each invoice
    const invoiceResults = invoices.map((inv: any) => {
      const revenue = inv.totalAmount;
      const cost = inv.items.reduce((sum: number, item: any) => 
        sum + (item.costPrice * item.quantity), 0
      );
      const profit = revenue - cost;
      const hasPendingCosts = inv.items.some((item: any) => item.costPricePending);

      return {
        invoiceNumber: inv.invoiceNumber,
        customerName: inv.customerName,
        invoiceDate: inv.invoiceDate,
        revenue,
        cost,
        profit,
        hasPendingCosts
      };
    });

    // Calculate totals
    const totalRevenue = invoiceResults.reduce((sum, inv) => sum + inv.revenue, 0);
    const totalCost = invoiceResults.reduce((sum, inv) => sum + inv.cost, 0);
    const totalProfit = totalRevenue - totalCost;
    
    const confirmedProfit = invoiceResults
      .filter(inv => !inv.hasPendingCosts)
      .reduce((sum, inv) => sum + inv.profit, 0);
    
    const estimatedProfit = invoiceResults
      .filter(inv => inv.hasPendingCosts)
      .reduce((sum, inv) => sum + inv.profit, 0);
    
    const hasPendingCosts = invoiceResults.some(inv => inv.hasPendingCosts);

    res.json({
      totalRevenue,
      totalCost,
      totalProfit,
      confirmedProfit,
      estimatedProfit,
      hasPendingCosts,
      invoices: invoiceResults
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
