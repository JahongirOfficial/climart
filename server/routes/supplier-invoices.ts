import { Router, Request, Response } from 'express';
import SupplierInvoice from '../models/SupplierInvoice';

const router = Router();

// Get all supplier invoices
router.get('/', async (req: Request, res: Response) => {
  try {
    const invoices = await SupplierInvoice.find()
      .populate('supplier')
      .populate('purchaseOrder')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get invoice by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await SupplierInvoice.findById(req.params.id)
      .populate('supplier')
      .populate('purchaseOrder');
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create new invoice
router.post('/', async (req: Request, res: Response) => {
  try {
    // Generate invoice number
    const count = await SupplierInvoice.countDocuments();
    const invoiceNumber = `SF-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;
    
    const invoice = new SupplierInvoice({
      ...req.body,
      invoiceNumber,
    });
    
    await invoice.save();
    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Update invoice
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await SupplierInvoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Add payment to invoice
router.post('/:id/payment', async (req: Request, res: Response) => {
  try {
    const { amount } = req.body;
    const invoice = await SupplierInvoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    
    invoice.paidAmount += amount;
    await invoice.save();
    
    res.json(invoice);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Get creditor debt (total unpaid amount)
router.get('/stats/debt', async (req: Request, res: Response) => {
  try {
    const invoices = await SupplierInvoice.find({ status: { $ne: 'paid' } });
    const totalDebt = invoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);
    
    res.json({
      totalDebt,
      unpaidCount: invoices.filter(inv => inv.status === 'unpaid').length,
      partialCount: invoices.filter(inv => inv.status === 'partial').length,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Delete invoice
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await SupplierInvoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }
    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
