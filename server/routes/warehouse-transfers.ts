import { Router, Request, Response } from 'express';
import WarehouseTransfer from '../models/WarehouseTransfer';
import Product from '../models/Product';
import mongoose from 'mongoose';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const transfers = await WarehouseTransfer.find()
      .populate('sourceWarehouse')
      .populate('destinationWarehouse')
      .populate('items.product')
      .sort({ createdAt: -1 });
    res.json(transfers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.post('/', async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const count = await WarehouseTransfer.countDocuments();
    const transferNumber = `WT-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    for (const item of req.body.items) {
      const product = await Product.findById(item.product).session(session);
      if (!product || product.quantity < item.quantity) {
        throw new Error(`Insufficient inventory for ${item.productName}`);
      }
    }

    const transfer = new WarehouseTransfer({
      ...req.body,
      transferNumber,
    });

    await transfer.save({ session });
    await session.commitTransaction();
    res.status(201).json(transfer);
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message || 'Invalid data', error });
  } finally {
    session.endSession();
  }
});

router.patch('/:id/status', async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { status } = req.body;
    const transfer = await WarehouseTransfer.findById(req.params.id).session(session);
    
    if (!transfer) {
      throw new Error('Transfer not found');
    }

    if (status === 'completed' && transfer.status !== 'completed') {
      for (const item of transfer.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { quantity: -item.quantity } },
          { session }
        );
      }
    }

    transfer.status = status;
    await transfer.save({ session });

    await session.commitTransaction();
    res.json(transfer);
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message || 'Invalid data', error });
  } finally {
    session.endSession();
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const transfer = await WarehouseTransfer.findByIdAndDelete(req.params.id);
    if (!transfer) {
      return res.status(404).json({ message: 'Transfer not found' });
    }
    res.json({ message: 'Transfer deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
