import { Router, Request, Response } from 'express';
import Task from '../models/Task';
import { logAudit } from '../utils/auditLogger';

const router = Router();

// Get all tasks with filters
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, priority, assignedTo, page = '1', limit = '50' } = req.query;
    const query: any = {};

    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;
    if (assignedTo) query.assignedTo = assignedTo;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const [tasks, total] = await Promise.all([
      Task.find(query)
        .sort({ priority: -1, dueDate: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Task.countDocuments(query),
    ]);

    res.json({
      tasks,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get task statistics
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [pending, inProgress, completed, overdue] = await Promise.all([
      Task.countDocuments({ status: 'pending' }),
      Task.countDocuments({ status: 'in_progress' }),
      Task.countDocuments({ status: 'completed' }),
      Task.countDocuments({
        status: { $in: ['pending', 'in_progress'] },
        dueDate: { $lt: new Date() },
      }),
    ]);

    res.json({ pending, inProgress, completed, overdue });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create task
router.post('/', async (req: Request, res: Response) => {
  try {
    const task = new Task({
      ...req.body,
      createdBy: req.user?.userId,
      createdByName: req.user?.name || 'Noma\'lum',
    });

    await task.save();

    logAudit({
      userId: req.user?.userId,
      userName: req.user?.name || 'Noma\'lum',
      action: 'create',
      entity: 'Task',
      entityId: task._id.toString(),
      entityName: task.title,
      ipAddress: req.ip,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Update task
router.put('/:id', async (req: Request, res: Response) => {
  try {
    // If completing, set completedAt
    if (req.body.status === 'completed' && !req.body.completedAt) {
      req.body.completedAt = new Date();
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    logAudit({
      userId: req.user?.userId,
      userName: req.user?.name || 'Noma\'lum',
      action: 'update',
      entity: 'Task',
      entityId: task._id.toString(),
      entityName: task.title,
      ipAddress: req.ip,
    });

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Update task status
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const update: any = { status };

    if (status === 'completed') {
      update.completedAt = new Date();
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      update,
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Delete task
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    logAudit({
      userId: req.user?.userId,
      userName: req.user?.name || 'Noma\'lum',
      action: 'delete',
      entity: 'Task',
      entityId: req.params.id,
      entityName: task.title,
      ipAddress: req.ip,
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
