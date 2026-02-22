import { Router, Request, Response } from 'express';
import CustomerInvoice from '../models/CustomerInvoice';
import CustomerOrder from '../models/CustomerOrder';
import Product from '../models/Product';
import Contract from '../models/Contract';
import mongoose from 'mongoose';
import { logAudit } from '../utils/auditLogger';
import { generateDocNumber } from '../utils/documentNumber';

const router = Router();

// Check customer credit limit
router.get('/credit-check/:customerId', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;

    const activeContract = await Contract.findOne({
      partner: customerId,
      status: 'active',
      creditLimit: { $gt: 0 }
    }).sort({ isDefault: -1, createdAt: -1 });

    if (!activeContract || !activeContract.creditLimit) {
      return res.json({ hasCreditLimit: false, creditLimit: 0, currentDebt: 0, available: 0 });
    }

    const existingInvoices = await CustomerInvoice.aggregate([
      { $match: { customer: new mongoose.Types.ObjectId(customerId), status: { $in: ['unpaid', 'partial'] } } },
      { $group: { _id: null, totalDebt: { $sum: { $subtract: [{ $ifNull: ['$finalAmount', '$totalAmount'] }, '$paidAmount'] } } } }
    ]);

    const currentDebt = existingInvoices[0]?.totalDebt || 0;

    res.json({
      hasCreditLimit: true,
      creditLimit: activeContract.creditLimit,
      currentDebt: Math.round(currentDebt),
      available: Math.round(activeContract.creditLimit - currentDebt)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

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
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.invoiceDate.$lte = end;
      }
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
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.updatedAt.$lte = end;
      }
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

// Get all customer invoices with filters and pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      startDate, endDate, search, status, customerId, warehouseId, shippedStatus,
      page = '1', pageSize = '25',
    } = req.query;
    const query: any = {};

    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) query.invoiceDate.$gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.invoiceDate.$lte = end;
      }
    }

    if (search) {
      const s = search as string;
      query.$or = [
        { invoiceNumber: { $regex: s, $options: 'i' } },
        { customerName: { $regex: s, $options: 'i' } },
      ];
    }

    if (status && status !== 'all') {
      if (status === 'overdue') {
        query.status = { $ne: 'paid' };
        query.dueDate = { $lt: new Date() };
      } else {
        query.status = status;
      }
    }

    if (customerId) query.customer = customerId;
    if (warehouseId) query.warehouse = warehouseId;
    if (shippedStatus) query.shippedStatus = shippedStatus;

    const pageNum = Math.max(1, parseInt(page as string));
    const limit = Math.min(100, Math.max(1, parseInt(pageSize as string)));
    const skip = (pageNum - 1) * limit;

    const [invoices, total] = await Promise.all([
      CustomerInvoice.find(query)
        .populate('customer', 'name phone')
        .populate('warehouse', 'name')
        .populate('items.product', 'name sku unit')
        .sort({ invoiceDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CustomerInvoice.countDocuments(query),
    ]);

    res.json({
      data: invoices,
      total,
      page: pageNum,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
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
    const invoiceNumber = await generateDocNumber('CF');

    // Credit limit check
    const warnings = [];
    const customerId = req.body.customer;
    const invoiceAmount = req.body.finalAmount || req.body.totalAmount || 0;

    const activeContract = await Contract.findOne({
      partner: customerId,
      status: 'active',
      creditLimit: { $gt: 0 }
    }).sort({ isDefault: -1, createdAt: -1 }).session(session);

    if (activeContract && activeContract.creditLimit) {
      // Calculate current outstanding debt
      const existingInvoices = await CustomerInvoice.aggregate([
        { $match: { customer: new mongoose.Types.ObjectId(customerId), status: { $in: ['unpaid', 'partial'] } } },
        { $group: { _id: null, totalDebt: { $sum: { $subtract: [{ $ifNull: ['$finalAmount', '$totalAmount'] }, '$paidAmount'] } } } }
      ]).session(session);

      const currentDebt = existingInvoices[0]?.totalDebt || 0;
      const totalAfterInvoice = currentDebt + invoiceAmount;

      if (totalAfterInvoice > activeContract.creditLimit) {
        warnings.push(`Kredit limit ogohlantirish: Mijoz qarzi (${Math.round(currentDebt).toLocaleString()} + ${Math.round(invoiceAmount).toLocaleString()} = ${Math.round(totalAfterInvoice).toLocaleString()}) kredit limitdan (${Math.round(activeContract.creditLimit).toLocaleString()}) oshib ketdi`);
      }
    }

    // Process items and check inventory availability
    const processedItems = [];
    
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

    // Audit log
    logAudit({
      userId: req.user?.userId,
      userName: req.user?.name || 'Noma\'lum',
      action: 'create',
      entity: 'CustomerInvoice',
      entityId: invoice._id.toString(),
      entityName: `${invoiceNumber} - ${req.body.customerName || 'Mijoz'}`,
      ipAddress: req.ip,
    });

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

    logAudit({
      userId: req.user?.userId,
      userName: req.user?.name || 'Noma\'lum',
      action: 'update',
      entity: 'CustomerInvoice',
      entityId: invoice._id.toString(),
      entityName: `${invoice.invoiceNumber} - ${invoice.customerName}`,
      ipAddress: req.ip,
    });

    res.json(invoice);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Update invoice payment status
router.patch('/:id/payment', async (req: Request, res: Response) => {
  try {
    const { paidAmount, paymentMethod = 'cash', notes = '' } = req.body;
    const invoice = await CustomerInvoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Customer invoice not found' });
    }

    const previousPaidAmount = invoice.paidAmount;
    const paymentAmount = paidAmount - previousPaidAmount;

    if (paymentAmount > 0) {
      // Create payment record
      const Payment = (await import('../models/Payment')).default;
      const paymentNumber = await generateDocNumber('IN', { padWidth: 4 });

      await Payment.create({
        paymentNumber,
        type: 'incoming',
        paymentDate: new Date(),
        amount: paymentAmount,
        partner: invoice.customer,
        partnerName: invoice.customerName,
        account: paymentMethod === 'cash' ? 'cash' : 'bank',
        paymentMethod: paymentMethod,
        purpose: `To'lov: ${invoice.invoiceNumber}`,
        category: 'sales',
        linkedDocument: invoice._id,
        linkedDocumentType: 'CustomerInvoice',
        linkedDocumentNumber: invoice.invoiceNumber,
        status: 'confirmed',
        notes: notes,
      });
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

    // Sync payment to parent CustomerOrder if linked
    if (invoice.customerOrder) {
      await CustomerOrder.findByIdAndUpdate(
        invoice.customerOrder,
        { paidAmount: invoice.paidAmount }
      );
    }

    logAudit({
      userId: req.user?.userId,
      userName: req.user?.name || 'Noma\'lum',
      action: 'update',
      entity: 'Payment',
      entityId: invoice._id.toString(),
      entityName: `To'lov: ${invoice.invoiceNumber} - ${paidAmount.toLocaleString()} so'm`,
      ipAddress: req.ip,
    });

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

    logAudit({
      userId: req.user?.userId,
      userName: req.user?.name || 'Noma\'lum',
      action: 'delete',
      entity: 'CustomerInvoice',
      entityId: req.params.id,
      entityName: `${invoice.invoiceNumber} - ${invoice.customerName}`,
      ipAddress: req.ip,
    });

    res.json({ message: 'Customer invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
