import { Router, Request, Response } from 'express';
import CustomerOrder from '../models/CustomerOrder';

const router = Router();

// Get sales funnel data - orders grouped by status
router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const match: any = {};

    if (startDate || endDate) {
      match.orderDate = {};
      if (startDate) match.orderDate.$gte = new Date(startDate as string);
      if (endDate) {
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        match.orderDate.$lte = end;
      }
    }

    // Status order for funnel
    const statusOrder = ['new', 'confirmed', 'assembled', 'shipped', 'delivered', 'returned', 'cancelled'];

    // Aggregate orders by status
    const pipeline: any[] = [];
    if (Object.keys(match).length > 0) {
      pipeline.push({ $match: match });
    }

    pipeline.push({
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        avgAmount: { $avg: '$totalAmount' },
      }
    });

    const statusGroups = await CustomerOrder.aggregate(pipeline);

    // Calculate average time between status transitions
    // Get orders with timestamps to compute avg days in each status
    const ordersPipeline: any[] = [];
    if (Object.keys(match).length > 0) {
      ordersPipeline.push({ $match: match });
    }
    ordersPipeline.push({
      $group: {
        _id: '$status',
        avgDays: {
          $avg: {
            $divide: [
              { $subtract: ['$updatedAt', '$createdAt'] },
              86400000 // milliseconds in a day
            ]
          }
        }
      }
    });

    const avgTimes = await CustomerOrder.aggregate(ordersPipeline);
    const avgTimeMap: Record<string, number> = {};
    avgTimes.forEach((at: any) => { avgTimeMap[at._id] = at.avgDays; });

    // Build funnel data
    const totalOrders = statusGroups.reduce((sum: number, g: any) => sum + g.count, 0);
    const statusMap: Record<string, any> = {};
    statusGroups.forEach((g: any) => { statusMap[g._id] = g; });

    // Forward-flow statuses for conversion calculation
    const forwardStatuses = ['new', 'confirmed', 'assembled', 'shipped', 'delivered'];

    const funnel = statusOrder.map((status, index) => {
      const group = statusMap[status] || { count: 0, totalAmount: 0, avgAmount: 0 };
      const isForward = forwardStatuses.includes(status);

      // Conversion: percentage of orders that reached this status compared to previous forward status
      let conversion = 0;
      if (index === 0 && isForward) {
        conversion = 100;
      } else if (isForward) {
        // Find previous forward status count
        const prevForwardIdx = forwardStatuses.indexOf(status) - 1;
        if (prevForwardIdx >= 0) {
          const prevStatus = forwardStatuses[prevForwardIdx];
          const prevCount = statusMap[prevStatus]?.count || 0;
          // Count is cumulative: orders at this stage + all later forward stages
          const cumulativeCount = forwardStatuses.slice(forwardStatuses.indexOf(status))
            .reduce((sum, s) => sum + (statusMap[s]?.count || 0), 0);
          const prevCumulative = forwardStatuses.slice(prevForwardIdx)
            .reduce((sum, s) => sum + (statusMap[s]?.count || 0), 0);
          conversion = prevCumulative > 0 ? Math.round((cumulativeCount / prevCumulative) * 100) : 0;
        }
      }

      return {
        status,
        count: group.count,
        totalAmount: Math.round(group.totalAmount),
        avgAmount: Math.round(group.avgAmount),
        avgDays: Math.round((avgTimeMap[status] || 0) * 10) / 10,
        conversion,
        percentage: totalOrders > 0 ? Math.round((group.count / totalOrders) * 100) : 0,
      };
    });

    // Customer-based stats
    const customerPipeline: any[] = [];
    if (Object.keys(match).length > 0) {
      customerPipeline.push({ $match: match });
    }
    customerPipeline.push(
      {
        $group: {
          _id: '$customer',
          customerName: { $first: '$customerName' },
          totalOrders: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
          deliveredCount: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          cancelledCount: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
        }
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 20 }
    );

    const topCustomers = await CustomerOrder.aggregate(customerPipeline);

    res.json({
      funnel,
      totalOrders,
      totalAmount: statusGroups.reduce((sum: number, g: any) => sum + g.totalAmount, 0),
      topCustomers: topCustomers.map((c: any) => ({
        customerId: c._id,
        customerName: c.customerName,
        totalOrders: c.totalOrders,
        totalAmount: Math.round(c.totalAmount),
        deliveredCount: c.deliveredCount,
        cancelledCount: c.cancelledCount,
        conversionRate: c.totalOrders > 0 ? Math.round((c.deliveredCount / c.totalOrders) * 100) : 0,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
