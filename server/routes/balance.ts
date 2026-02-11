import { Router, Request, Response } from 'express';
import Product from '../models/Product';
import CustomerOrder from '../models/CustomerOrder';
import InternalOrder from '../models/InternalOrder';

const router = Router();

// Get stock balance report
router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, hideZero } = req.query;
    const filter: any = {};

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (hideZero === 'true') {
      filter.quantity = { $gt: 0 };
    }

    // Fetch products with only necessary fields
    const products = await Product.find(filter)
      .select('name sku category unit quantity costPrice sellingPrice minStock')
      .sort({ name: 1 })
      .lean();

    // Fetch relevant orders to calculate reserved quantities
    const [customerOrders, internalOrders] = await Promise.all([
      CustomerOrder.find({
        status: { $in: ['pending', 'confirmed'] },
        reserved: true
      }).select('items.product items.quantity').lean(),
      InternalOrder.find({
        status: { $in: ['new', 'approved', 'partial'] }
      }).select('items.product items.requestedQuantity items.shippedQuantity').lean()
    ]);

    // Build reserved quantities map efficiently
    const reservedMap: Record<string, number> = {};

    customerOrders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        const productId = item.product.toString();
        reservedMap[productId] = (reservedMap[productId] || 0) + item.quantity;
      });
    });

    internalOrders.forEach((order: any) => {
      order.items.forEach((item: any) => {
        const productId = item.product.toString();
        const remaining = Math.max(0, item.requestedQuantity - (item.shippedQuantity || 0));
        reservedMap[productId] = (reservedMap[productId] || 0) + remaining;
      });
    });

    // Build balance report and calculate totals in one pass
    const balanceReport = [];
    let totalQuantity = 0;
    let totalReserved = 0;
    let totalAvailable = 0;
    let totalCostValue = 0;
    let totalSellingValue = 0;
    let totalPotentialProfit = 0;
    let lowStockCount = 0;
    let negativeStockCount = 0;

    for (const product of products) {
      const reserved = reservedMap[product._id.toString()] || 0;
      const available = product.quantity - reserved;
      const costValue = product.quantity * product.costPrice;
      const sellingValue = product.quantity * product.sellingPrice;
      const minStock = product.minStock || 0;
      const isLowStock = product.quantity <= minStock && minStock > 0;
      const potentialProfit = sellingValue - costValue;

      balanceReport.push({
        _id: product._id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        unit: product.unit,
        quantity: product.quantity,
        reserved,
        available,
        minStock,
        isLowStock,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        costValue,
        sellingValue,
        potentialProfit,
      });

      // Update totals
      totalQuantity += product.quantity;
      totalReserved += reserved;
      totalAvailable += available;
      totalCostValue += costValue;
      totalSellingValue += sellingValue;
      totalPotentialProfit += potentialProfit;
      if (isLowStock) lowStockCount++;
      if (product.quantity < 0) negativeStockCount++;
    }

    res.json({
      items: balanceReport,
      totals: {
        totalQuantity,
        totalReserved,
        totalAvailable,
        totalCostValue,
        totalSellingValue,
        totalPotentialProfit,
        lowStockCount,
        negativeStockCount,
      },
    });
  } catch (error) {
    console.error('Balance report error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
