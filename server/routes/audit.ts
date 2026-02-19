import { Router, Request, Response } from 'express';
import AuditLog from '../models/AuditLog';

const router = Router();

// Get audit logs with filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { user, entity, action, startDate, endDate, limit = '50', page = '1' } = req.query;
    const query: any = {};

    if (user) query.user = user;
    if (entity) query.entity = entity;
    if (action) query.action = action;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 200);
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    res.json({ logs, total, page: pageNum, pages: Math.ceil(total / limitNum) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create audit log entry (used internally)
router.post('/', async (req: Request, res: Response) => {
  try {
    const log = new AuditLog(req.body);
    await log.save();
    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

export default router;
