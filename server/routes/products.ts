import { Router, Request, Response } from 'express';
import Product from '../models/Product';
import CustomerInvoice from '../models/CustomerInvoice';
import QRCode from 'qrcode';
import { subDays } from 'date-fns';

const router = Router();

// Get all products with forecasting
// Get all products with forecasting (Optimized)
router.get('/', async (req: Request, res: Response) => {
  try {
    const sevenDaysAgo = subDays(new Date(), 7);

    // Fetch all products as plain JS objects (lean) with only necessary fields
    const products = await Product.find()
      .select('name sku barcode quantity unit costPrice sellingPrice minStock category brand supplier warehouse createdAt')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Aggregate sales for ALL products in the last 7 days in a SINGLE query
    const salesStats = await CustomerInvoice.aggregate([
      {
        $match: {
          invoiceDate: { $gte: sevenDaysAgo }
        }
      },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          totalSold: { $sum: '$items.quantity' }
        }
      }
    ]).allowDiskUse(true);

    // Create a map for quick access: productId -> totalSold
    const salesMap = new Map();
    salesStats.forEach(stat => {
      salesMap.set(stat._id.toString(), stat.totalSold);
    });

    // Merge stats with products
    const productsWithForecast = products.map((product: any) => {
      const totalSold = salesMap.get(product._id.toString()) || 0;
      const dailyAverage = totalSold / 7;
      const daysRemaining = dailyAverage > 0 ? Math.max(0, product.quantity / dailyAverage) : Infinity;

      return {
        ...product,
        dailyAverage,
        daysRemaining
      };
    });

    res.json(productsWithForecast);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get low stock products
router.get('/low-stock', async (req: Request, res: Response) => {
  try {
    const products = await Product.find({
      $expr: { $lte: ['$quantity', '$minStock'] }
    })
      .sort({ quantity: 1 })
      .lean();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

import WarehouseReceipt from '../models/WarehouseReceipt';
import Writeoff from '../models/Writeoff';
import CustomerReturn from '../models/CustomerReturn';

// ... other imports ...

// Get product history (Ledger)
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const history: any[] = [];

    // 1. Sales (Outflows)
    const sales = await CustomerInvoice.find({ 'items.product': productId });
    sales.forEach(inv => {
      const item = inv.items.find(i => i.product.toString() === productId);
      if (item) {
        history.push({
          date: inv.invoiceDate,
          type: 'Sotuv',
          documentNumber: inv.invoiceNumber,
          change: -item.quantity,
          note: `Mijoz: ${inv.customerName}`
        });
      }
    });

    // 2. Warehouse Receipts (Inflows)
    const receipts = await WarehouseReceipt.find({ 'items.product': productId });
    receipts.forEach(rec => {
      const item = rec.items.find(i => i.product.toString() === productId);
      if (item) {
        history.push({
          date: rec.receiptDate,
          type: 'Kirim',
          documentNumber: rec.receiptNumber,
          change: item.quantity,
          note: `Ombor: ${rec.warehouseName}`
        });
      }
    });

    // 3. Write-offs (Outflows)
    const writeoffs = await Writeoff.find({ 'items.product': productId });
    writeoffs.forEach(wo => {
      const item = wo.items.find(i => i.product.toString() === productId);
      if (item) {
        history.push({
          date: wo.writeoffDate,
          type: 'Hisobdan chiqarish',
          documentNumber: wo.writeoffNumber,
          change: -item.quantity,
          note: `Sabab: ${wo.reason}`
        });
      }
    });

    // 4. Returns from Customers (Inflows)
    const customerReturns = await CustomerReturn.find({ 'items.product': productId });
    customerReturns.forEach(ret => {
      const item = ret.items.find(i => i.product.toString() === productId);
      if (item) {
        history.push({
          date: ret.returnDate,
          type: 'Mijoz qaytarishi',
          documentNumber: ret.returnNumber,
          change: item.quantity,
          note: `Mijoz: ${ret.customerName}`
        });
      }
    });

    // Sort by date descending
    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Optional: Calculate running balance if needed
    // For now, return the movement list
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get product by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create new product with QR code
router.post('/', async (req: Request, res: Response) => {
  try {
    const product = new Product(req.body);

    // Generate QR code (can contain product ID or SKU)
    const qrData = product.sku || product._id.toString();
    product.qrCode = await QRCode.toDataURL(qrData);

    await product.save();
    res.status(201).json(product);
  } catch (error: any) {
    console.error('Product creation error:', error);
    res.status(400).json({ 
      message: 'Invalid data', 
      error: error.message,
      details: error.errors || error
    });
  }
});

// Update product
router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (req.body.sku) {
      req.body.qrCode = await QRCode.toDataURL(req.body.sku);
    } else {
      // If SKU is not in body, check if product has one and missing qrCode
      const existingProduct = await Product.findById(req.params.id);
      if (existingProduct && existingProduct.sku && !existingProduct.qrCode) {
        req.body.qrCode = await QRCode.toDataURL(existingProduct.sku);
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Delete product
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
