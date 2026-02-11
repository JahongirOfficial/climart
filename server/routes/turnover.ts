import { Router, Request, Response } from 'express';
import Product from '../models/Product';
import Receipt from '../models/Receipt';
import WarehouseReceipt from '../models/WarehouseReceipt';
import Shipment from '../models/Shipment';
import Writeoff from '../models/Writeoff';

const router = Router();

// Get turnover report
router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, warehouse, category, showInactive } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    // Get products with lean query and projection
    const productFilter: any = {};
    if (category && category !== 'all') {
      productFilter.category = category;
    }
    const products = await Product.find(productFilter)
      .select('name sku category unit costPrice quantity')
      .sort({ name: 1 })
      .lean();

    // Aggregate all movements in parallel
    const [receipts, warehouseReceipts, shipments, writeoffs] = await Promise.all([
      Receipt.find({
        receiptDate: { $gte: start, $lte: end },
        ...(warehouse && { warehouse })
      }).select('items.product items.quantity items.total').lean(),
      WarehouseReceipt.find({
        receiptDate: { $gte: start, $lte: end },
        status: 'confirmed',
        ...(warehouse && { warehouse })
      }).select('items.product items.quantity items.total').lean(),
      Shipment.find({
        shipmentDate: { $gte: start, $lte: end },
        status: { $in: ['in_transit', 'delivered'] },
        ...(warehouse && { warehouse })
      }).select('items.product items.quantity').lean(),
      Writeoff.find({
        writeoffDate: { $gte: start, $lte: end },
        status: 'confirmed',
        ...(warehouse && { warehouse })
      }).select('items.product items.quantity items.total').lean()
    ]);

    // Build aggregation map
    const movementMap: Record<string, { inQty: number, inAmt: number, outQty: number, outAmt: number }> = {};

    receipts.forEach((doc: any) => {
      doc.items.forEach((item: any) => {
        const id = item.product.toString();
        if (!movementMap[id]) movementMap[id] = { inQty: 0, inAmt: 0, outQty: 0, outAmt: 0 };
        movementMap[id].inQty += item.quantity;
        movementMap[id].inAmt += item.total || 0;
      });
    });

    warehouseReceipts.forEach((doc: any) => {
      doc.items.forEach((item: any) => {
        const id = item.product.toString();
        if (!movementMap[id]) movementMap[id] = { inQty: 0, inAmt: 0, outQty: 0, outAmt: 0 };
        movementMap[id].inQty += item.quantity;
        movementMap[id].inAmt += item.total || 0;
      });
    });

    shipments.forEach((doc: any) => {
      doc.items.forEach((item: any) => {
        const id = item.product.toString();
        if (!movementMap[id]) movementMap[id] = { inQty: 0, inAmt: 0, outQty: 0, outAmt: 0 };
        movementMap[id].outQty += item.quantity;
        // Cost of goods sold - simplified for turnover report
        // Note: Real COGS might use different costPrice, using current costPrice
      });
    });

    writeoffs.forEach((doc: any) => {
      doc.items.forEach((item: any) => {
        const id = item.product.toString();
        if (!movementMap[id]) movementMap[id] = { inQty: 0, inAmt: 0, outQty: 0, outAmt: 0 };
        movementMap[id].outQty += item.quantity;
        movementMap[id].outAmt += item.total || 0;
      });
    });

    // Build turnover report and calculate totals
    const items = [];
    let totals = {
      openingQty: 0, openingAmount: 0,
      incomingQty: 0, incomingAmount: 0,
      outgoingQty: 0, outgoingAmount: 0,
      closingQty: 0, closingAmount: 0
    };

    for (const product of products) {
      const id = product._id.toString();
      const movement = movementMap[id] || { inQty: 0, inAmt: 0, outQty: 0, outAmt: 0 };

      const incomingQty = movement.inQty;
      const incomingAmount = movement.inAmt;
      const outgoingQty = movement.outQty;
      const outgoingAmount = movement.outAmt || (outgoingQty * product.costPrice);

      const netChange = incomingQty - outgoingQty;
      const openingQty = product.quantity - netChange;
      const closingQty = product.quantity;

      const openingAmount = openingQty * product.costPrice;
      const closingAmount = closingQty * product.costPrice;

      const hasMovement = incomingQty > 0 || outgoingQty > 0;

      if (showInactive !== 'true' && !hasMovement && openingQty === 0 && closingQty === 0) {
        continue;
      }

      const reportItem = {
        _id: product._id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        unit: product.unit,
        costPrice: product.costPrice,
        openingQty,
        openingAmount,
        incomingQty,
        incomingAmount,
        outgoingQty,
        outgoingAmount,
        closingQty,
        closingAmount,
        hasMovement,
      };

      items.push(reportItem);

      // Update totals
      totals.openingQty += openingQty;
      totals.openingAmount += openingAmount;
      totals.incomingQty += incomingQty;
      totals.incomingAmount += incomingAmount;
      totals.outgoingQty += outgoingQty;
      totals.outgoingAmount += outgoingAmount;
      totals.closingQty += closingQty;
      totals.closingAmount += closingAmount;
    }

    res.json({
      items,
      totals,
      period: { startDate: start, endDate: end }
    });
  } catch (error) {
    console.error('Turnover report error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
