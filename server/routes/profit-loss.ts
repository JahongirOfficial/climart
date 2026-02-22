import { Router, Request, Response } from 'express';
import Shipment from '../models/Shipment';
import CustomerReturn from '../models/CustomerReturn';
import Payment from '../models/Payment';
import Writeoff from '../models/Writeoff';
import Product from '../models/Product';

const router = Router();

// Get profit and loss report
router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, organization } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    
    const filter: any = {
      createdAt: { $gte: start, $lte: end },
    };
    
    if (organization) {
      filter.organization = organization;
    }
    
    // 1. Calculate Revenue (Выручка) from shipments
    const shipments = await Shipment.find({
      ...filter,
      status: { $in: ['in_transit', 'delivered'] },
    });
    
    let revenue = 0;
    let costOfGoodsSold = 0;
    
    for (const shipment of shipments) {
      revenue += (shipment.totalAmount || 0) * ((shipment as any).exchangeRate || 1);
      
      // Calculate cost of goods sold
      for (const item of shipment.items) {
        const product = await Product.findById(item.product);
        if (product) {
          costOfGoodsSold += item.quantity * product.costPrice;
        }
      }
    }
    
    // 2. Calculate Returns (Возвраты)
    const returns = await CustomerReturn.find({
      ...filter,
      status: 'accepted',
    });
    
    let returnAmount = 0;
    let returnCost = 0;
    
    for (const returnDoc of returns) {
      returnAmount += (returnDoc.totalAmount || 0) * ((returnDoc as any).exchangeRate || 1);
      
      for (const item of returnDoc.items) {
        const product = await Product.findById(item.product);
        if (product) {
          returnCost += item.quantity * product.costPrice;
        }
      }
    }
    
    // 3. Calculate Writeoffs (Списания)
    const writeoffs = await Writeoff.find({
      ...filter,
      status: 'confirmed',
    });
    
    let writeoffAmount = 0;
    writeoffs.forEach(writeoff => {
      writeoff.items.forEach(item => {
        writeoffAmount += item.total;
      });
    });
    
    // 4. Calculate Operating Expenses (Операционные расходы)
    const expenses = await Payment.find({
      ...filter,
      type: 'outgoing',
      status: 'confirmed',
    });
    
    const expensesByCategory: any = {};
    let totalExpenses = 0;
    
    expenses.forEach(expense => {
      const category = expense.category || 'Other';
      if (!expensesByCategory[category]) {
        expensesByCategory[category] = 0;
      }
      expensesByCategory[category] += expense.amount * ((expense as any).exchangeRate || 1);
      totalExpenses += expense.amount * ((expense as any).exchangeRate || 1);
    });
    
    // 5. Calculate Gross Profit (Валовая прибыль)
    const netRevenue = revenue - returnAmount;
    const netCost = costOfGoodsSold - returnCost;
    const grossProfit = netRevenue - netCost;
    const grossProfitMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;
    
    // 6. Calculate Operating Profit (Операционная прибыль)
    const operatingProfit = grossProfit - totalExpenses - writeoffAmount;
    
    // 7. Calculate Net Profit (Чистая прибыль)
    const netProfit = operatingProfit;
    const netProfitMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;
    
    res.json({
      period: {
        startDate: start,
        endDate: end,
      },
      revenue: {
        gross: revenue,
        returns: returnAmount,
        net: netRevenue,
      },
      costs: {
        costOfGoodsSold: netCost,
        writeoffs: writeoffAmount,
        total: netCost + writeoffAmount,
      },
      grossProfit: {
        amount: grossProfit,
        margin: grossProfitMargin,
      },
      expenses: {
        byCategory: expensesByCategory,
        total: totalExpenses,
      },
      operatingProfit: {
        amount: operatingProfit,
      },
      netProfit: {
        amount: netProfit,
        margin: netProfitMargin,
      },
      summary: {
        revenue: netRevenue,
        totalCosts: netCost + writeoffAmount + totalExpenses,
        netProfit: netProfit,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
