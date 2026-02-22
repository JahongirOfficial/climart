import { Router, Request, Response } from 'express';
import CustomerOrder from '../models/CustomerOrder';
import CustomerInvoice from '../models/CustomerInvoice';
import Shipment from '../models/Shipment';
import Product from '../models/Product';
import Partner from '../models/Partner';
import mongoose from 'mongoose';
import { generateDocNumber } from '../utils/documentNumber';

const router = Router();

// Get customer orders with filters and pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      pageSize = '25',
      search,
      status,
      customerId,
      warehouseId,
      startDate,
      endDate,
      paymentStatus,
      shipmentStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query: any = {};

    // Text search
    if (search) {
      const s = search as string;
      query.$or = [
        { orderNumber: { $regex: s, $options: 'i' } },
        { customerName: { $regex: s, $options: 'i' } },
        { notes: { $regex: s, $options: 'i' } },
      ];
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Customer filter
    if (customerId) {
      query.customer = customerId;
    }

    // Warehouse filter
    if (warehouseId) {
      query.warehouse = warehouseId;
    }

    // Date range filter
    if (startDate || endDate) {
      query.orderDate = {};
      if (startDate) {
        query.orderDate.$gte = new Date(startDate as string);
      }
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.orderDate.$lte = end;
      }
    }

    // Payment status filter
    if (paymentStatus === 'paid') {
      query.$expr = { $gte: ['$paidAmount', '$totalAmount'] };
    } else if (paymentStatus === 'partlyPaid') {
      query.paidAmount = { $gt: 0 };
      query.$expr = { $lt: ['$paidAmount', '$totalAmount'] };
    } else if (paymentStatus === 'unpaid') {
      query.paidAmount = 0;
    }

    // Shipment status filter
    if (shipmentStatus === 'shipped') {
      query.$expr = { $gte: ['$shippedAmount', '$totalAmount'] };
    } else if (shipmentStatus === 'partiallyShipped') {
      query.shippedAmount = { $gt: 0 };
      query.$expr = { $lt: ['$shippedAmount', '$totalAmount'] };
    } else if (shipmentStatus === 'unshipped') {
      query.shippedAmount = 0;
    }

    const pageNum = Math.max(1, parseInt(page as string));
    const limit = Math.min(100, Math.max(1, parseInt(pageSize as string)));
    const skip = (pageNum - 1) * limit;

    const sort: any = {};
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1;

    const [orders, total] = await Promise.all([
      CustomerOrder.find(query)
        .populate('customer')
        .populate('items.product')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      CustomerOrder.countDocuments(query),
    ]);

    res.json({
      data: orders,
      total,
      page: pageNum,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
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

// Create new customer order (+ auto-create invoice & shipment if registered customer + warehouse)
router.post('/', async (req: Request, res: Response) => {
  try {
    // Generate unique order number
    const orderNumber = await generateDocNumber('CO');

    // Map legacy status 'pending' to 'new'
    const status = req.body.status === 'pending' ? 'new' : (req.body.status || 'new');

    // Create order without inventory validation
    const order = new CustomerOrder({
      ...req.body,
      orderNumber,
      status,
    });

    await order.save();

    const response: any = { order };

    // Auto-create CustomerInvoice + Shipment if registered customer AND warehouse selected
    const isRegisteredCustomer = req.body.customer && req.body.customer !== 'regular';
    const hasWarehouse = req.body.warehouse;
    const hasItems = Array.isArray(req.body.items) && req.body.items.length > 0;

    if (isRegisteredCustomer && hasWarehouse && hasItems) {
      try {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
          // Fetch partner for address
          const partner = await Partner.findById(req.body.customer).session(session);

          // --- Auto-create CustomerInvoice ---
          const invoiceNumber = await generateDocNumber('CF');

          // Prepare invoice items with costPrice and warehouse info
          const invoiceItems = [];
          for (const item of req.body.items) {
            const product = await Product.findById(item.product).session(session);
            const costPrice = product?.costPrice || 0;

            // Check warehouse stock for costPricePending flag
            const warehouseStock = product?.stockByWarehouse?.find(
              (sw: any) => sw.warehouse.toString() === req.body.warehouse.toString()
            );
            const availableQty = warehouseStock ? warehouseStock.quantity : 0;
            const isMinus = availableQty < item.quantity;

            invoiceItems.push({
              product: item.product,
              productName: item.productName,
              quantity: item.quantity,
              sellingPrice: item.price,
              costPrice,
              discount: item.discount || 0,
              discountAmount: 0,
              total: item.total,
              warehouse: req.body.warehouse,
              warehouseName: req.body.warehouseName || '',
              costPricePending: isMinus,
            });
          }

          const totalAmount = invoiceItems.reduce((sum, it) => sum + it.total, 0);
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 30);

          const invoice = new CustomerInvoice({
            invoiceNumber,
            customer: req.body.customer,
            customerName: req.body.customerName,
            warehouse: req.body.warehouse,
            warehouseName: req.body.warehouseName || '',
            invoiceDate: new Date(),
            dueDate,
            status: 'unpaid',
            shippedStatus: 'not_shipped',
            items: invoiceItems,
            totalAmount,
            discountTotal: 0,
            finalAmount: totalAmount,
            paidAmount: 0,
            shippedAmount: 0,
            customerOrder: order._id,
            orderNumber: order.orderNumber,
            createdBy: req.user?.userId,
          });

          await invoice.save({ session });

          // Update order invoicedSum
          order.invoicedSum = totalAmount;
          await order.save({ session });

          // Deduct inventory (global + warehouse-specific)
          for (const item of invoiceItems) {
            await Product.findByIdAndUpdate(
              item.product,
              { $inc: { quantity: -item.quantity } },
              { session }
            );

            await Product.findOneAndUpdate(
              {
                _id: item.product,
                'stockByWarehouse.warehouse': item.warehouse,
              },
              { $inc: { 'stockByWarehouse.$.quantity': -item.quantity } },
              { session }
            );
          }

          response.autoInvoice = invoice;

          // --- Auto-create Shipment (tracking only, NO inventory deduction) ---
          const shipmentNumber = await generateDocNumber('SH');

          const shipmentItems = req.body.items.map((item: any) => ({
            product: item.product,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          }));

          const deliveryAddress =
            partner?.physicalAddress || partner?.legalAddress || 'Manzil ko\'rsatilmagan';

          const shipment = new Shipment({
            shipmentNumber,
            customer: req.body.customer,
            customerName: req.body.customerName,
            order: order._id,
            orderNumber: order.orderNumber,
            invoice: invoice._id,
            invoiceNumber: invoice.invoiceNumber,
            shipmentDate: new Date(),
            warehouse: req.body.warehouse,
            warehouseName: req.body.warehouseName || '',
            status: 'pending',
            items: shipmentItems,
            totalAmount,
            paidAmount: 0,
            deliveryAddress,
          });

          await shipment.save({ session });

          response.autoShipment = shipment;

          await session.commitTransaction();
          session.endSession();
        } catch (autoErr: any) {
          await session.abortTransaction();
          session.endSession();
          console.error('Auto-creation failed (invoice/shipment):', autoErr);
          response.autoCreationError = autoErr?.message || 'Avtomatik hisob-faktura/yuborish yaratishda xatolik';
          response.autoCreationDetails = String(autoErr);
        }
      } catch (sessionErr) {
        console.error('Session creation failed:', sessionErr);
        response.autoCreationError = 'Avtomatik yaratish sessiyasida xatolik';
      }
    }

    res.status(201).json(response);
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
    order.reservedSum = order.totalAmount;
    await order.save({ session });

    await session.commitTransaction();

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
    order.status = 'new';
    order.reservedSum = 0;
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
