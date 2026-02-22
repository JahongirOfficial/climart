import { Router, Request, Response } from 'express';
import CustomerReturn from '../models/CustomerReturn';
import CustomerInvoice from '../models/CustomerInvoice';
import CustomerOrder from '../models/CustomerOrder';
import Shipment from '../models/Shipment';
import Product from '../models/Product';
import Partner from '../models/Partner';
import mongoose from 'mongoose';
import { generateDocNumber } from '../utils/documentNumber';

const router = Router();

// Get all customer returns with filters and pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      startDate, endDate, search, status, customerId, reason,
      page = '1', pageSize = '25',
    } = req.query;
    const query: any = {};

    if (startDate || endDate) {
      query.returnDate = {};
      if (startDate) query.returnDate.$gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.returnDate.$lte = end;
      }
    }

    if (search) {
      const s = search as string;
      query.$or = [
        { returnNumber: { $regex: s, $options: 'i' } },
        { customerName: { $regex: s, $options: 'i' } },
        { invoiceNumber: { $regex: s, $options: 'i' } },
      ];
    }

    if (status && status !== 'all') query.status = status;
    if (customerId) query.customer = customerId;
    if (reason && reason !== 'all') query.reason = reason;

    const pageNum = Math.max(1, parseInt(page as string));
    const limit = Math.min(100, Math.max(1, parseInt(pageSize as string)));
    const skip = (pageNum - 1) * limit;

    const [returns, total] = await Promise.all([
      CustomerReturn.find(query)
        .populate('customer', 'name phone')
        .populate('invoice', 'invoiceNumber')
        .populate('shipment', 'shipmentNumber')
        .populate('customerOrder', 'orderNumber')
        .populate('items.product', 'name sku unit')
        .sort({ returnDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CustomerReturn.countDocuments(query),
    ]);

    res.json({
      data: returns,
      total,
      page: pageNum,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
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
      .populate('shipment')
      .populate('customerOrder')
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
    const returnNumber = await generateDocNumber('CR');

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

    // Find linked shipment via invoice
    const shipment = await Shipment.findOne({ invoice: invoice._id }).session(session);

    // Create return with full document chain references
    const customerReturn = new CustomerReturn({
      ...req.body,
      returnNumber,
      customerOrder: invoice.customerOrder || undefined,
      orderNumber: invoice.orderNumber || undefined,
      shipment: shipment?._id || undefined,
      shipmentNumber: shipment?.shipmentNumber || undefined,
    });

    await customerReturn.save({ session });

    // Determine warehouse for stock restoration
    const returnWarehouse = req.body.warehouse || invoice.warehouse;

    // Update inventory (increase quantities - global + warehouse-specific)
    for (const item of req.body.items) {
      // Increase global quantity
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: item.quantity } },
        { session }
      );

      // Increase warehouse-specific quantity
      if (returnWarehouse) {
        await Product.findOneAndUpdate(
          {
            _id: item.product,
            'stockByWarehouse.warehouse': returnWarehouse,
          },
          { $inc: { 'stockByWarehouse.$.quantity': item.quantity } },
          { session }
        );
      }
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

    // Sync paidAmount to parent CustomerOrder if linked
    if (invoice.customerOrder) {
      const updatedInvoice = await CustomerInvoice.findById(req.body.invoice).session(session);
      if (updatedInvoice) {
        await CustomerOrder.findByIdAndUpdate(
          invoice.customerOrder,
          { paidAmount: updatedInvoice.paidAmount },
          { session }
        );
      }
    }

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
