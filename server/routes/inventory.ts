import { Router, Request, Response } from 'express';
import Inventory from '../models/Inventory';
import Product from '../models/Product';
import Warehouse from '../models/Warehouse';
import Writeoff from '../models/Writeoff';
import WarehouseReceipt from '../models/WarehouseReceipt';

const router = Router();

// Helper function to generate unique inventory number
async function generateInventoryNumber(): Promise<string> {
  const count = await Inventory.countDocuments();
  return `INV-${String(count + 1).padStart(6, '0')}`;
}

// Get all inventories
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
      filter.inventoryDate = {};
      if (startDate) filter.inventoryDate.$gte = new Date(startDate as string);
      if (endDate) filter.inventoryDate.$lte = new Date(endDate as string);
    }
    
    const inventories = await Inventory.find(filter)
      .sort({ inventoryDate: -1 })
      .populate('warehouse');
    
    res.json(inventories);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get inventory by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const inventory = await Inventory.findById(req.params.id)
      .populate('warehouse')
      .populate('items.product')
      .populate('writeoffId')
      .populate('receiptId');
    
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }
    
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get products for inventory (auto-fill)
router.get('/warehouse/:warehouseId/products', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const filter: any = { quantity: { $gt: 0 } };
    
    if (category) {
      filter.category = category;
    }
    
    const products = await Product.find(filter).sort({ name: 1 });
    
    const items = products.map(product => ({
      product: product._id,
      productName: product.name,
      systemQuantity: product.quantity,
      actualQuantity: 0,
      difference: -product.quantity,
      costPrice: product.costPrice,
      differenceAmount: -product.quantity * product.costPrice,
    }));
    
    res.json(items);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create new inventory
router.post('/', async (req: Request, res: Response) => {
  try {
    const inventoryNumber = await generateInventoryNumber();
    
    // Get warehouse name
    const warehouse = await Warehouse.findById(req.body.warehouse);
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }
    
    // Calculate totals
    let totalShortage = 0;
    let totalSurplus = 0;
    let shortageAmount = 0;
    let surplusAmount = 0;
    
    req.body.items.forEach((item: any) => {
      if (item.difference < 0) {
        totalShortage += Math.abs(item.difference);
        shortageAmount += Math.abs(item.differenceAmount);
      } else if (item.difference > 0) {
        totalSurplus += item.difference;
        surplusAmount += item.differenceAmount;
      }
    });
    
    const inventory = new Inventory({
      ...req.body,
      inventoryNumber,
      warehouseName: warehouse.name,
      totalShortage,
      totalSurplus,
      shortageAmount,
      surplusAmount,
    });
    
    await inventory.save();
    
    res.status(201).json(inventory);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Update inventory
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }
    
    if (inventory.status === 'confirmed') {
      return res.status(400).json({ message: 'Cannot edit confirmed inventory' });
    }
    
    // Calculate totals
    let totalShortage = 0;
    let totalSurplus = 0;
    let shortageAmount = 0;
    let surplusAmount = 0;
    
    req.body.items.forEach((item: any) => {
      if (item.difference < 0) {
        totalShortage += Math.abs(item.difference);
        shortageAmount += Math.abs(item.differenceAmount);
      } else if (item.difference > 0) {
        totalSurplus += item.difference;
        surplusAmount += item.differenceAmount;
      }
    });
    
    const updatedInventory = await Inventory.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        totalShortage,
        totalSurplus,
        shortageAmount,
        surplusAmount,
      },
      { new: true, runValidators: true }
    );
    
    res.json(updatedInventory);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Confirm inventory
router.patch('/:id/confirm', async (req: Request, res: Response) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }
    
    if (inventory.status === 'confirmed') {
      return res.status(400).json({ message: 'Inventory already confirmed' });
    }
    
    inventory.status = 'confirmed';
    await inventory.save();
    
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create writeoff from inventory (for shortages)
router.post('/:id/create-writeoff', async (req: Request, res: Response) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }
    
    if (inventory.writeoffCreated) {
      return res.status(400).json({ message: 'Writeoff already created for this inventory' });
    }
    
    // Get shortage items
    const shortageItems = inventory.items
      .filter(item => item.difference < 0)
      .map(item => ({
        product: item.product,
        productName: item.productName,
        quantity: Math.abs(item.difference),
        costPrice: item.costPrice,
        total: Math.abs(item.differenceAmount),
      }));
    
    if (shortageItems.length === 0) {
      return res.status(400).json({ message: 'No shortages found in inventory' });
    }
    
    // Generate writeoff number
    const writeoffCount = await Writeoff.countDocuments();
    const writeoffNumber = `WO-${String(writeoffCount + 1).padStart(6, '0')}`;
    
    const writeoff = new Writeoff({
      writeoffNumber,
      warehouse: inventory.warehouse,
      warehouseName: inventory.warehouseName,
      organization: inventory.organization,
      writeoffDate: inventory.inventoryDate,
      status: 'draft',
      items: shortageItems,
      totalAmount: inventory.shortageAmount,
      reason: 'inventory_shortage',
      notes: `Inventarizatsiya asosida yaratildi: ${inventory.inventoryNumber}`,
    });
    
    await writeoff.save();
    
    inventory.writeoffCreated = true;
    inventory.writeoffId = writeoff._id;
    await inventory.save();
    
    res.json({ inventory, writeoff });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create receipt from inventory (for surplus)
router.post('/:id/create-receipt', async (req: Request, res: Response) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }
    
    if (inventory.receiptCreated) {
      return res.status(400).json({ message: 'Receipt already created for this inventory' });
    }
    
    // Get surplus items
    const surplusItems = inventory.items
      .filter(item => item.difference > 0)
      .map(item => ({
        product: item.product,
        productName: item.productName,
        quantity: item.difference,
        costPrice: item.costPrice,
        total: item.differenceAmount,
      }));
    
    if (surplusItems.length === 0) {
      return res.status(400).json({ message: 'No surplus found in inventory' });
    }
    
    // Generate receipt number
    const receiptCount = await WarehouseReceipt.countDocuments();
    const receiptNumber = `WR-${String(receiptCount + 1).padStart(6, '0')}`;
    
    const receipt = new WarehouseReceipt({
      receiptNumber,
      warehouse: inventory.warehouse,
      warehouseName: inventory.warehouseName,
      organization: inventory.organization,
      receiptDate: inventory.inventoryDate,
      status: 'draft',
      items: surplusItems,
      totalAmount: inventory.surplusAmount,
      reason: 'found_items',
      notes: `Inventarizatsiya asosida yaratildi: ${inventory.inventoryNumber}`,
    });
    
    await receipt.save();
    
    inventory.receiptCreated = true;
    inventory.receiptId = receipt._id;
    await inventory.save();
    
    res.json({ inventory, receipt });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Delete inventory
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ message: 'Inventory not found' });
    }
    
    if (inventory.status === 'confirmed') {
      return res.status(400).json({ message: 'Cannot delete confirmed inventory' });
    }
    
    if (inventory.writeoffCreated || inventory.receiptCreated) {
      return res.status(400).json({ message: 'Cannot delete inventory with created adjustment documents' });
    }
    
    await Inventory.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Inventory deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
