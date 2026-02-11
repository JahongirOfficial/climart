import { Router, Request, Response } from 'express';
import Partner from '../models/Partner';
import Shipment from '../models/Shipment';
import Receipt from '../models/Receipt';
import Payment from '../models/Payment';
import CustomerInvoice from '../models/CustomerInvoice';
import CustomerReturn from '../models/CustomerReturn';
import SupplierReturn from '../models/SupplierReturn';

const router = Router();

// Helper function to generate unique partner code
async function generatePartnerCode(): Promise<string> {
  const count = await Partner.countDocuments();
  return `P${String(count + 1).padStart(6, '0')}`;
}

// Get all partners with statistics
router.get('/', async (req: Request, res: Response) => {
  try {
    const { type, status, group, search } = req.query;
    const filter: any = { isActive: true };
    
    if (type) {
      filter.$or = [{ type }, { type: 'both' }];
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (group) {
      filter.group = group;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }
    
    const partners = await Partner.find(filter).sort({ name: 1 });
    
    // Calculate statistics for each partner
    const partnersWithStats = await Promise.all(
      partners.map(async (partner) => {
        const partnerId = partner._id.toString();
        
        // For customers: calculate sales, payments, returns
        let totalSales = 0;
        let totalPayments = 0;
        let totalReturns = 0;
        let lastPurchaseDate: Date | undefined;
        let salesCount = 0;
        
        if (partner.type === 'customer' || partner.type === 'both') {
          const shipments = await Shipment.find({ customer: partnerId });
          totalSales = shipments.reduce((sum, s) => sum + s.totalAmount, 0);
          salesCount = shipments.length;
          
          if (shipments.length > 0) {
            lastPurchaseDate = shipments.sort((a, b) => 
              new Date(b.shipmentDate).getTime() - new Date(a.shipmentDate).getTime()
            )[0].shipmentDate;
          }
          
          const invoices = await CustomerInvoice.find({ customer: partnerId });
          totalPayments = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
          
          const returns = await CustomerReturn.find({ customer: partnerId, status: 'accepted' });
          totalReturns = returns.reduce((sum, r) => sum + r.totalAmount, 0);
        }
        
        // For suppliers: calculate purchases, payments, returns
        let totalPurchases = 0;
        let totalSupplierPayments = 0;
        let totalSupplierReturns = 0;
        
        if (partner.type === 'supplier' || partner.type === 'both') {
          const receipts = await Receipt.find({ supplier: partnerId });
          totalPurchases = receipts.reduce((sum, r) => sum + r.totalAmount, 0);
          
          const payments = await Payment.find({ supplier: partnerId });
          totalSupplierPayments = payments.reduce((sum, p) => sum + p.amount, 0);
          
          const returns = await SupplierReturn.find({ supplier: partnerId });
          totalSupplierReturns = returns.reduce((sum, r) => sum + r.totalAmount, 0);
        }
        
        // Calculate balance
        // For customers: positive balance = they owe us (debtor)
        // For suppliers: negative balance = we owe them (creditor)
        let balance = 0;
        if (partner.type === 'customer') {
          balance = totalSales - totalPayments - totalReturns;
        } else if (partner.type === 'supplier') {
          balance = -(totalPurchases - totalSupplierPayments - totalSupplierReturns);
        } else {
          // both
          const customerBalance = totalSales - totalPayments - totalReturns;
          const supplierBalance = -(totalPurchases - totalSupplierPayments - totalSupplierReturns);
          balance = customerBalance + supplierBalance;
        }
        
        const averageCheck = salesCount > 0 ? totalSales / salesCount : 0;
        
        let debtorStatus: 'ok' | 'debtor' | 'creditor' = 'ok';
        if (balance > 0) debtorStatus = 'debtor';
        else if (balance < 0) debtorStatus = 'creditor';
        
        return {
          ...partner.toObject(),
          balance,
          totalSales,
          totalPurchases,
          lastPurchaseDate: lastPurchaseDate?.toISOString(),
          averageCheck,
          debtorStatus,
        };
      })
    );
    
    res.json(partnersWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get partner by ID with detailed statistics
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    
    const partnerId = partner._id.toString();
    
    // Get detailed transaction history
    const shipments = await Shipment.find({ customer: partnerId }).sort({ shipmentDate: -1 });
    const invoices = await CustomerInvoice.find({ customer: partnerId }).sort({ invoiceDate: -1 });
    const customerReturns = await CustomerReturn.find({ customer: partnerId }).sort({ returnDate: -1 });
    const receipts = await Receipt.find({ supplier: partnerId }).sort({ receiptDate: -1 });
    const payments = await Payment.find({ supplier: partnerId }).sort({ paymentDate: -1 });
    const supplierReturns = await SupplierReturn.find({ supplier: partnerId }).sort({ returnDate: -1 });
    
    res.json({
      partner,
      transactions: {
        shipments,
        invoices,
        customerReturns,
        receipts,
        payments,
        supplierReturns,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Create new partner
router.post('/', async (req: Request, res: Response) => {
  try {
    const code = await generatePartnerCode();
    const partner = new Partner({ ...req.body, code });
    await partner.save();
    res.status(201).json(partner);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Update partner
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const partner = await Partner.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    
    res.json(partner);
  } catch (error) {
    res.status(400).json({ message: 'Invalid data', error });
  }
});

// Delete partner (soft delete)
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const partner = await Partner.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!partner) {
      return res.status(404).json({ message: 'Partner not found' });
    }
    
    res.json({ message: 'Partner deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
