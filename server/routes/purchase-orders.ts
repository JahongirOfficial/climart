import { Router, Request, Response } from 'express';
import PurchaseOrder from '../models/PurchaseOrder';

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
    const count = await PurchaseOrder.countDocuments();
    const orderNumber = `ZP-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

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
    const order = await PurchaseOrder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ message: 'Purchase order not found' });
    }
    res.json(order);
  } catch (error) {
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

export default router;
