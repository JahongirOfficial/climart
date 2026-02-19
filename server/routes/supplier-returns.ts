import { Router, Request, Response } from 'express';
import SupplierReturn from '../models/SupplierReturn';
import Product from '../models/Product';
import Receipt from '../models/Receipt';
import mongoose from 'mongoose';
import { generateDocNumber } from '../utils/documentNumber';

const router = Router();

// Get all supplier returns
router.get('/', async (req: Request, res: Response) => {
  try {
    const returns = await SupplierReturn.find()
      .populate('supplier')
      .populate('receipt')
      .sort({ createdAt: -1 });
    res.json(returns);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get return by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const supplierReturn = await SupplierReturn.findById(req.params.id)
      .populate('supplier')
      .populate('receipt')
      .populate('items.product');
    if (!supplierReturn) {
      return res.status(404).json({ message: 'Return not found' });
    }
    res.json(supplierReturn);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create new supplier return (with warehouse update)
router.post('/', async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Generate return number
    const returnNumber = await generateDocNumber('VQ');
    
    const supplierReturn = new SupplierReturn({
      ...req.body,
      returnNumber,
    });
    
    // Decrease warehouse quantities from stockByWarehouse
    for (const item of supplierReturn.items) {
      const product = await Product.findById(item.product).session(session);
      
      if (!product) {
        throw new Error(`Mahsulot ${item.productName} topilmadi`);
      }
      
      // Check if product has stockByWarehouse
      if (!product.stockByWarehouse || Object.keys(product.stockByWarehouse).length === 0) {
        throw new Error(`${item.productName} hali omborga qabul qilinmagan`);
      }
      
      // Calculate total quantity across all warehouses
      const totalQuantity = Object.values(product.stockByWarehouse || {}).reduce((sum: number, qty) => sum + (qty as number), 0);
      
      if (totalQuantity < item.quantity) {
        throw new Error(`${item.productName} uchun yetarli miqdor yo'q (mavjud: ${totalQuantity}, kerak: ${item.quantity})`);
      }
      
      // Decrease from warehouses proportionally or from first available
      let remainingToDecrease = item.quantity;
      const warehouses = Object.keys(product.stockByWarehouse || {});
      
      for (const warehouseId of warehouses) {
        if (remainingToDecrease <= 0) break;
        
        const currentStock = product.stockByWarehouse.get(warehouseId) || 0;
        const decreaseAmount = Math.min(currentStock, remainingToDecrease);
        
        product.stockByWarehouse.set(warehouseId, currentStock - decreaseAmount);
        remainingToDecrease -= decreaseAmount;
      }
      
      await product.save({ session });
    }
    
    await supplierReturn.save({ session });
    await session.commitTransaction();
    
    res.status(201).json(supplierReturn);
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message || 'Noto\'g\'ri ma\'lumot' });
  } finally {
    session.endSession();
  }
});

// Create return from receipt
router.post('/from-receipt/:receiptId', async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const receipt = await Receipt.findById(req.params.receiptId)
      .populate('supplier')
      .session(session);
    
    if (!receipt) {
      throw new Error('Receipt not found');
    }
    
    // Generate return number
    const returnNumber = await generateDocNumber('VQ');
    
    // Create return from receipt
    const supplierReturn = new SupplierReturn({
      returnNumber,
      supplier: receipt.supplier,
      supplierName: receipt.supplierName,
      receipt: receipt._id,
      receiptNumber: receipt.receiptNumber,
      returnDate: new Date(),
      items: req.body.items || receipt.items.map((item: any) => ({
        product: item.product,
        productName: item.productName,
        quantity: req.body.quantities?.[item.product.toString()] || item.quantity,
        costPrice: item.costPrice,
        total: (req.body.quantities?.[item.product.toString()] || item.quantity) * item.costPrice,
        reason: req.body.itemReasons?.[item.product.toString()] || req.body.reason || 'boshqa',
      })),
      totalAmount: 0,
      reason: req.body.reason || 'boshqa',
      notes: req.body.notes,
    });
    
    // Calculate total
    supplierReturn.totalAmount = supplierReturn.items.reduce((sum, item) => sum + item.total, 0);
    
    // Decrease warehouse quantities
    for (const item of supplierReturn.items) {
      const product = await Product.findById(item.product).session(session);
      
      if (product) {
        product.quantity -= item.quantity;
        if (product.quantity < 0) {
          throw new Error(`Insufficient quantity for ${item.productName}`);
        }
        await product.save({ session });
      }
    }
    
    await supplierReturn.save({ session });
    await session.commitTransaction();
    
    res.status(201).json(supplierReturn);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: 'Failed to create return from receipt', error });
  } finally {
    session.endSession();
  }
});

// Delete return (reverse warehouse changes)
router.delete('/:id', async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const supplierReturn = await SupplierReturn.findById(req.params.id).session(session);
    
    if (!supplierReturn) {
      throw new Error('Qaytarish topilmadi');
    }
    
    // Reverse warehouse quantities (add back to stockByWarehouse)
    for (const item of supplierReturn.items) {
      const product = await Product.findById(item.product).session(session);
      
      if (product) {
        // Add back to first warehouse or distribute
        const warehouses = Object.keys(product.stockByWarehouse || {});
        if (warehouses.length > 0) {
          const firstWarehouse = warehouses[0];
          const currentStock = product.stockByWarehouse.get(firstWarehouse) || 0;
          product.stockByWarehouse.set(firstWarehouse, currentStock + item.quantity);
        } else {
          // If no warehouses, this shouldn't happen but handle gracefully
          console.warn(`Product ${product.name} has no warehouses`);
        }
        await product.save({ session });
      }
    }
    
    await SupplierReturn.findByIdAndDelete(req.params.id).session(session);
    await session.commitTransaction();
    
    res.json({ message: 'Qaytarish o\'chirildi va ombor yangilandi' });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message || 'Server xatosi' });
  } finally {
    session.endSession();
  }
});

export default router;
