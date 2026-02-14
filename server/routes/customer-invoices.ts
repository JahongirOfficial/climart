import { Router, Request, Response } from 'express';
import CustomerInvoice from '../models/CustomerInvoice';
import Product from '../models/Product';
import mongoose from 'mongoose';

const router = Router();

// Get pending invoices (with costPricePending items)
router.get('/pending', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, customerId } = req.query;
    const query: any = {
      'items.costPricePending': true
    };

    // Apply date filters
    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate as string);
      if (endDate) query.invoiceDate.$lte = new Date(endDate as string);
    }

    // Apply customer filter
    if (customerId) {
      query.customer = customerId;
    }

    const invoices = await CustomerInvoice.find(query)
      .populate('customer', 'name')
      .sort({ invoiceDate: -1 })
      .lean();

    // Calculate pending items count for each invoice
    const result = invoices.map((inv: any) => ({
      _id: inv._id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customer?.name || inv.customerName || 'Unknown',
      invoiceDate: inv.invoiceDate,
      totalAmount: inv.totalAmount,
      pendingItemsCount: inv.items.filter((item: any) => item.costPricePending).length,
      items: inv.items.map((item: any) => ({
        productName: item.productName,
        quantity: item.quantity,
        costPricePending: item.costPricePending || false
      }))
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get corrected invoices (with isMinusCorrection flag)
router.get('/corrected', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, productId } = req.query;
    const query: any = {
      isMinusCorrection: true
    };

    // Apply date filters on updatedAt
    if (startDate || endDate) {
      query.updatedAt = {};
      if (startDate) query.updatedAt.$gte = new Date(startDate as string);
      if (endDate) query.updatedAt.$lte = new Date(endDate as string);
    }

    // Apply product filter
    if (productId) {
      query['items.product'] = productId;
    }

    const invoices = await CustomerInvoice.find(query)
      .populate('customer', 'name')
      .sort({ updatedAt: -1 })
      .lean();

    // Format response
    const result = invoices.map((inv: any) => ({
      _id: inv._id,
      invoiceNumber: inv.invoiceNumber,
      customerName: inv.customer?.name || inv.customerName || 'Unknown',
      invoiceDate: inv.invoiceDate,
      updatedAt: inv.updatedAt,
      totalAmount: inv.totalAmount,
      items: inv.items.map((item: any) => ({
        productName: item.productName,
        quantity: item.quantity,
        costPrice: item.costPrice,
        costPricePending: item.costPricePending || false
      }))
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

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
      createdBy: req.user?.userId,
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
