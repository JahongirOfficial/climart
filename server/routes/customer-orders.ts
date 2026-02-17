import { Router, Request, Response } from 'express';
import CustomerOrder from '../models/CustomerOrder';
import Product from '../models/Product';
import mongoose from 'mongoose';

const router = Router();

// Get all customer orders
router.get('/', async (req: Request, res: Response) => {
  try {
    const orders = await CustomerOrder.find()
      .populate('customer')
      .populate('items.product')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get customer order by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await CustomerOrder.findById(req.params.id)
      .populate('customer')
      .populate('items.product');
    if (!order) {
      return res.status(404).json({ message: 'Customer order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create new customer order (no inventory validation - just creates order)
router.post('/', async (req: Request, res: Response) => {
  try {
    // Generate unique order number by finding the last order
    const currentYear = new Date().getFullYear();
    const lastOrder = await CustomerOrder.findOne({
      orderNumber: new RegExp(`^CO-${currentYear}-`)
    }).sort({ orderNumber: -1 });

    let orderNumber: string;
    if (lastOrder && lastOrder.orderNumber) {
      // Extract number from last order and increment
      const match = lastOrder.orderNumber.match(/CO-\d{4}-(\d{3})/);
      if (match) {
        const lastNumber = parseInt(match[1], 10);
        orderNumber = `CO-${currentYear}-${String(lastNumber + 1).padStart(3, '0')}`;
      } else {
        orderNumber = `CO-${currentYear}-001`;
      }
    } else {
      orderNumber = `CO-${currentYear}-001`;
    }

    // Create order without inventory validation
    const order = new CustomerOrder({
      ...req.body,
      orderNumber,
    });

    await order.save();
    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Invalid data', error });
  }
});

// Update customer order
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const order = await CustomerOrder.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!order) {
      return res.status(404).json({ message: 'Customer order not found' });
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
    const order = await CustomerOrder.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) {
      return res.status(404).json({ message: 'Customer order not found' });
    }
    res.json(order);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Delete customer order and release reserved items
router.delete('/:id', async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await CustomerOrder.findById(req.params.id).session(session);
    if (!order) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Customer order not found' });
    }

    // Release reserved items if order was reserved
    if (order.reserved) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { reserved: -item.quantity } },
          { session }
        );
      }
    }

    await CustomerOrder.findByIdAndDelete(req.params.id).session(session);
    await session.commitTransaction();
    res.json({ message: 'Customer order deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: 'Server error', error });
  } finally {
    session.endSession();
  }
});

// Reserve items for order (allows negative inventory with warnings)
router.patch('/:id/reserve', async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await CustomerOrder.findById(req.params.id).session(session);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.reserved) {
      throw new Error('Order already reserved');
    }

    const warnings = [];

    // Check availability and reserve (allow negative)
    for (const item of order.items) {
      const product = await Product.findById(item.product).session(session);
      if (!product) {
        throw new Error(`Product not found`);
      }
      
      const available = product.quantity - product.reserved;
      if (available < item.quantity) {
        warnings.push(`${item.productName}: Mavjud ${available}, So'ralgan ${item.quantity}`);
      }

      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { reserved: item.quantity } },
        { session }
      );
    }

    order.reserved = true;
    order.status = 'confirmed';
    await order.save({ session });

    await session.commitTransaction();
    
    // Return order with warnings if any
    const response: any = { order };
    if (warnings.length > 0) {
      response.warnings = warnings;
    }
    
    res.json(response);
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message || 'Failed to reserve', error });
  } finally {
    session.endSession();
  }
});

// Release reserved items
router.patch('/:id/unreserve', async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await CustomerOrder.findById(req.params.id).session(session);
    if (!order) {
      throw new Error('Order not found');
    }

    if (!order.reserved) {
      throw new Error('Order is not reserved');
    }

    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { reserved: -item.quantity } },
        { session }
      );
    }

    order.reserved = false;
    order.status = 'pending';
    await order.save({ session });

    await session.commitTransaction();
    res.json(order);
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message || 'Failed to unreserve', error });
  } finally {
    session.endSession();
  }
});

export default router;
