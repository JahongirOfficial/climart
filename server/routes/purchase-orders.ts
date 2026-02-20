import { Router, Request, Response } from 'express';
import PurchaseOrder from '../models/PurchaseOrder';
import { generateDocNumber } from '../utils/documentNumber';

const router = Router();

// Get all purchase orders
router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, status } = req.query;
    const filter: any = {};

    if (startDate || endDate) {
      filter.createdAt = {}; // Use createdAt or orderDate if available
      if (startDate) filter.createdAt.$gte = new Date(startDate as string);
      if (endDate) filter.createdAt.$lte = new Date(endDate as string);
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    const orders = await PurchaseOrder.find(filter)
      .populate('supplier')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get purchase order by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await PurchaseOrder.findById(req.params.id).populate('supplier');
    if (!order) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create new purchase order
router.post('/', async (req: Request, res: Response) => {
  try {
    // Generate order number
    const orderNumber = await generateDocNumber('ZP');

    const order = new PurchaseOrder({
      ...req.body,
      orderNumber,
    });

    await order.save();
    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Update purchase order
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const order = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!order) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Update order status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const order = await PurchaseOrder.findById(req.params.id).populate('supplier');
    
    if (!order) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    // Agar status "received" ga o'zgartirilsa, avtomatik supplier invoice yaratish
    if (status === 'received' && order.status !== 'received') {
      const SupplierInvoice = require('../models/SupplierInvoice').default;
      
      // Invoice raqamini generatsiya qilish
      const invoiceNumber = await generateDocNumber('INV-S', { padWidth: 4 });
      
      // To'lov muddatini hisoblash (30 kun)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
      
      // Supplier invoice yaratish
      const invoice = new SupplierInvoice({
        invoiceNumber,
        supplier: order.supplier._id || order.supplier,
        supplierName: order.supplierName,
        purchaseOrder: order._id,
        orderNumber: order.orderNumber,
        invoiceDate: new Date(),
        dueDate,
        items: order.items.map((item: any) => ({
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        totalAmount: order.totalAmount,
        paidAmount: 0,
        status: 'unpaid',
        notes: `Avtomatik yaratilgan: ${order.orderNumber} buyurtmasi qabul qilindi`
      });
      
      await invoice.save();
    }

    // Statusni yangilash
    order.status = status;
    await order.save();
    
    res.json(order);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Delete purchase order
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const order = await PurchaseOrder.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    res.json({ message: 'Purchase order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Receive order with warehouse distributions
router.post('/:id/receive', async (req: Request, res: Response) => {
  try {
    const { distributions } = req.body;
    const order = await PurchaseOrder.findById(req.params.id).populate('supplier');
    
    if (!order) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }

    if (order.status === 'received') {
      return res.status(400).json({ message: 'Order already received' });
    }

    // Import models
    const Product = require('../models/Product').default;
    const SupplierInvoice = require('../models/SupplierInvoice').default;

    // Import Warehouse model for name lookup
    const Warehouse = require('../models/Warehouse').default;

    // Update product quantities in each warehouse
    for (const dist of distributions) {
      // Get warehouse name if not provided
      let warehouseName = dist.warehouseName;
      if (!warehouseName) {
        const wh = await Warehouse.findById(dist.warehouse);
        warehouseName = wh?.name || '';
      }

      for (const item of dist.items) {
        // Find product by ID or by name
        let product = item.product ? await Product.findById(item.product) : null;
        if (!product && item.productName) {
          product = await Product.findOne({ name: item.productName });
        }
        if (!product) continue;

        // Add quantity to product's total
        product.quantity += item.quantity;

        // Update warehouse-specific quantity
        const warehouseIndex = product.stockByWarehouse?.findIndex(
          (wq: any) => wq.warehouse.toString() === dist.warehouse
        );

        if (warehouseIndex !== undefined && warehouseIndex >= 0) {
          product.stockByWarehouse[warehouseIndex].quantity += item.quantity;
        } else {
          if (!product.stockByWarehouse) {
            product.stockByWarehouse = [];
          }
          product.stockByWarehouse.push({
            warehouse: dist.warehouse,
            warehouseName,
            quantity: item.quantity,
            reserved: 0
          });
        }

        await product.save();
      }
    }

    // Update order status
    order.status = 'received';
    await order.save();

    // Create supplier invoice (auxiliary - should not block success)
    let invoice = null;
    try {
      const invoiceNumber = await generateDocNumber('INV-S', { padWidth: 4 });

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const supplierId = order.supplier?._id || order.supplier;

      invoice = new SupplierInvoice({
        invoiceNumber,
        supplier: supplierId,
        supplierName: order.supplierName,
        purchaseOrder: order._id,
        orderNumber: order.orderNumber,
        invoiceDate: new Date(),
        dueDate,
        items: order.items.map((item: any) => ({
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          total: item.total,
        })),
        totalAmount: order.totalAmount,
        paidAmount: 0,
        notes: `Avtomatik yaratilgan: ${order.orderNumber} buyurtmasi qabul qilindi`
      });

      await invoice.save();
    } catch (invoiceError) {
      console.error('SupplierInvoice yaratishda xatolik (buyurtma qabul qilindi):', invoiceError);
    }

    res.json({
      message: 'Order received successfully',
      order,
      invoice
    });
  } catch (error) {
    console.error('Error receiving order:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
