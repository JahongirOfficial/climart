import { Router, Request, Response } from 'express';
import TaxInvoice from '../models/TaxInvoice';
import Shipment from '../models/Shipment';

const router = Router();

// Get all tax invoices
router.get('/', async (req: Request, res: Response) => {
  try {
    const invoices = await TaxInvoice.find()
      .populate('customer')
      .populate('shipment')
      .sort({ createdAt: -1 });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get tax invoice by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await TaxInvoice.findById(req.params.id)
      .populate('customer')
      .populate('shipment');
    if (!invoice) {
      return res.status(404).json({ message: 'Tax invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create tax invoice from shipment
router.post('/', async (req: Request, res: Response) => {
  try {
    // Generate invoice number
    const count = await TaxInvoice.countDocuments();
    const invoiceNumber = `TI-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // Validate shipment exists
    const shipment = await Shipment.findById(req.body.shipment);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    // Calculate tax for each item
    const items = req.body.items.map((item: any) => {
      const subtotal = item.quantity * item.price;
      const taxAmount = subtotal * (item.taxRate / 100);
      const total = subtotal + taxAmount;
      return {
        ...item,
        subtotal,
        taxAmount,
        total,
      };
    });

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => sum + item.subtotal, 0);
    const totalTax = items.reduce((sum: number, item: any) => sum + item.taxAmount, 0);
    const totalAmount = subtotal + totalTax;

    const taxInvoice = new TaxInvoice({
      ...req.body,
      invoiceNumber,
      items,
      subtotal,
      totalTax,
      totalAmount,
    });

    await taxInvoice.save();
    res.status(201).json(taxInvoice);
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Invalid data', error });
  }
});

// Update tax invoice status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const invoice = await TaxInvoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Tax invoice not found' });
    }

    invoice.status = status;
    await invoice.save();

    res.json(invoice);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Delete tax invoice
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await TaxInvoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Tax invoice not found' });
    }
    res.json({ message: 'Tax invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
