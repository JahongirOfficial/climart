import { Router, Request, Response } from 'express';
import Shipment from '../models/Shipment';
import CustomerReturn from '../models/CustomerReturn';

const router = Router();

// Get profitability report
router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, groupBy = 'products' } = req.query;
    
    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate as string);
    }

    const query = Object.keys(dateFilter).length > 0 
      ? { shipmentDate: dateFilter }
      : {};

    // Get all shipments (sales) in date range
    const shipments = await Shipment.find(query)
      .populate('customer')
      .sort({ shipmentDate: -1 });

    // Get all returns in date range
    const returnQuery = Object.keys(dateFilter).length > 0 
      ? { returnDate: dateFilter }
      : {};
    const returns = await CustomerReturn.find(returnQuery)
      .populate('customer')
      .sort({ returnDate: -1 });

    // Calculate overall profitability
    let totalRevenue = 0;
    let totalCost = 0;
    let totalProfit = 0;
    let totalSalesQuantity = 0;

    let totalReturnRevenue = 0;
    let totalReturnCost = 0;
    let totalReturnLoss = 0;
    let totalReturnQuantity = 0;

    // Calculate sales
    shipments.forEach(shipment => {
      shipment.items.forEach((item: any) => {
        const revenue = item.quantity * item.price;
        const cost = item.quantity * (item.costPrice || item.price * 0.7); // Fallback if no cost
        totalRevenue += revenue;
        totalCost += cost;
        totalProfit += (revenue - cost);
        totalSalesQuantity += item.quantity;
      });
    });

    // Calculate returns
    returns.forEach(ret => {
      ret.items.forEach((item: any) => {
        const revenue = item.quantity * item.price;
        const cost = item.quantity * (item.costPrice || item.price * 0.7);
        totalReturnRevenue += revenue;
        totalReturnCost += cost;
        totalReturnLoss += (revenue - cost);
        totalReturnQuantity += item.quantity;
      });
    });

    // Net profitability (sales - returns)
    const netRevenue = totalRevenue - totalReturnRevenue;
    const netCost = totalCost - totalReturnCost;
    const netProfit = totalProfit - totalReturnLoss;
    const profitMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0;

    // Group by logic
    let groupedData: any[] = [];

    if (groupBy === 'products') {
      // Profitability by product
      const productData: Record<string, any> = {};

      shipments.forEach(shipment => {
        shipment.items.forEach((item: any) => {
          const key = item.productName;
          if (!productData[key]) {
            productData[key] = {
              name: item.productName,
              salesQuantity: 0,
              salesRevenue: 0,
              salesCost: 0,
              salesProfit: 0,
              returnQuantity: 0,
              returnRevenue: 0,
              returnCost: 0,
              returnLoss: 0,
            };
          }
          const revenue = item.quantity * item.price;
          const cost = item.quantity * (item.costPrice || item.price * 0.7);
          productData[key].salesQuantity += item.quantity;
          productData[key].salesRevenue += revenue;
          productData[key].salesCost += cost;
          productData[key].salesProfit += (revenue - cost);
        });
      });

      returns.forEach(ret => {
        ret.items.forEach((item: any) => {
          const key = item.productName;
          if (!productData[key]) {
            productData[key] = {
              name: item.productName,
              salesQuantity: 0,
              salesRevenue: 0,
              salesCost: 0,
              salesProfit: 0,
              returnQuantity: 0,
              returnRevenue: 0,
              returnCost: 0,
              returnLoss: 0,
            };
          }
          const revenue = item.quantity * item.price;
          const cost = item.quantity * (item.costPrice || item.price * 0.7);
          productData[key].returnQuantity += item.quantity;
          productData[key].returnRevenue += revenue;
          productData[key].returnCost += cost;
          productData[key].returnLoss += (revenue - cost);
        });
      });

      groupedData = Object.values(productData).map((item: any) => ({
        ...item,
        netRevenue: item.salesRevenue - item.returnRevenue,
        netCost: item.salesCost - item.returnCost,
        netProfit: item.salesProfit - item.returnLoss,
        profitMargin: (item.salesRevenue - item.returnRevenue) > 0 
          ? ((item.salesProfit - item.returnLoss) / (item.salesRevenue - item.returnRevenue)) * 100 
          : 0
      }));
    } else if (groupBy === 'customers') {
      // Profitability by customer
      const customerData: Record<string, any> = {};

      shipments.forEach(shipment => {
        const key = shipment.customerName;
        if (!customerData[key]) {
          customerData[key] = {
            name: shipment.customerName,
            salesQuantity: 0,
            salesRevenue: 0,
            salesCost: 0,
            salesProfit: 0,
            salesCount: 0,
            returnQuantity: 0,
            returnRevenue: 0,
            returnCost: 0,
            returnLoss: 0,
            returnCount: 0,
          };
        }
        customerData[key].salesCount += 1;
        shipment.items.forEach((item: any) => {
          const revenue = item.quantity * item.price;
          const cost = item.quantity * (item.costPrice || item.price * 0.7);
          customerData[key].salesQuantity += item.quantity;
          customerData[key].salesRevenue += revenue;
          customerData[key].salesCost += cost;
          customerData[key].salesProfit += (revenue - cost);
        });
      });

      returns.forEach(ret => {
        const key = ret.customerName;
        if (!customerData[key]) {
          customerData[key] = {
            name: ret.customerName,
            salesQuantity: 0,
            salesRevenue: 0,
            salesCost: 0,
            salesProfit: 0,
            salesCount: 0,
            returnQuantity: 0,
            returnRevenue: 0,
            returnCost: 0,
            returnLoss: 0,
            returnCount: 0,
          };
        }
        customerData[key].returnCount += 1;
        ret.items.forEach((item: any) => {
          const revenue = item.quantity * item.price;
          const cost = item.quantity * (item.costPrice || item.price * 0.7);
          customerData[key].returnQuantity += item.quantity;
          customerData[key].returnRevenue += revenue;
          customerData[key].returnCost += cost;
          customerData[key].returnLoss += (revenue - cost);
        });
      });

      groupedData = Object.values(customerData).map((item: any) => ({
        ...item,
        netRevenue: item.salesRevenue - item.returnRevenue,
        netCost: item.salesCost - item.returnCost,
        netProfit: item.salesProfit - item.returnLoss,
        profitMargin: (item.salesRevenue - item.returnRevenue) > 0 
          ? ((item.salesProfit - item.returnLoss) / (item.salesRevenue - item.returnRevenue)) * 100 
          : 0
      }));
    }

    // Sort by net profit
    groupedData.sort((a, b) => b.netProfit - a.netProfit);

    res.json({
      summary: {
        sales: {
          revenue: totalRevenue,
          cost: totalCost,
          profit: totalProfit,
          quantity: totalSalesQuantity,
          count: shipments.length
        },
        returns: {
          revenue: totalReturnRevenue,
          cost: totalReturnCost,
          loss: totalReturnLoss,
          quantity: totalReturnQuantity,
          count: returns.length
        },
        net: {
          revenue: netRevenue,
          cost: netCost,
          profit: netProfit,
          profitMargin
        }
      },
      groupedData,
      groupBy
    });
  } catch (error) {
    console.error('Profitability report error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
