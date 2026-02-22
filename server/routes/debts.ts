import { Router, Request, Response } from 'express';
import Receipt from '../models/Receipt';
import Payment from '../models/Payment';
import SupplierReturn from '../models/SupplierReturn';
import SupplierInvoice from '../models/SupplierInvoice';
import mongoose from 'mongoose';

const router = Router();

// Get debts summary by supplier
router.get('/summary', async (req: Request, res: Response) => {
  try {
    // Aggregate debts by supplier
    const debtsSummary = await Receipt.aggregate([
      {
        $group: {
          _id: '$supplier',
          supplierName: { $first: '$supplierName' },
          totalReceived: { $sum: { $multiply: ['$totalAmount', { $ifNull: ['$exchangeRate', 1] }] } },
          lastOperationDate: { $max: '$receiptDate' },
          receipts: { 
            $push: {
              receiptNumber: '$receiptNumber',
              receiptDate: '$receiptDate',
              totalAmount: '$totalAmount'
            }
          }
        }
      }
    ]);

    // Get payments by supplier
    const paymentsSummary = await Payment.aggregate([
      {
        $match: {
          supplier: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$supplier',
          totalPaid: { $sum: { $multiply: ['$amount', { $ifNull: ['$exchangeRate', 1] }] } },
          payments: {
            $push: {
              paymentNumber: '$paymentNumber',
              paymentDate: '$paymentDate',
              amount: '$amount'
            }
          }
        }
      }
    ]);

    // Get returns by supplier
    const returnsSummary = await SupplierReturn.aggregate([
      {
        $group: {
          _id: '$supplier',
          totalReturned: { $sum: { $multiply: ['$totalAmount', { $ifNull: ['$exchangeRate', 1] }] } }
        }
      }
    ]);

    // Get supplier invoices for due dates
    const invoicesSummary = await SupplierInvoice.aggregate([
      {
        $group: {
          _id: '$supplier',
          dueDate: { $min: '$dueDate' },
          status: { $first: '$status' }
        }
      }
    ]);

    // Combine all data
    const debtsData = debtsSummary.map(debt => {
      const payments = paymentsSummary.find(p => p._id?.toString() === debt._id?.toString());
      const returns = returnsSummary.find(r => r._id?.toString() === debt._id?.toString());
      const invoice = invoicesSummary.find(i => i._id?.toString() === debt._id?.toString());
      
      const totalPaid = payments?.totalPaid || 0;
      const totalReturned = returns?.totalReturned || 0;
      const remainingDebt = debt.totalReceived - totalPaid - totalReturned;
      
      // Determine status based on due date and remaining debt
      let status = 'ok';
      if (remainingDebt > 0 && invoice?.dueDate) {
        const today = new Date();
        const dueDate = new Date(invoice.dueDate);
        const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDue < 0) {
          status = 'overdue';
        } else if (daysUntilDue <= 3) {
          status = 'due-soon';
        }
      }
      
      return {
        id: debt._id,
        supplier: debt.supplierName || 'Unknown',
        lastOperationDate: debt.lastOperationDate,
        totalDebt: debt.totalReceived,
        paidAmount: totalPaid,
        returnedAmount: totalReturned,
        remainingDebt: Math.max(0, remainingDebt),
        dueDate: invoice?.dueDate,
        status,
        receipts: debt.receipts || [],
        payments: payments?.payments || []
      };
    });

    res.json(debtsData);
  } catch (error) {
    console.error('Error in /api/debts/summary:', error);
    res.status(500).json({ message: 'Server error', error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Get payment schedule (cash flow)
router.get('/payment-schedule', async (req: Request, res: Response) => {
  try {
    const upcomingPayments = await SupplierInvoice.find({
      status: { $in: ['unpaid', 'partial'] },
      dueDate: { $gte: new Date() }
    })
    .populate('supplier')
    .sort({ dueDate: 1 })
    .limit(10);

    const schedule = upcomingPayments.map(invoice => ({
      date: invoice.dueDate,
      amount: invoice.totalAmount,
      remainingAmount: invoice.totalAmount - invoice.paidAmount,
      supplier: invoice.supplierName,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status
    }));

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get overdue payments
router.get('/overdue', async (req: Request, res: Response) => {
  try {
    const overdueInvoices = await SupplierInvoice.find({
      status: { $in: ['unpaid', 'partial'] },
      dueDate: { $lt: new Date() }
    })
    .populate('supplier')
    .sort({ dueDate: 1 });

    const overdue = overdueInvoices.map(invoice => {
      const daysOverdue = Math.ceil((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        id: invoice._id,
        supplier: invoice.supplierName,
        invoiceNumber: invoice.invoiceNumber,
        dueDate: invoice.dueDate,
        totalAmount: invoice.totalAmount,
        paidAmount: invoice.paidAmount,
        remainingAmount: invoice.totalAmount - invoice.paidAmount,
        daysOverdue,
        status: 'overdue'
      };
    });

    res.json(overdue);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;