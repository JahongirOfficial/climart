import { Router, Request, Response } from 'express';
import Payment from '../models/Payment';

const router = Router();

// Get cash flow report
router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, account, groupBy } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    
    // Get all confirmed payments in the period
    const filter: any = {
      paymentDate: { $gte: start, $lte: end },
      status: 'confirmed',
    };
    
    if (account && account !== 'all') {
      filter.account = account;
    }
    
    const payments = await Payment.find(filter)
      .populate('partner')
      .sort({ paymentDate: 1 });
    
    // Calculate opening balance (all payments before start date)
    const openingPayments = await Payment.find({
      paymentDate: { $lt: start },
      status: 'confirmed',
    });
    
    let openingCash = 0;
    let openingBank = 0;
    
    openingPayments.forEach(payment => {
      if (payment.type === 'incoming') {
        if (payment.account === 'cash') openingCash += payment.amount * (payment.exchangeRate || 1);
        if (payment.account === 'bank') openingBank += payment.amount * (payment.exchangeRate || 1);
      } else if (payment.type === 'outgoing') {
        if (payment.account === 'cash') openingCash -= payment.amount * (payment.exchangeRate || 1);
        if (payment.account === 'bank') openingBank -= payment.amount * (payment.exchangeRate || 1);
      } else if (payment.type === 'transfer') {
        if (payment.fromAccount === 'cash') openingCash -= payment.amount * (payment.exchangeRate || 1);
        if (payment.fromAccount === 'bank') openingBank -= payment.amount * (payment.exchangeRate || 1);
        if (payment.toAccount === 'cash') openingCash += payment.amount * (payment.exchangeRate || 1);
        if (payment.toAccount === 'bank') openingBank += payment.amount * (payment.exchangeRate || 1);
      }
    });
    
    // Group payments by date or category
    const grouped: any = {};
    
    if (groupBy === 'date') {
      // Group by date
      payments.forEach(payment => {
        const dateKey = payment.paymentDate.toISOString().split('T')[0];
        if (!grouped[dateKey]) {
          grouped[dateKey] = {
            date: dateKey,
            cashIncoming: 0,
            cashOutgoing: 0,
            bankIncoming: 0,
            bankOutgoing: 0,
            cashBalance: 0,
            bankBalance: 0,
            payments: [],
          };
        }
        
        grouped[dateKey].payments.push(payment);
        
        if (payment.type === 'incoming') {
          if (payment.account === 'cash') grouped[dateKey].cashIncoming += payment.amount * (payment.exchangeRate || 1);
          if (payment.account === 'bank') grouped[dateKey].bankIncoming += payment.amount * (payment.exchangeRate || 1);
        } else if (payment.type === 'outgoing') {
          if (payment.account === 'cash') grouped[dateKey].cashOutgoing += payment.amount * (payment.exchangeRate || 1);
          if (payment.account === 'bank') grouped[dateKey].bankOutgoing += payment.amount * (payment.exchangeRate || 1);
        }
      });
      
      // Calculate running balance for each date
      let runningCash = openingCash;
      let runningBank = openingBank;
      
      Object.keys(grouped).sort().forEach(dateKey => {
        runningCash += grouped[dateKey].cashIncoming - grouped[dateKey].cashOutgoing;
        runningBank += grouped[dateKey].bankIncoming - grouped[dateKey].bankOutgoing;
        grouped[dateKey].cashBalance = runningCash;
        grouped[dateKey].bankBalance = runningBank;
      });
    } else if (groupBy === 'category') {
      // Group by expense category
      payments.forEach(payment => {
        const categoryKey = payment.category || 'Uncategorized';
        if (!grouped[categoryKey]) {
          grouped[categoryKey] = {
            category: categoryKey,
            incoming: 0,
            outgoing: 0,
            count: 0,
          };
        }
        
        grouped[categoryKey].count++;

        if (payment.type === 'incoming') {
          grouped[categoryKey].incoming += payment.amount * (payment.exchangeRate || 1);
        } else if (payment.type === 'outgoing') {
          grouped[categoryKey].outgoing += payment.amount * (payment.exchangeRate || 1);
        }
      });
    }
    
    // Calculate period totals
    let periodCashIncoming = 0;
    let periodCashOutgoing = 0;
    let periodBankIncoming = 0;
    let periodBankOutgoing = 0;
    
    payments.forEach(payment => {
      if (payment.type === 'incoming') {
        if (payment.account === 'cash') periodCashIncoming += payment.amount * (payment.exchangeRate || 1);
        if (payment.account === 'bank') periodBankIncoming += payment.amount * (payment.exchangeRate || 1);
      } else if (payment.type === 'outgoing') {
        if (payment.account === 'cash') periodCashOutgoing += payment.amount * (payment.exchangeRate || 1);
        if (payment.account === 'bank') periodBankOutgoing += payment.amount * (payment.exchangeRate || 1);
      }
    });
    
    const closingCash = openingCash + periodCashIncoming - periodCashOutgoing;
    const closingBank = openingBank + periodBankIncoming - periodBankOutgoing;
    
    res.json({
      period: {
        startDate: start,
        endDate: end,
      },
      opening: {
        cash: openingCash,
        bank: openingBank,
        total: openingCash + openingBank,
      },
      incoming: {
        cash: periodCashIncoming,
        bank: periodBankIncoming,
        total: periodCashIncoming + periodBankIncoming,
      },
      outgoing: {
        cash: periodCashOutgoing,
        bank: periodBankOutgoing,
        total: periodCashOutgoing + periodBankOutgoing,
      },
      closing: {
        cash: closingCash,
        bank: closingBank,
        total: closingCash + closingBank,
      },
      grouped: Object.values(grouped),
      payments,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
