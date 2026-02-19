import { Router, Request, Response } from 'express';
import Receipt from '../models/Receipt';
import Product from '../models/Product';
import PurchaseOrder from '../models/PurchaseOrder';
import mongoose from 'mongoose';
import { logAudit } from '../utils/auditLogger';
import { generateDocNumber } from '../utils/documentNumber';

const router = Router();

// Get all receipts with optional date filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    let query: any = {};

    if (startDate || endDate) {
      query.receiptDate = {};
      if (startDate) query.receiptDate.$gte = new Date(startDate as string);
      if (endDate) query.receiptDate.$lte = new Date(endDate as string);
    }

    const receipts = await Receipt.find(query)
      .populate('supplier')
      .populate('purchaseOrder')
      .sort({ receiptDate: -1, createdAt: -1 })
      .lean();
    res.json(receipts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get receipt by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const receipt = await Receipt.findById(req.params.id)
      .populate('supplier')
      .populate('purchaseOrder')
      .populate('items.product');
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }
    res.json(receipt);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create new receipt (with warehouse update)
router.post('/', async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Generate receipt number
    const receiptNumber = await generateDocNumber('QQ');

    const receipt = new Receipt({
      ...req.body,
      receiptNumber,
      createdBy: req.user?.userId,
    });

    // Update warehouse quantities and cost prices
    for (const item of receipt.items) {
      const product = await Product.findById(item.product).session(session);

      if (!product) {
        throw new Error(`Product ${item.productName} not found`);
      }

      // Calculate weighted average cost price
      const oldQuantity = product.quantity;
      const oldCostPrice = product.costPrice;
      const newQuantity = oldQuantity + item.quantity;

      // Update cost price (weighted average)
      if (newQuantity > 0) {
        product.costPrice = ((oldQuantity * oldCostPrice) + (item.quantity * item.costPrice)) / newQuantity;
      }
      product.quantity = newQuantity;

      // Update warehouse-specific stock if warehouse is specified
      const warehouseId = req.body.warehouse;
      if (warehouseId) {
        const warehouseStock = product.stockByWarehouse.find(
          (sw: any) => sw.warehouse.toString() === warehouseId.toString()
        );
        if (warehouseStock) {
          warehouseStock.quantity += item.quantity;
        } else {
          product.stockByWarehouse.push({
            warehouse: warehouseId,
            warehouseName: req.body.warehouseName || '',
            quantity: item.quantity,
            reserved: 0,
          });
        }
      }

      await product.save({ session });

      // Auto-correct negative sales
      const { correctPendingInvoices } = require('../utils/inventory');
      await correctPendingInvoices(item.product.toString(), item.costPrice, session);
    }

    // Update purchase order status if linked
    if (receipt.purchaseOrder) {
      await PurchaseOrder.findByIdAndUpdate(
        receipt.purchaseOrder,
        { status: 'received' },
        { session }
      );
    }

    await receipt.save({ session });
    await session.commitTransaction();

    logAudit({
      userId: req.user?.userId,
      userName: req.user?.name || 'Noma\'lum',
      action: 'create',
      entity: 'Receipt',
      entityId: receipt._id.toString(),
      entityName: `${receipt.receiptNumber} - ${receipt.supplierName || ''}`,
      ipAddress: req.ip,
    });

    res.status(201).json(receipt);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: 'Invalid data', error });
  } finally {
    session.endSession();
  }
});

// Create receipt from purchase order
router.post('/from-order/:orderId', async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await PurchaseOrder.findById(req.params.orderId)
      .populate('supplier')
      .session(session);

    if (!order) {
      throw new Error('Purchase order not found');
    }

    if (order.status === 'received') {
      throw new Error('This order has already been received');
    }

    // Generate receipt number
    const receiptNumber = await generateDocNumber('QQ');

    // Map product names to product IDs
    const receiptItems = [];
    for (const item of order.items) {
      // Try to find product by name
      const product = await Product.findOne({ name: item.productName }).session(session);
      
      if (!product) {
        throw new Error(`Product "${item.productName}" not found in database. Please create it first.`);
      }

      receiptItems.push({
        product: product._id,
        productName: item.productName,
        quantity: item.quantity,
        costPrice: item.price,
        total: item.total,
      });
    }

    // Create receipt from order
    const receipt = new Receipt({
      receiptNumber,
      supplier: order.supplier,
      supplierName: order.supplierName,
      purchaseOrder: order._id,
      orderNumber: order.orderNumber,
      receiptDate: new Date(),
      createdBy: req.user?.userId,
      items: receiptItems,
      totalAmount: order.totalAmount,
      notes: req.body.notes,
    });

    // Update warehouse quantities and cost prices
    for (const item of receipt.items) {
      const product = await Product.findById(item.product).session(session);

      if (product) {
        // Calculate weighted average cost price
        const oldQuantity = product.quantity;
        const oldCostPrice = product.costPrice;
        const newQuantity = oldQuantity + item.quantity;

        // Update cost price (weighted average)
        if (newQuantity > 0) {
          product.costPrice = ((oldQuantity * oldCostPrice) + (item.quantity * item.costPrice)) / newQuantity;
        }
        product.quantity = newQuantity;

        await product.save({ session });

        // Auto-correct negative sales
        const { correctPendingInvoices } = require('../utils/inventory');
        await correctPendingInvoices(item.product.toString(), item.costPrice, session);
      }
    }

    // Update order status
    order.status = 'received';
    await order.save({ session });

    await receipt.save({ session });
    await session.commitTransaction();

    res.status(201).json(receipt);
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message || 'Failed to create receipt from order', error });
  } finally {
    session.endSession();
  }
});

// Delete receipt (reverse warehouse changes)
router.delete('/:id', async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const receipt = await Receipt.findById(req.params.id).session(session);

    if (!receipt) {
      throw new Error('Receipt not found');
    }

    // Reverse warehouse quantities
    for (const item of receipt.items) {
      const product = await Product.findById(item.product).session(session);

      if (product) {
        product.quantity -= item.quantity;
        if (product.quantity < 0) product.quantity = 0;
        await product.save({ session });
      }
    }

    // Update purchase order status if linked
    if (receipt.purchaseOrder) {
      await PurchaseOrder.findByIdAndUpdate(
        receipt.purchaseOrder,
        { status: 'pending' },
        { session }
      );
    }

    await Receipt.findByIdAndDelete(req.params.id).session(session);
    await session.commitTransaction();

    logAudit({
      userId: req.user?.userId,
      userName: req.user?.name || 'Noma\'lum',
      action: 'delete',
      entity: 'Receipt',
      entityId: req.params.id,
      entityName: `${receipt.receiptNumber} - ${receipt.supplierName || ''}`,
      ipAddress: req.ip,
    });

    res.json({ message: 'Receipt deleted and warehouse updated' });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Server error', error });
  } finally {
    session.endSession();
  }
});

export default router;
