import { Router, Request, Response } from 'express';
import Payment from '../models/Payment';
import Partner from '../models/Partner';

const router = Router();

// Get all payments with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, account, startDate, endDate, partner, category, status } = req.query;
    
    const filter: any = {};
    
    if (type) filter.type = type;
    if (account) filter.account = account;
    if (partner) filter.partner = partner;
    if (category) filter.category = category;
    if (status) filter.status = status;
    
    if (startDate && endDate) {
      filter.paymentDate = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string),
      };
    }
    
    const payments = await Payment.find(filter)
      .populate('partner')
      .sort({ paymentDate: -1, createdAt: -1 });
    
    // Calculate totals
    const totals = {
      incoming: payments.filter(p => p.type === 'incoming').reduce((sum, p) => sum + p.amount, 0),
      outgoing: payments.filter(p => p.type === 'outgoing').reduce((sum, p) => sum + p.amount, 0),
      cashBalance: 0,
      bankBalance: 0,
    };
    
    // Calculate balances
    payments.forEach(payment => {
      if (payment.status !== 'confirmed') return;
      
      if (payment.type === 'incoming') {
        if (payment.account === 'cash') totals.cashBalance += payment.amount;
        if (payment.account === 'bank') totals.bankBalance += payment.amount;
      } else if (payment.type === 'outgoing') {
        if (payment.account === 'cash') totals.cashBalance -= payment.amount;
        if (payment.account === 'bank') totals.bankBalance -= payment.amount;
      } else if (payment.type === 'transfer') {
        if (payment.fromAccount === 'cash') totals.cashBalance -= payment.amount;
        if (payment.fromAccount === 'bank') totals.bankBalance -= payment.amount;
        if (payment.toAccount === 'cash') totals.cashBalance += payment.amount;
        if (payment.toAccount === 'bank') totals.bankBalance += payment.amount;
      }
    });
    
    res.json({ payments, totals });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get payment by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const payment = await Payment.findById(req.params.id).populate('partner');
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create new payment
router.post('/', async (req: Request, res: Response) => {
  try {
    // Generate payment number based on type
    const count = await Payment.countDocuments();
    let prefix = 'PAY';
    if (req.body.type === 'incoming') prefix = 'IN';
    if (req.body.type === 'outgoing') prefix = 'OUT';
    if (req.body.type === 'transfer') prefix = 'TR';
    
    const paymentNumber = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;
    
    const payment = new Payment({
      ...req.body,
      paymentNumber,
    });
    
    await payment.save();
    
    res.status(201).json(payment);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Update payment
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    res.json(payment);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Confirm payment
router.patch('/:id/confirm', async (req: Request, res: Response) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    if (payment.status === 'confirmed') {
      return res.status(400).json({ message: 'Payment already confirmed' });
    }
    
    payment.status = 'confirmed';
    await payment.save();
    
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Cancel payment
router.patch('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    if (payment.status === 'cancelled') {
      return res.status(400).json({ message: 'Payment already cancelled' });
    }
    
    const wasConfirmed = payment.status === 'confirmed';
    payment.status = 'cancelled';
    await payment.save();
    
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Delete payment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const payment = await Payment.findById(req.params.id);
    
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;