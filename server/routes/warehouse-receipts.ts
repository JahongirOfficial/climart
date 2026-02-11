import { Router, Request, Response } from 'express';
import WarehouseReceipt from '../models/WarehouseReceipt';
import Product from '../models/Product';
import Warehouse from '../models/Warehouse';

const router = Router();

// Helper function to generate unique receipt number
async function generateReceiptNumber(): Promise<string> {
  const count = await WarehouseReceipt.countDocuments();
  return `WR-${String(count + 1).padStart(6, '0')}`;
}

// Get all warehouse receipts
router.get('/', async (req: Request, res: Response) => {
  try {
    const { warehouse, status, startDate, endDate } = req.query;
    const filter: any = {};

    if (warehouse) {
      filter.warehouse = warehouse;
    }

    if (status) {
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.receiptDate = {};
      if (startDate) filter.receiptDate.$gte = new Date(startDate as string);
      if (endDate) filter.receiptDate.$lte = new Date(endDate as string);
    }

    const receipts = await WarehouseReceipt.find(filter)
      .sort({ receiptDate: -1 })
      .populate('warehouse');

    res.json(receipts);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get receipt by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const receipt = await WarehouseReceipt.findById(req.params.id)
      .populate('warehouse')
      .populate('items.product');

    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    res.json(receipt);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create new warehouse receipt
router.post('/', async (req: Request, res: Response) => {
  try {
    const receiptNumber = await generateReceiptNumber();

    // Get warehouse name
    const warehouse = await Warehouse.findById(req.body.warehouse);
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }

    // Calculate total amount
    const totalAmount = req.body.items.reduce((sum: number, item: any) => sum + item.total, 0);

    const receipt = new WarehouseReceipt({
      ...req.body,
      receiptNumber,
      warehouseName: warehouse.name,
      totalAmount,
    });

    await receipt.save();

    // If confirmed, update product quantities
    if (receipt.status === 'confirmed') {
      await updateProductQuantities(receipt);
    }

    res.status(201).json(receipt);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Update warehouse receipt
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const oldReceipt = await WarehouseReceipt.findById(req.params.id);
    if (!oldReceipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    // If was confirmed, revert quantities first
    if (oldReceipt.status === 'confirmed') {
      await revertProductQuantities(oldReceipt);
    }

    // Calculate total amount
    const totalAmount = req.body.items.reduce((sum: number, item: any) => sum + item.total, 0);

    const receipt = await WarehouseReceipt.findByIdAndUpdate(
      req.params.id,
      { ...req.body, totalAmount },
      { new: true, runValidators: true }
    );

    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    // If now confirmed, update quantities
    if (receipt.status === 'confirmed') {
      await updateProductQuantities(receipt);
    }

    res.json(receipt);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Confirm warehouse receipt
router.patch('/:id/confirm', async (req: Request, res: Response) => {
  try {
    const receipt = await WarehouseReceipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    if (receipt.status === 'confirmed') {
      return res.status(400).json({ message: 'Receipt already confirmed' });
    }

    receipt.status = 'confirmed';
    await receipt.save();

    // Update product quantities
    await updateProductQuantities(receipt);

    res.json(receipt);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Delete warehouse receipt
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const receipt = await WarehouseReceipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ message: 'Receipt not found' });
    }

    // If confirmed, revert quantities first
    if (receipt.status === 'confirmed') {
      await revertProductQuantities(receipt);
    }

    await WarehouseReceipt.findByIdAndDelete(req.params.id);

    res.json({ message: 'Receipt deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

import { correctPendingInvoices } from '../utils/inventory';

// Helper function to update product quantities
async function updateProductQuantities(receipt: any) {
  for (const item of receipt.items) {
    await Product.findByIdAndUpdate(
      item.product,
      {
        $inc: { quantity: item.quantity },
        $set: { costPrice: item.costPrice } // Update tan narx
      }
    );

    // Auto-correct negative sales
    await correctPendingInvoices(item.product.toString(), item.costPrice);
  }
}

// Helper function to revert product quantities
async function revertProductQuantities(receipt: any) {
  for (const item of receipt.items) {
    await Product.findByIdAndUpdate(
      item.product,
      { $inc: { quantity: -item.quantity } }
    );
  }
}

export default router;
