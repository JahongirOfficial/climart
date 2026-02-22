import { Router, Request, Response } from 'express';
import Shipment from '../models/Shipment';
import CustomerOrder from '../models/CustomerOrder';
import CustomerInvoice from '../models/CustomerInvoice';
import Product from '../models/Product';
import mongoose from 'mongoose';
import { generateDocNumber } from '../utils/documentNumber';

const router = Router();

// Get all shipments with filters and pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      startDate, endDate, search, status, customerId, warehouseId,
      page = '1', pageSize = '25',
    } = req.query;
    const query: any = {};

    if (startDate || endDate) {
      query.shipmentDate = {};
      if (startDate) query.shipmentDate.$gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        query.shipmentDate.$lte = end;
      }
    }

    if (search) {
      const s = search as string;
      query.$or = [
        { shipmentNumber: { $regex: s, $options: 'i' } },
        { customerName: { $regex: s, $options: 'i' } },
        { trackingNumber: { $regex: s, $options: 'i' } },
      ];
    }

    if (status && status !== 'all') query.status = status;
    if (customerId) query.customer = customerId;
    if (warehouseId) query.warehouse = warehouseId;

    const pageNum = Math.max(1, parseInt(page as string));
    const limit = Math.min(100, Math.max(1, parseInt(pageSize as string)));
    const skip = (pageNum - 1) * limit;

    const [shipments, total] = await Promise.all([
      Shipment.find(query)
        .populate('customer', 'name phone')
        .populate('order', 'orderNumber')
        .populate('warehouse', 'name')
        .populate('items.product', 'name sku unit')
        .sort({ shipmentDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Shipment.countDocuments(query),
    ]);

    res.json({
      data: shipments,
      total,
      page: pageNum,
      pageSize: limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get shipment by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('customer')
      .populate('order')
      .populate('warehouse')
      .populate('items.product');
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    res.json(shipment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create new shipment with inventory update
router.post('/', async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Generate shipment number
    const shipmentNumber = await generateDocNumber('SH');

    // Validate inventory availability
    for (const item of req.body.items) {
      const product = await Product.findById(item.product).session(session);
      if (!product) {
        throw new Error(`Product not found`);
      }
      if (product.quantity < item.quantity) {
        throw new Error(`Insufficient inventory. Available: ${product.quantity}, Requested: ${item.quantity}`);
      }
    }

    // Create shipment - remove empty customer to avoid BSONError
    const shipmentData = { ...req.body, shipmentNumber };
    if (!shipmentData.customer) {
      delete shipmentData.customer;
    }
    const shipment = new Shipment(shipmentData);

    await shipment.save({ session });

    // Update inventory quantities
    for (const item of req.body.items) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { quantity: -item.quantity } },
        { session }
      );
    }

    await session.commitTransaction();
    res.status(201).json(shipment);
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message || 'Invalid data', error });
  } finally {
    session.endSession();
  }
});

// Update shipment
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const shipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    res.json(shipment);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Update shipment status and order fulfillment
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const shipment = await Shipment.findById(req.params.id);
    
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }

    shipment.status = status;
    await shipment.save();

    // If delivered, update order status and invoice shippedStatus
    if (status === 'delivered') {
      if (shipment.order) {
        await CustomerOrder.findByIdAndUpdate(
          shipment.order,
          { status: 'delivered', shippedAmount: shipment.totalAmount }
        );
      }

      if (shipment.invoice) {
        await CustomerInvoice.findByIdAndUpdate(
          shipment.invoice,
          { shippedStatus: 'shipped', shippedAmount: shipment.totalAmount }
        );
      }
    }

    // If in_transit, update order status to shipped
    if (status === 'in_transit' && shipment.order) {
      await CustomerOrder.findByIdAndUpdate(
        shipment.order,
        { status: 'shipped' }
      );
    }

    res.json(shipment);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Delete shipment
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const shipment = await Shipment.findByIdAndDelete(req.params.id);
    if (!shipment) {
      return res.status(404).json({ message: 'Shipment not found' });
    }
    res.json({ message: 'Shipment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
