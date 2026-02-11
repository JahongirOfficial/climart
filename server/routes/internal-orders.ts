import { Router, Request, Response } from 'express';
import InternalOrder from '../models/InternalOrder';
import WarehouseTransfer from '../models/WarehouseTransfer';
import Product from '../models/Product';
import mongoose from 'mongoose';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const orders = await InternalOrder.find()
      .populate('sourceWarehouse')
      .populate('destinationWarehouse')
      .populate('items.product')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.post('/', async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const count = await InternalOrder.countDocuments();
    const orderNumber = `IO-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    for (const item of req.body.items) {
      const product = await Product.findById(item.product).session(session);
      if (!product || product.quantity < item.quantity) {
        throw new Error(`Insufficient inventory for ${item.productName}`);
      }
    }

    const order = new InternalOrder({
      ...req.body,
      orderNumber,
    });

    await order.save({ session });
    await session.commitTransaction();
    res.status(201).json(order);
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message || 'Invalid data', error });
  } finally {
    session.endSession();
  }
});

router.patch('/:id/approve', async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await InternalOrder.findById(req.params.id).session(session);
    if (!order) {
      throw new Error('Order not found');
    }

    order.status = 'approved';
    await order.save({ session });

    const transferCount = await WarehouseTransfer.countDocuments();
    const transferNumber = `WT-${new Date().getFullYear()}-${String(transferCount + 1).padStart(3, '0')}`;

    const transfer = new WarehouseTransfer({
      transferNumber,
      sourceWarehouse: order.sourceWarehouse,
      sourceWarehouseName: order.sourceWarehouseName,
      destinationWarehouse: order.destinationWarehouse,
      destinationWarehouseName: order.destinationWarehouseName,
      transferDate: new Date(),
      items: order.items,
      status: 'pending',
    });

    await transfer.save({ session });

    await session.commitTransaction();
    res.json({ order, transfer });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message || 'Invalid data', error });
  } finally {
    session.endSession();
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const order = await InternalOrder.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.json({ message: 'Order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
