import { Router, Request, Response } from 'express';
import CustomerInvoice from '../models/CustomerInvoice';
import Product from '../models/Product';
import mongoose from 'mongoose';

const router = Router();

// Get all customer invoices with optional date filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    let query: any = {};

    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate as string);
      if (endDate) query.invoiceDate.$lte = new Date(endDate as string);
    }

    const invoices = await CustomerInvoice.find(query)
      .populate('customer', 'name phone')
      .populate('warehouse', 'name')
      .populate('items.product', 'name sku unit')
      .sort({ invoiceDate: -1, createdAt: -1 })
      .lean();
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get customer invoice by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await CustomerInvoice.findById(req.params.id)
      .populate('customer')
      .populate('warehouse')
      .populate('items.product');
    if (!invoice) {
      return res.status(404).json({ message: 'Customer invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create new customer invoice with inventory update
router.post('/', async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Generate invoice number
    const count = await CustomerInvoice.countDocuments();
    const invoiceNumber = `CF-${new Date().getFullYear()}-${String(count + 1).padStart(3, '0')}`;

    // Process items and check inventory availability
    const processedItems = [];
    const warnings = [];
    
    for (const item of req.body.items) {
      const product = await Product.findById(item.product).session(session);
      if (!product) {
        throw new Error(`Product ${item.productName} not found`);
      }

      // Find warehouse stock
      const warehouseStock = product.stockByWarehouse.find(
        (sw: any) => sw.warehouse.toString() === item.warehouse.toString()
      );

      // Check if sufficient inventory exists and add warning
      const availableQuantity = warehouseStock ? warehouseStock.quantity : 0;
      if (availableQuantity < item.quantity) {
        warnings.push(`${item.productName}: Mavjud ${availableQuantity}, So'ralgan ${item.quantity}`);
      }

      const isMinus = !warehouseStock || warehouseStock.quantity < item.quantity;

      processedItems.push({
        ...item,
        costPricePending: isMinus // Mark for future profit calculation if minus
      });
    }

    // Create invoice
    const invoice = new CustomerInvoice({
      ...req.body,
      items: processedItems,
      invoiceNumber,
    });

    await invoice.save({ session });

    // Update inventory quantities for specific warehouses
    for (const item of processedItems) {
      // Update global quantity
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: -item.quantity } },
        { session }
      );

      // Update warehouse-specific quantity
      await Product.findOneAndUpdate(
        {
          _id: item.product,
          "stockByWarehouse.warehouse": item.warehouse
        },
        { $inc: { "stockByWarehouse.$.quantity": -item.quantity } },
        { session }
      );
    }

    await session.commitTransaction();
    
    // Return invoice with warnings if any
    const response: any = { invoice };
    if (warnings.length > 0) {
      response.warnings = warnings;
    }
    
    res.status(201).json(response);
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message || 'Invalid data', error });
  } finally {
    session.endSession();
  }
});

// Update customer invoice
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await CustomerInvoice.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!invoice) {
      return res.status(404).json({ message: 'Customer invoice not found' });
    }
    res.json(invoice);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Update invoice payment status
router.patch('/:id/payment', async (req: Request, res: Response) => {
  try {
    const { paidAmount } = req.body;
    const invoice = await CustomerInvoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Customer invoice not found' });
    }

    invoice.paidAmount = paidAmount;

    // Update status based on payment
    if (paidAmount === 0) {
      invoice.status = 'unpaid';
    } else if (paidAmount >= invoice.totalAmount) {
      invoice.status = 'paid';
    } else {
      invoice.status = 'partial';
    }

    await invoice.save();
    res.json(invoice);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Delete customer invoice
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const invoice = await CustomerInvoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ message: 'Customer invoice not found' });
    }
    res.json({ message: 'Customer invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
