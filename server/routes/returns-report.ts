import { Router, Request, Response } from 'express';
import CustomerReturn from '../models/CustomerReturn';

const router = Router();

// Get returns report with statistics
router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate as string);
    }

    const query = Object.keys(dateFilter).length > 0 
      ? { returnDate: dateFilter }
      : {};

    // Get all returns in date range
    const returns = await CustomerReturn.find(query)
      .populate('customer')
      .populate('invoice')
      .sort({ returnDate: -1 });

    // Calculate statistics
    const totalReturns = returns.length;
    const totalValue = returns.reduce((sum, ret) => sum + ret.totalAmount, 0);

    // Group by reason
    const byReason = returns.reduce((acc: any, ret) => {
      if (!acc[ret.reason]) {
        acc[ret.reason] = { count: 0, value: 0 };
      }
      acc[ret.reason].count += 1;
      acc[ret.reason].value += ret.totalAmount;
      return acc;
    }, {});

    // Group by product
    const productStats: Record<string, { 
      productName: string;
      quantity: number;
      value: number;
      returnRate: number;
    }> = {};

    returns.forEach(ret => {
      ret.items.forEach(item => {
        const key = item.productName;
        if (!productStats[key]) {
          productStats[key] = {
            productName: item.productName,
            quantity: 0,
            value: 0,
            returnRate: 0
          };
        }
        productStats[key].quantity += item.quantity;
        productStats[key].value += item.total;
      });
    });

    const topReturnedProducts = Object.values(productStats)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    // Group by customer
    const customerStats: Record<string, {
      customerName: string;
      returns: number;
      value: number;
    }> = {};

    returns.forEach(ret => {
      const key = ret.customerName;
      if (!customerStats[key]) {
        customerStats[key] = {
          customerName: ret.customerName,
          returns: 0,
          value: 0
        };
      }
      customerStats[key].returns += 1;
      customerStats[key].value += ret.totalAmount;
    });

    const topReturningCustomers = Object.values(customerStats)
      .sort((a, b) => b.returns - a.returns)
      .slice(0, 10);

    // Monthly trend
    const monthlyTrend: Record<string, { month: string; count: number; value: number }> = {};
    returns.forEach(ret => {
      const date = new Date(ret.returnDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyTrend[monthKey]) {
        monthlyTrend[monthKey] = {
          month: monthKey,
          count: 0,
          value: 0
        };
      }
      monthlyTrend[monthKey].count += 1;
      monthlyTrend[monthKey].value += ret.totalAmount;
    });

    const trendData = Object.values(monthlyTrend).sort((a, b) => a.month.localeCompare(b.month));

    res.json({
      summary: {
        totalReturns,
        totalValue,
        averageReturnValue: totalReturns > 0 ? totalValue / totalReturns : 0
      },
      byReason,
      topReturnedProducts,
      topReturningCustomers,
      monthlyTrend: trendData,
      returns
    });
  } catch (error) {
    console.error('Returns report error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
