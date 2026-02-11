import { Router, Request, Response } from 'express';
import WarehouseExpense from '../models/WarehouseExpense';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, warehouse } = req.query;
    
    const filter: any = {};
    if (startDate || endDate) {
      filter.expenseDate = {};
      if (startDate) filter.expenseDate.$gte = new Date(startDate as string);
      if (endDate) filter.expenseDate.$lte = new Date(endDate as string);
    }
    if (warehouse) filter.warehouse = warehouse;

    const expenses = await WarehouseExpense.find(filter)
      .populate('warehouse')
      .sort({ expenseDate: -1 });
    
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    
    const matchStage: any = {};
    if (startDate || endDate) {
      matchStage.expenseDate = {};
      if (startDate) matchStage.expenseDate.$gte = new Date(startDate as string);
      if (endDate) matchStage.expenseDate.$lte = new Date(endDate as string);
    }

    const summary = await WarehouseExpense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const expense = new WarehouseExpense(req.body);
    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const expense = await WarehouseExpense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
