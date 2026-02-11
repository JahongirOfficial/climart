import { Router, Request, Response } from 'express';
import Warehouse from '../models/Warehouse';

const router = Router();

// Get all warehouses
router.get('/', async (req: Request, res: Response) => {
  try {
    const warehouses = await Warehouse.find().sort({ name: 1 });
    res.json(warehouses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get warehouse by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }
    res.json(warehouse);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create new warehouse
router.post('/', async (req: Request, res: Response) => {
  try {
    const warehouse = new Warehouse(req.body);
    await warehouse.save();
    res.status(201).json(warehouse);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Warehouse name or code already exists' });
    }
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Update warehouse
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const warehouse = await Warehouse.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }
    res.json(warehouse);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Delete warehouse
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);
    if (!warehouse) {
      return res.status(404).json({ message: 'Warehouse not found' });
    }
    res.json({ message: 'Warehouse deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
