import { Router, Request, Response } from 'express';
import CustomerReturn from '../models/CustomerReturn';
import CustomerInvoice from '../models/CustomerInvoice';
import Product from '../models/Product';
import Partner from '../models/Partner';
import mongoose from 'mongoose';

const router = Router();

// Get all customer returns
router.get('/', async (req: Request, res: Response) => {
  try {
    const returns = await CustomerReturn.find()
      .populate('customer')
      .populate('invoice')
      .populate('items.product')
      .sort({ createdAt: -1 });
    res.json(returns);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get return by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const customerReturn = await CustomerReturn.findById(req.params.id)
      .populate('customer')
      .populate('invoice')
      .populate('items.product');
    if (!customerReturn) {
      return res.status(404).json({ message: 'Return not found' });
    }
    res.json(customerReturn);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create new customer return with inventory and account balance update
router.post('/', async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Generate return number
    const count = await CustomerReturn.countDocuments();
    const returnNumber = `CR-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    // Validate invoice exists
    const invoice = await CustomerInvoice.findById(req.body.invoice).session(session);
    if (!invoice) {
      throw new Error('Invoice not found');
    }

    // Validate return quantities against invoice
    for (const item of req.body.items) {
      const invoiceItem = invoice.items.find(
        (invItem: any) => invItem.product.toString() === item.product
      );
      
      if (!invoiceItem) {
        throw new Error(`Product not found in invoice`);
      }
      
      if (item.quantity > invoiceItem.quantity) {
        throw new Error(
          `Return quantity (${item.quantity}) exceeds invoice quantity (${invoiceItem.quantity})`
        );
      }
    }

    // Create return
    const customerReturn = new CustomerReturn({
      ...req.body,
      returnNumber,
    });

    await customerReturn.save({ session });

    // Update inventory (increase quantities)
    for (const item of req.body.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: item.quantity } },
        { session }
      );
    }

    // Update customer account balance (reduce debt)
    await Partner.findByIdAndUpdate(
      req.body.customer,
      { $inc: { balance: -req.body.totalAmount } },
      { session }
    );

    // Update invoice paid amount (reduce)
    await CustomerInvoice.findByIdAndUpdate(
      req.body.invoice,
      { $inc: { paidAmount: -req.body.totalAmount } },
      { session }
    );

    await session.commitTransaction();
    res.status(201).json(customerReturn);
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message || 'Invalid data', error });
  } finally {
    session.endSession();
  }
});

// Update return status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const customerReturn = await CustomerReturn.findById(req.params.id);
    
    if (!customerReturn) {
      return res.status(404).json({ message: 'Return not found' });
    }

    customerReturn.status = status;
    await customerReturn.save();

    res.json(customerReturn);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Delete return
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const customerReturn = await CustomerReturn.findByIdAndDelete(req.params.id);
    if (!customerReturn) {
      return res.status(404).json({ message: 'Return not found' });
    }
    res.json({ message: 'Return deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
