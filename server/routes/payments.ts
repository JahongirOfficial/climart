import { Router, Request, Response } from 'express';
import Payment from '../models/Payment';
import Partner from '../models/Partner';
import multer from 'multer';
import csv from 'csv-parser';
import { Readable } from 'stream';
import { logAudit } from '../utils/auditLogger';
import { generateDocNumber } from '../utils/documentNumber';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

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
    let prefix = 'PAY';
    if (req.body.type === 'incoming') prefix = 'IN';
    if (req.body.type === 'outgoing') prefix = 'OUT';
    if (req.body.type === 'transfer') prefix = 'TR';

    const paymentNumber = await generateDocNumber(prefix, { padWidth: 4 });
    
    const payment = new Payment({
      ...req.body,
      paymentNumber,
    });
    
    await payment.save();
    
    // Agar to'lov purchase order bilan bog'langan bo'lsa, supplier invoice ni yangilash
    if (req.body.linkedDocumentType === 'PurchaseOrder' && req.body.linkedDocument) {
      const SupplierInvoice = require('../models/SupplierInvoice').default;
      
      // Purchase order ga tegishli invoice ni topish
      const invoice = await SupplierInvoice.findOne({ 
        order: req.body.linkedDocument 
      });
      
      if (invoice) {
        // Invoice ga to'lovni qo'shish
        invoice.paidAmount += payment.amount;
        
        // Status avtomatik yangilanadi (pre-save hook orqali)
        await invoice.save();
        
        // Payment ga invoice ma'lumotini qo'shish
        payment.linkedDocument = invoice._id;
        payment.linkedDocumentType = 'SupplierInvoice';
        payment.linkedDocumentNumber = invoice.invoiceNumber;
        await payment.save();
      }
    }
    
    logAudit({
      userId: req.user?.userId,
      userName: req.user?.name || 'Noma\'lum',
      action: 'create',
      entity: 'Payment',
      entityId: payment._id.toString(),
      entityName: `${payment.paymentNumber} - ${payment.partnerName || ''} - ${payment.amount?.toLocaleString()} so'm`,
      ipAddress: req.ip,
    });

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
    
    logAudit({
      userId: req.user?.userId,
      userName: req.user?.name || 'Noma\'lum',
      action: 'delete',
      entity: 'Payment',
      entityId: req.params.id,
      entityName: `${payment.paymentNumber} - ${payment.partnerName || ''} - ${payment.amount?.toLocaleString()} so'm`,
      ipAddress: req.ip,
    });

    await Payment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Payment deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Import payments from CSV
router.post('/import', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const results: any[] = [];
    const stream = Readable.from(req.file.buffer.toString());

    stream
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          let imported = 0;
          const errors: string[] = [];

          for (const row of results) {
            try {
              // Map CSV columns to payment fields
              const paymentData: any = {
                type: row['Turi'] || row['type'],
                paymentDate: new Date(row['Sana'] || row['date']),
                amount: parseFloat(row['Summa'] || row['amount']),
                purpose: row['Maqsad'] || row['purpose'] || 'Import qilingan',
                account: row['Hisob'] || row['account'] || 'bank',
                paymentMethod: row['To\'lov usuli'] || row['paymentMethod'] || 'bank_transfer',
                status: 'confirmed',
              };

              // Add optional fields
              if (row['Kontragent'] || row['partner']) {
                paymentData.partnerName = row['Kontragent'] || row['partner'];
              }

              if (row['Kategoriya'] || row['category']) {
                paymentData.category = row['Kategoriya'] || row['category'];
              }

              if (row['Izoh'] || row['notes']) {
                paymentData.notes = row['Izoh'] || row['notes'];
              }

              // Generate payment number
              let importPrefix = 'PAY';
              if (paymentData.type === 'incoming') importPrefix = 'IN';
              if (paymentData.type === 'outgoing') importPrefix = 'OUT';
              if (paymentData.type === 'transfer') importPrefix = 'TR';

              paymentData.paymentNumber = await generateDocNumber(importPrefix, { padWidth: 4 });

              // Create payment
              await Payment.create(paymentData);
              imported++;
            } catch (error) {
              errors.push(`Row ${imported + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }

          res.json({
            imported,
            total: results.length,
            errors: errors.length > 0 ? errors : undefined,
          });
        } catch (error) {
          res.status(500).json({ message: 'Import failed', error });
        }
      });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;