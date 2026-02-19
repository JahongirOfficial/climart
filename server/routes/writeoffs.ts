import { Router, Request, Response } from 'express';
import Writeoff from '../models/Writeoff';
import Product from '../models/Product';
import Warehouse from '../models/Warehouse';
import { generateDocNumber } from '../utils/documentNumber';

const router = Router();

// Helper function to generate unique writeoff number
async function generateWriteoffNumber(): Promise<string> {
  return generateDocNumber('WO', { withYear: false, padWidth: 6 });
}

// Get all writeoffs
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
      filter.writeoffDate = {};
      if (startDate) filter.writeoffDate.$gte = new Date(startDate as string);
      if (endDate) filter.writeoffDate.$lte = new Date(endDate as string);
    }
    
    const writeoffs = await Writeoff.find(filter)
      .sort({ writeoffDate: -1 })
      .populate('warehouse');
    
    res.json(writeoffs);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get writeoff by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const writeoff = await Writeoff.findById(req.params.id)
      .populate('warehouse')
      .populate('items.product');
    
    if (!writeoff) {
      return res.status(404).json({ message: 'Writeoff not found' });
    }
    
    res.json(writeoff);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create new writeoff
router.post('/', async (req: Request, res: Response) => {
  try {
    const writeoffNumber = await generateWriteoffNumber();
    
    // Get warehouse name
    const warehouse = await Warehouse.findById(req.body.warehouse);
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }
    
    // Validate stock availability for each item
    for (const item of req.body.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productName} not found` });
      }
      
      if (product.quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.productName}. Available: ${product.quantity}, Requested: ${item.quantity}` 
        });
      }
    }
    
    // Calculate total amount
    const totalAmount = req.body.items.reduce((sum: number, item: any) => sum + item.total, 0);
    
    const writeoff = new Writeoff({
      ...req.body,
      writeoffNumber,
      warehouseName: warehouse.name,
      totalAmount,
    });
    
    await writeoff.save();
    
    // If confirmed, update product quantities
    if (writeoff.status === 'confirmed') {
      await updateProductQuantities(writeoff, 'decrease');
    }
    
    res.status(201).json(writeoff);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Update writeoff
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const oldWriteoff = await Writeoff.findById(req.params.id);
    if (!oldWriteoff) {
      return res.status(404).json({ message: 'Writeoff not found' });
    }
    
    // If was confirmed, revert quantities first
    if (oldWriteoff.status === 'confirmed') {
      await updateProductQuantities(oldWriteoff, 'increase');
    }
    
    // Validate stock availability for each item
    for (const item of req.body.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productName} not found` });
      }
      
      if (product.quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.productName}. Available: ${product.quantity}, Requested: ${item.quantity}` 
        });
      }
    }
    
    // Calculate total amount
    const totalAmount = req.body.items.reduce((sum: number, item: any) => sum + item.total, 0);
    
    const writeoff = await Writeoff.findByIdAndUpdate(
      req.params.id,
      { ...req.body, totalAmount },
      { new: true, runValidators: true }
    );
    
    if (!writeoff) {
      return res.status(404).json({ message: 'Writeoff not found' });
    }
    
    // If now confirmed, update quantities
    if (writeoff.status === 'confirmed') {
      await updateProductQuantities(writeoff, 'decrease');
    }
    
    res.json(writeoff);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Confirm writeoff
router.patch('/:id/confirm', async (req: Request, res: Response) => {
  try {
    const writeoff = await Writeoff.findById(req.params.id);
    if (!writeoff) {
      return res.status(404).json({ message: 'Writeoff not found' });
    }
    
    if (writeoff.status === 'confirmed') {
      return res.status(400).json({ message: 'Writeoff already confirmed' });
    }
    
    // Validate stock availability
    for (const item of writeoff.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found` });
      }
      
      if (product.quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${item.productName}. Available: ${product.quantity}, Requested: ${item.quantity}` 
        });
      }
    }
    
    writeoff.status = 'confirmed';
    await writeoff.save();
    
    // Update product quantities
    await updateProductQuantities(writeoff, 'decrease');
    
    res.json(writeoff);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Delete writeoff
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const writeoff = await Writeoff.findById(req.params.id);
    if (!writeoff) {
      return res.status(404).json({ message: 'Writeoff not found' });
    }
    
    // If confirmed, revert quantities first
    if (writeoff.status === 'confirmed') {
      await updateProductQuantities(writeoff, 'increase');
    }
    
    await Writeoff.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Writeoff deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Helper function to update product quantities
async function updateProductQuantities(writeoff: any, operation: 'increase' | 'decrease') {
  const multiplier = operation === 'decrease' ? -1 : 1;
  
  for (const item of writeoff.items) {
    await Product.findByIdAndUpdate(
      item.product,
      { $inc: { quantity: multiplier * item.quantity } }
    );
  }
}

export default router;
