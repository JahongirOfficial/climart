import { Router, Request, Response } from 'express';
import SupplierReturn from '../models/SupplierReturn';
import Product from '../models/Product';
import Receipt from '../models/Receipt';
import mongoose from 'mongoose';
import { generateDocNumber } from '../utils/documentNumber';
import { logAudit } from '../utils/auditLogger';

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
    const returnNumber = await generateDocNumber('VQ');
    const warehouseId = req.body.warehouse;

    const supplierReturn = new SupplierReturn({
      ...req.body,
      returnNumber,
    });

    // Decrease warehouse quantities
    for (const item of supplierReturn.items) {
      const product = await Product.findById(item.product).session(session);

      if (!product) {
        throw new Error(`Mahsulot ${item.productName} topilmadi`);
      }

      if (warehouseId) {
        // Decrease from specific warehouse
        const warehouseStock = product.stockByWarehouse.find(
          (sw: any) => sw.warehouse.toString() === warehouseId.toString()
        );

        if (!warehouseStock) {
          throw new Error(`${item.productName} tanlangan omborga qabul qilinmagan`);
        }

        if (warehouseStock.quantity < item.quantity) {
          throw new Error(`${item.productName} uchun omborda yetarli miqdor yo'q (mavjud: ${warehouseStock.quantity}, kerak: ${item.quantity})`);
        }

        warehouseStock.quantity -= item.quantity;
      } else {
        // No warehouse specified — decrease from total across all warehouses
        const totalQuantity = product.stockByWarehouse.reduce((sum: number, sw: any) => sum + sw.quantity, 0);

        if (totalQuantity < item.quantity) {
          throw new Error(`${item.productName} uchun yetarli miqdor yo'q (mavjud: ${totalQuantity}, kerak: ${item.quantity})`);
        }

        let remaining = item.quantity;
        for (const sw of product.stockByWarehouse) {
          if (remaining <= 0) break;
          const decrease = Math.min(sw.quantity, remaining);
          sw.quantity -= decrease;
          remaining -= decrease;
        }
      }

      // Sync global quantity
      product.quantity -= item.quantity;
      if (product.quantity < 0) product.quantity = 0;

      await product.save({ session });
    }

    await supplierReturn.save({ session });
    await session.commitTransaction();

    logAudit({
      userId: req.user?.userId,
      userName: req.user?.name || 'Noma\'lum',
      action: 'create',
      entity: 'SupplierReturn',
      entityId: supplierReturn._id.toString(),
      entityName: `${supplierReturn.returnNumber} - ${supplierReturn.supplierName}`,
      ipAddress: req.ip,
    });

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
      throw new Error('Qabul hujjati topilmadi');
    }

    const returnNumber = await generateDocNumber('VQ');
    const warehouseId = req.body.warehouse || (receipt as any).warehouse;

    const supplierReturn = new SupplierReturn({
      returnNumber,
      supplier: receipt.supplier,
      supplierName: receipt.supplierName,
      warehouse: warehouseId || undefined,
      warehouseName: req.body.warehouseName || (receipt as any).warehouseName || '',
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

    supplierReturn.totalAmount = supplierReturn.items.reduce((sum: number, item: any) => sum + item.total, 0);

    // Decrease warehouse quantities
    for (const item of supplierReturn.items) {
      const product = await Product.findById(item.product).session(session);

      if (!product) {
        throw new Error(`Mahsulot ${item.productName} topilmadi`);
      }

      if (warehouseId) {
        const warehouseStock = product.stockByWarehouse.find(
          (sw: any) => sw.warehouse.toString() === warehouseId.toString()
        );

        if (warehouseStock) {
          if (warehouseStock.quantity < item.quantity) {
            throw new Error(`${item.productName} uchun omborda yetarli miqdor yo'q`);
          }
          warehouseStock.quantity -= item.quantity;
        }
      }

      product.quantity -= item.quantity;
      if (product.quantity < 0) product.quantity = 0;

      await product.save({ session });
    }

    await supplierReturn.save({ session });
    await session.commitTransaction();

    logAudit({
      userId: req.user?.userId,
      userName: req.user?.name || 'Noma\'lum',
      action: 'create',
      entity: 'SupplierReturn',
      entityId: supplierReturn._id.toString(),
      entityName: `${supplierReturn.returnNumber} - ${supplierReturn.supplierName}`,
      ipAddress: req.ip,
    });

    res.status(201).json(supplierReturn);
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message || 'Qaytarish yaratishda xatolik' });
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

    const warehouseId = supplierReturn.warehouse?.toString();

    // Reverse warehouse quantities
    for (const item of supplierReturn.items) {
      const product = await Product.findById(item.product).session(session);

      if (product) {
        // Restore global quantity
        product.quantity += item.quantity;

        if (warehouseId) {
          // Restore to the specific warehouse the return was from
          const warehouseStock = product.stockByWarehouse.find(
            (sw: any) => sw.warehouse.toString() === warehouseId
          );
          if (warehouseStock) {
            warehouseStock.quantity += item.quantity;
          }
        } else if (product.stockByWarehouse.length > 0) {
          // Fallback: add to first warehouse
          product.stockByWarehouse[0].quantity += item.quantity;
        }

        await product.save({ session });
      }
    }

    const returnInfo = {
      returnNumber: supplierReturn.returnNumber,
      supplierName: supplierReturn.supplierName,
    };

    await SupplierReturn.findByIdAndDelete(req.params.id).session(session);
    await session.commitTransaction();

    logAudit({
      userId: req.user?.userId,
      userName: req.user?.name || 'Noma\'lum',
      action: 'delete',
      entity: 'SupplierReturn',
      entityId: req.params.id,
      entityName: `${returnInfo.returnNumber} - ${returnInfo.supplierName}`,
      ipAddress: req.ip,
    });

    res.json({ message: 'Qaytarish o\'chirildi va ombor yangilandi' });
  } catch (error: any) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message || 'Server xatosi' });
  } finally {
    session.endSession();
  }
});

export default router;
