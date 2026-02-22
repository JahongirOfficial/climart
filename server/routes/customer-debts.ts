import { Router, Request, Response } from 'express';
import Shipment from '../models/Shipment';
import CustomerReturn from '../models/CustomerReturn';
import Partner from '../models/Partner';
import Payment from '../models/Payment';

const router = Router();

// Get customer debts report
router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, customerId } = req.query;
    
    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate as string);
    }

    // Get all customers (partners)
    const customerQuery = customerId ? { _id: customerId } : {};
    const customers = await Partner.find(customerQuery);

    const debtsData = await Promise.all(customers.map(async (customer) => {
      // Get shipments for this customer
      const shipmentQuery: any = { customer: customer._id };
      if (Object.keys(dateFilter).length > 0) {
        shipmentQuery.shipmentDate = dateFilter;
      }
      const shipments = await Shipment.find(shipmentQuery);

      // Get returns for this customer
      const returnQuery: any = { customer: customer._id };
      if (Object.keys(dateFilter).length > 0) {
        returnQuery.returnDate = dateFilter;
      }
      const returns = await CustomerReturn.find(returnQuery);

      // Get payments for this customer
      const paymentQuery: any = { 
        partner: customer._id,
        type: 'incoming'
      };
      if (Object.keys(dateFilter).length > 0) {
        paymentQuery.paymentDate = dateFilter;
      }
      const payments = await Payment.find(paymentQuery);

      // Calculate totals (convert to UZS using exchangeRate)
      const totalSales = shipments.reduce((sum, s) => sum + (s.totalAmount * ((s as any).exchangeRate || 1)), 0);
      const totalPaid = shipments.reduce((sum, s) => sum + (s.paidAmount * ((s as any).exchangeRate || 1)), 0);
      const totalReturns = returns.reduce((sum, r) => sum + (r.totalAmount * ((r as any).exchangeRate || 1)), 0);
      const totalPayments = payments.reduce((sum, p) => sum + (p.amount * ((p as any).exchangeRate || 1)), 0);

      // Debt = Sales - Paid - Returns
      const debt = totalSales - totalPaid - totalReturns;

      // Find last operation date
      const allDates = [
        ...shipments.map(s => new Date(s.shipmentDate)),
        ...returns.map(r => new Date(r.returnDate)),
        ...payments.map(p => new Date(p.paymentDate))
      ];
      const lastOperationDate = allDates.length > 0 
        ? new Date(Math.max(...allDates.map(d => d.getTime())))
        : null;

      // Find overdue invoices (commented out - dueDate not in Shipment model)
      // const overdueShipments = shipments.filter(s => {
      //   if (!s.dueDate) return false;
      //   const dueDate = new Date(s.dueDate);
      //   const today = new Date();
      //   return dueDate < today && (s.totalAmount - s.paidAmount) > 0;
      // });

      // const overdueAmount = overdueShipments.reduce((sum, s) => 
      //   sum + (s.totalAmount - s.paidAmount), 0
      // );

      const overdueAmount = 0; // Placeholder until dueDate is added to Shipment model

      return {
        customerId: customer._id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email,
        totalSales,
        totalPaid,
        totalReturns,
        totalPayments,
        debt,
        overdueAmount,
        lastOperationDate,
        shipmentsCount: shipments.length,
        returnsCount: returns.length,
        paymentsCount: payments.length,
        transactions: [
          ...shipments.map(s => ({
            type: 'shipment',
            date: s.shipmentDate,
            number: s.shipmentNumber,
            amount: s.totalAmount,
            paid: s.paidAmount,
            balance: s.totalAmount - s.paidAmount
          })),
          ...returns.map(r => ({
            type: 'return',
            date: r.returnDate,
            number: r.returnNumber,
            amount: -r.totalAmount,
            paid: 0,
            balance: -r.totalAmount
          })),
          ...payments.map(p => ({
            type: 'payment',
            date: p.paymentDate,
            number: p.paymentNumber,
            amount: 0,
            paid: p.amount,
            balance: -p.amount
          }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      };
    }));

    // Filter out customers with no debt if needed
    const filteredDebts = debtsData.filter(d => d.debt > 0 || d.transactions.length > 0);

    // Sort by debt amount (highest first)
    filteredDebts.sort((a, b) => b.debt - a.debt);

    // Calculate summary
    const summary = {
      totalCustomers: filteredDebts.length,
      totalDebt: filteredDebts.reduce((sum, d) => sum + d.debt, 0),
      totalOverdue: filteredDebts.reduce((sum, d) => sum + d.overdueAmount, 0),
      totalSales: filteredDebts.reduce((sum, d) => sum + d.totalSales, 0),
      totalPaid: filteredDebts.reduce((sum, d) => sum + d.totalPaid, 0),
      customersWithDebt: filteredDebts.filter(d => d.debt > 0).length,
      customersWithOverdue: filteredDebts.filter(d => d.overdueAmount > 0).length
    };

    res.json({
      summary,
      debts: filteredDebts
    });
  } catch (error) {
    console.error('Customer debts report error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get detailed reconciliation report for a customer
router.get('/:customerId/reconciliation', async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { startDate, endDate } = req.query;

    const customer = await Partner.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Build date filter
    const dateFilter: any = {};
    if (startDate) {
      dateFilter.$gte = new Date(startDate as string);
    }
    if (endDate) {
      dateFilter.$lte = new Date(endDate as string);
    }

    // Get all transactions
    const shipmentQuery: any = { customer: customerId };
    if (Object.keys(dateFilter).length > 0) {
      shipmentQuery.shipmentDate = dateFilter;
    }
    const shipments = await Shipment.find(shipmentQuery).sort({ shipmentDate: 1 });

    const returnQuery: any = { customer: customerId };
    if (Object.keys(dateFilter).length > 0) {
      returnQuery.returnDate = dateFilter;
    }
    const returns = await CustomerReturn.find(returnQuery).sort({ returnDate: 1 });

    const paymentQuery: any = { 
      partner: customerId,
      type: 'incoming'
    };
    if (Object.keys(dateFilter).length > 0) {
      paymentQuery.paymentDate = dateFilter;
    }
    const payments = await Payment.find(paymentQuery).sort({ paymentDate: 1 });

    // Build transaction list with running balance
    let runningBalance = 0;
    const transactions = [
      ...shipments.map(s => ({
        type: 'shipment',
        date: s.shipmentDate,
        number: s.shipmentNumber,
        description: `Yuklab yuborish ${s.shipmentNumber}`,
        debit: s.totalAmount,
        credit: 0,
        balance: 0
      })),
      ...returns.map(r => ({
        type: 'return',
        date: r.returnDate,
        number: r.returnNumber,
        description: `Qaytarish ${r.returnNumber}`,
        debit: 0,
        credit: r.totalAmount,
        balance: 0
      })),
      ...payments.map(p => ({
        type: 'payment',
        date: p.paymentDate,
        number: p.paymentNumber,
        description: `To'lov ${p.paymentNumber}`,
        debit: 0,
        credit: p.amount,
        balance: 0
      }))
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate running balance
    transactions.forEach(t => {
      runningBalance += t.debit - t.credit;
      t.balance = runningBalance;
    });

    res.json({
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email
      },
      period: {
        startDate,
        endDate
      },
      transactions,
      summary: {
        totalDebit: transactions.reduce((sum, t) => sum + t.debit, 0),
        totalCredit: transactions.reduce((sum, t) => sum + t.credit, 0),
        finalBalance: runningBalance
      }
    });
  } catch (error) {
    console.error('Reconciliation report error:', error);
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
