import { Router, Request, Response } from 'express';
import CustomerInvoice from '../models/CustomerInvoice';

const router = Router();

// Get unit economics data - product profitability
router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const match: any = {};

    if (startDate || endDate) {
      match.invoiceDate = {};
      if (startDate) match.invoiceDate.$gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        match.invoiceDate.$lte = end;
      }
    }

    // Aggregate product-level data from customer invoices
    const pipeline: any[] = [];
    if (Object.keys(match).length > 0) {
      pipeline.push({ $match: match });
    }

    pipeline.push(
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          productName: { $first: '$items.productName' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
          totalCost: { $sum: { $multiply: ['$items.costPrice', '$items.quantity'] } },
          avgSellingPrice: { $avg: '$items.sellingPrice' },
          avgCostPrice: { $avg: '$items.costPrice' },
          invoiceCount: { $sum: 1 },
          hasPendingCosts: { $max: { $ifNull: ['$items.costPricePending', false] } },
        }
      },
      { $sort: { totalRevenue: -1 } }
    );

    const products = await CustomerInvoice.aggregate(pipeline);

    // Calculate totals
    const totalRevenue = products.reduce((sum: number, p: any) => sum + p.totalRevenue, 0);
    const totalCost = products.reduce((sum: number, p: any) => sum + p.totalCost, 0);
    const totalProfit = totalRevenue - totalCost;

    // Build response
    const productData = products.map((p: any) => {
      const profit = p.totalRevenue - p.totalCost;
      const profitMargin = p.totalRevenue > 0 ? (profit / p.totalRevenue) * 100 : 0;

      // Break-even: how many units needed to cover costs (at current avg selling price)
      const avgProfit = p.totalQuantity > 0 ? profit / p.totalQuantity : 0;
      const breakEven = avgProfit > 0 ? Math.ceil(p.totalCost / avgProfit) : 0;

      return {
        productId: p._id,
        productName: p.productName,
        totalQuantity: p.totalQuantity,
        totalRevenue: Math.round(p.totalRevenue),
        totalCost: Math.round(p.totalCost),
        profit: Math.round(profit),
        profitMargin: Math.round(profitMargin * 10) / 10,
        avgSellingPrice: Math.round(p.avgSellingPrice),
        avgCostPrice: Math.round(p.avgCostPrice),
        invoiceCount: p.invoiceCount,
        breakEven,
        hasPendingCosts: p.hasPendingCosts,
      };
    });

    res.json({
      products: productData,
      summary: {
        totalProducts: products.length,
        totalRevenue: Math.round(totalRevenue),
        totalCost: Math.round(totalCost),
        totalProfit: Math.round(totalProfit),
        overallMargin: totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 1000) / 10 : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
