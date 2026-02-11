import { Router, Request, Response } from 'express';
import Partner from '../models/Partner';
import Shipment from '../models/Shipment';
import CustomerReturn from '../models/CustomerReturn';
import Receipt from '../models/Receipt';
import SupplierReturn from '../models/SupplierReturn';
import Payment from '../models/Payment';

const router = Router();

// Get mutual settlements report
router.get('/', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, partnerId, partnerType } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    
    // Get partners
    const partnerFilter: any = {};
    if (partnerId) {
      partnerFilter._id = partnerId;
    }
    if (partnerType && partnerType !== 'all') {
      partnerFilter.type = partnerType;
    }
    
    const partners = await Partner.find(partnerFilter).sort({ name: 1 });
    
    // Build settlements report for each partner
    const settlements = await Promise.all(
      partners.map(async (partner) => {
        const partnerId = partner._id.toString();
        
        // Calculate opening balance (all transactions before start date)
        const openingShipments = await Shipment.find({
          partner: partnerId,
          shipmentDate: { $lt: start },
          status: { $in: ['in_transit', 'delivered'] },
        });
        
        const openingCustomerReturns = await CustomerReturn.find({
          partner: partnerId,
          returnDate: { $lt: start },
          status: 'accepted',
        });
        
        const openingReceipts = await Receipt.find({
          supplier: partnerId,
          receiptDate: { $lt: start },
        });
        
        const openingSupplierReturns = await SupplierReturn.find({
          supplier: partnerId,
          returnDate: { $lt: start },
          status: 'accepted',
        });
        
        const openingPayments = await Payment.find({
          partner: partnerId,
          paymentDate: { $lt: start },
          status: 'confirmed',
        });
        
        let openingBalance = 0;
        
        // Sales increase debt (customer owes us)
        openingShipments.forEach(s => {
          openingBalance += s.totalAmount || 0;
        });
        
        // Customer returns decrease debt
        openingCustomerReturns.forEach(r => {
          openingBalance -= r.totalAmount || 0;
        });
        
        // Purchases increase our debt (we owe supplier)
        openingReceipts.forEach(r => {
          r.items.forEach(item => {
            openingBalance -= item.total;
          });
        });
        
        // Supplier returns decrease our debt
        openingSupplierReturns.forEach(r => {
          r.items.forEach(item => {
            openingBalance += item.total;
          });
        });
        
        // Payments
        openingPayments.forEach(p => {
          if (p.type === 'incoming') {
            openingBalance -= p.amount; // Customer paid us
          } else if (p.type === 'outgoing') {
            openingBalance += p.amount; // We paid supplier
          }
        });
        
        // Calculate period transactions
        const periodShipments = await Shipment.find({
          partner: partnerId,
          shipmentDate: { $gte: start, $lte: end },
          status: { $in: ['in_transit', 'delivered'] },
        });
        
        const periodCustomerReturns = await CustomerReturn.find({
          partner: partnerId,
          returnDate: { $gte: start, $lte: end },
          status: 'accepted',
        });
        
        const periodReceipts = await Receipt.find({
          supplier: partnerId,
          receiptDate: { $gte: start, $lte: end },
        });
        
        const periodSupplierReturns = await SupplierReturn.find({
          supplier: partnerId,
          returnDate: { $gte: start, $lte: end },
          status: 'accepted',
        });
        
        const periodPayments = await Payment.find({
          partner: partnerId,
          paymentDate: { $gte: start, $lte: end },
          status: 'confirmed',
        });
        
        let periodDebit = 0; // Приход (increases debt)
        let periodCredit = 0; // Расход (decreases debt)
        
        // Sales
        periodShipments.forEach(s => {
          periodDebit += s.totalAmount || 0;
        });
        
        // Customer returns
        periodCustomerReturns.forEach(r => {
          periodCredit += r.totalAmount || 0;
        });
        
        // Purchases
        periodReceipts.forEach(r => {
          r.items.forEach(item => {
            periodCredit += item.total;
          });
        });
        
        // Supplier returns
        periodSupplierReturns.forEach(r => {
          r.items.forEach(item => {
            periodDebit += item.total;
          });
        });
        
        // Payments
        periodPayments.forEach(p => {
          if (p.type === 'incoming') {
            periodCredit += p.amount;
          } else if (p.type === 'outgoing') {
            periodDebit += p.amount;
          }
        });
        
        const closingBalance = openingBalance + periodDebit - periodCredit;
        
        return {
          partner: {
            _id: partner._id,
            name: partner.name,
            code: partner.code,
            type: partner.type,
          },
          openingBalance,
          periodDebit,
          periodCredit,
          closingBalance,
          // Positive = they owe us (debitor), Negative = we owe them (kreditor)
          isDebitor: closingBalance > 0,
          isKreditor: closingBalance < 0,
        };
      })
    );
    
    // Filter out partners with no activity if needed
    const activeSettlements = settlements.filter(
      s => s.openingBalance !== 0 || s.periodDebit !== 0 || s.periodCredit !== 0 || s.closingBalance !== 0
    );
    
    // Calculate totals
    const totals = {
      openingBalance: activeSettlements.reduce((sum, s) => sum + s.openingBalance, 0),
      periodDebit: activeSettlements.reduce((sum, s) => sum + s.periodDebit, 0),
      periodCredit: activeSettlements.reduce((sum, s) => sum + s.periodCredit, 0),
      closingBalance: activeSettlements.reduce((sum, s) => sum + s.closingBalance, 0),
      totalDebitors: activeSettlements.filter(s => s.isDebitor).reduce((sum, s) => sum + s.closingBalance, 0),
      totalKreditors: activeSettlements.filter(s => s.isKreditor).reduce((sum, s) => sum + Math.abs(s.closingBalance), 0),
    };
    
    res.json({
      period: {
        startDate: start,
        endDate: end,
      },
      settlements: activeSettlements,
      totals,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get detailed settlement for specific partner
router.get('/partner/:partnerId', async (req: Request, res: Response) => {
  try {
    const { partnerId } = req.params;
    const { startDate, endDate } = req.query;
    
    if (!startDate || !endDate) {
      return res.status(400).json({ message: 'Start date and end date are required' });
    }
    
    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    
    const partner = await Partner.findById(partnerId);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    
    // Get all transactions in period
    const shipments = await Shipment.find({
      partner: partnerId,
      shipmentDate: { $gte: start, $lte: end },
      status: { $in: ['in_transit', 'delivered'] },
    }).sort({ shipmentDate: 1 });
    
    const customerReturns = await CustomerReturn.find({
      partner: partnerId,
      returnDate: { $gte: start, $lte: end },
      status: 'accepted',
    }).sort({ returnDate: 1 });
    
    const receipts = await Receipt.find({
      supplier: partnerId,
      receiptDate: { $gte: start, $lte: end },
    }).sort({ receiptDate: 1 });
    
    const supplierReturns = await SupplierReturn.find({
      supplier: partnerId,
      returnDate: { $gte: start, $lte: end },
      status: 'accepted',
    }).sort({ returnDate: 1 });
    
    const payments = await Payment.find({
      partner: partnerId,
      paymentDate: { $gte: start, $lte: end },
      status: 'confirmed',
    }).sort({ paymentDate: 1 });
    
    // Build transaction list
    const transactions: any[] = [];
    
    shipments.forEach(s => {
      transactions.push({
        date: s.shipmentDate,
        type: 'shipment',
        documentNumber: s.shipmentNumber,
        description: 'Yuklama',
        debit: s.totalAmount || 0,
        credit: 0,
      });
    });
    
    customerReturns.forEach(r => {
      transactions.push({
        date: r.returnDate,
        type: 'customer_return',
        documentNumber: r.returnNumber,
        description: 'Mijoz qaytarishi',
        debit: 0,
        credit: r.totalAmount || 0,
      });
    });
    
    receipts.forEach(r => {
      const total = r.items.reduce((sum, item) => sum + item.total, 0);
      transactions.push({
        date: r.receiptDate,
        type: 'receipt',
        documentNumber: r.receiptNumber,
        description: 'Xarid',
        debit: 0,
        credit: total,
      });
    });
    
    supplierReturns.forEach(r => {
      const total = r.items.reduce((sum, item) => sum + item.total, 0);
      transactions.push({
        date: r.returnDate,
        type: 'supplier_return',
        documentNumber: r.returnNumber,
        description: 'Yetkazib beruvchiga qaytarish',
        debit: total,
        credit: 0,
      });
    });
    
    payments.forEach(p => {
      transactions.push({
        date: p.paymentDate,
        type: 'payment',
        documentNumber: p.paymentNumber,
        description: p.type === 'incoming' ? 'To\'lov olindi' : 'To\'lov qilindi',
        debit: p.type === 'outgoing' ? p.amount : 0,
        credit: p.type === 'incoming' ? p.amount : 0,
      });
    });
    
    // Sort by date
    transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    res.json({
      partner: {
        _id: partner._id,
        name: partner.name,
        code: partner.code,
        type: partner.type,
      },
      period: {
        startDate: start,
        endDate: end,
      },
      transactions,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
