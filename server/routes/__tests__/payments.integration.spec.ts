import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import Payment from '../../models/Payment';
import Partner from '../../models/Partner';
import { setupTestDB, teardownTestDB, clearTestDB } from './test-setup';

describe('Payments Integration Tests with Real MongoDB', () => {
  let testPartnerId: mongoose.Types.ObjectId;

  beforeAll(async () => {
    await setupTestDB();
  }, 60000);

  afterAll(async () => {
    await clearTestDB(['payments', 'partners']);
    // Don't close connection - let other tests use it
  }, 60000);

  beforeEach(async () => {
    await Payment.deleteMany({});
    await Partner.deleteMany({});

    const partner = await Partner.create({
      code: 'PAYPART001',
      name: 'Payment Test Partner',
      type: 'customer',
      isActive: true,
    });
    testPartnerId = partner._id as mongoose.Types.ObjectId;
  });

  describe('Payment CRUD Operations', () => {
    it('should create incoming payment with all required fields', async () => {
      const paymentData = {
        paymentNumber: 'PAY-IN-001',
        type: 'incoming',
        paymentDate: new Date(),
        amount: 1000000,
        partner: testPartnerId,
        partnerName: 'Payment Test Partner',
        account: 'bank',
        paymentMethod: 'bank_transfer',
        purpose: 'Payment for invoice #123',
        status: 'confirmed',
      };

      const payment = await Payment.create(paymentData);

      expect(payment).toBeDefined();
      expect(payment._id).toBeDefined();
      expect(payment.type).toBe('incoming');
      expect(payment.amount).toBe(1000000);
      expect(payment.status).toBe('confirmed');
      expect(payment.partner.toString()).toBe(testPartnerId.toString());
    });

    it('should create outgoing payment with category', async () => {
      const paymentData = {
        paymentNumber: 'PAY-OUT-001',
        type: 'outgoing',
        paymentDate: new Date(),
        amount: 500000,
        partner: testPartnerId,
        partnerName: 'Payment Test Partner',
        account: 'cash',
        paymentMethod: 'cash',
        purpose: 'Payment to supplier',
        category: 'procurement',
        status: 'confirmed',
      };

      const payment = await Payment.create(paymentData);

      expect(payment).toBeDefined();
      expect(payment.type).toBe('outgoing');
      expect(payment.category).toBe('procurement');
      expect(payment.amount).toBe(500000);
    });

    it('should create transfer payment between accounts', async () => {
      const paymentData = {
        paymentNumber: 'PAY-TRANS-001',
        type: 'transfer',
        paymentDate: new Date(),
        amount: 200000,
        fromAccount: 'cash',
        toAccount: 'bank',
        account: 'bank',
        paymentMethod: 'bank_transfer',
        purpose: 'Cash to bank transfer',
        status: 'confirmed',
      };

      const payment = await Payment.create(paymentData);

      expect(payment).toBeDefined();
      expect(payment.type).toBe('transfer');
      expect(payment.fromAccount).toBe('cash');
      expect(payment.toAccount).toBe('bank');
      expect(payment.amount).toBe(200000);
    });

    it('should update payment status from draft to confirmed', async () => {
      const payment = await Payment.create({
        paymentNumber: 'PAY-UPDATE-001',
        type: 'incoming',
        paymentDate: new Date(),
        amount: 100000,
        account: 'bank',
        paymentMethod: 'bank_transfer',
        purpose: 'Test payment',
        status: 'draft',
      });

      payment.status = 'confirmed';
      await payment.save();

      const updated = await Payment.findById(payment._id);
      expect(updated?.status).toBe('confirmed');
    });

    it('should cancel payment', async () => {
      const payment = await Payment.create({
        paymentNumber: 'PAY-CANCEL-001',
        type: 'outgoing',
        paymentDate: new Date(),
        amount: 50000,
        account: 'cash',
        paymentMethod: 'cash',
        purpose: 'Test payment',
        status: 'confirmed',
      });

      payment.status = 'cancelled';
      await payment.save();

      const updated = await Payment.findById(payment._id);
      expect(updated?.status).toBe('cancelled');
    });

    it('should delete payment from database', async () => {
      const payment = await Payment.create({
        paymentNumber: 'PAY-DELETE-001',
        type: 'incoming',
        paymentDate: new Date(),
        amount: 75000,
        account: 'bank',
        paymentMethod: 'bank_transfer',
        purpose: 'Test payment',
        status: 'draft',
      });

      await Payment.findByIdAndDelete(payment._id);

      const deleted = await Payment.findById(payment._id);
      expect(deleted).toBeNull();
    });
  });

  describe('Payment Queries and Filters', () => {
    beforeEach(async () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      await Payment.create([
        {
          paymentNumber: 'PAY-Q-001',
          type: 'incoming',
          paymentDate: today,
          amount: 1000000,
          partner: testPartnerId,
          partnerName: 'Payment Test Partner',
          account: 'bank',
          paymentMethod: 'bank_transfer',
          purpose: 'Invoice payment',
          status: 'confirmed',
        },
        {
          paymentNumber: 'PAY-Q-002',
          type: 'outgoing',
          paymentDate: yesterday,
          amount: 500000,
          partner: testPartnerId,
          partnerName: 'Payment Test Partner',
          account: 'cash',
          paymentMethod: 'cash',
          purpose: 'Supplier payment',
          category: 'procurement',
          status: 'confirmed',
        },
        {
          paymentNumber: 'PAY-Q-003',
          type: 'incoming',
          paymentDate: today,
          amount: 250000,
          account: 'bank',
          paymentMethod: 'card',
          purpose: 'Card payment',
          status: 'draft',
        },
      ]);
    });

    it('should filter payments by type', async () => {
      const incomingPayments = await Payment.find({ type: 'incoming' });
      const outgoingPayments = await Payment.find({ type: 'outgoing' });

      expect(incomingPayments.length).toBeGreaterThanOrEqual(2);
      expect(outgoingPayments.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter payments by status', async () => {
      const confirmedPayments = await Payment.find({ status: 'confirmed' });
      const draftPayments = await Payment.find({ status: 'draft' });

      expect(confirmedPayments.length).toBeGreaterThanOrEqual(2);
      expect(draftPayments.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter payments by partner', async () => {
      const partnerPayments = await Payment.find({ partner: testPartnerId });

      expect(partnerPayments.length).toBeGreaterThanOrEqual(2);
      partnerPayments.forEach(payment => {
        expect(payment.partner?.toString()).toBe(testPartnerId.toString());
      });
    });

    it('should filter payments by account', async () => {
      const bankPayments = await Payment.find({ account: 'bank' });
      const cashPayments = await Payment.find({ account: 'cash' });

      expect(bankPayments.length).toBeGreaterThanOrEqual(1);
      expect(cashPayments.length).toBeGreaterThanOrEqual(1);
    });

    it('should calculate total amount by type', async () => {
      const incomingPayments = await Payment.find({ 
        type: 'incoming',
        status: 'confirmed'
      });
      
      const totalIncoming = incomingPayments.reduce((sum, p) => sum + p.amount, 0);
      expect(totalIncoming).toBeGreaterThan(0);
    });

    it('should sort payments by date', async () => {
      const payments = await Payment.find().sort({ paymentDate: -1 });

      expect(payments.length).toBeGreaterThanOrEqual(3);
      for (let i = 0; i < payments.length - 1; i++) {
        expect(payments[i].paymentDate.getTime()).toBeGreaterThanOrEqual(
          payments[i + 1].paymentDate.getTime()
        );
      }
    });
  });

  describe('Payment Validation', () => {
    it('should require paymentNumber', async () => {
      const paymentData = {
        type: 'incoming',
        paymentDate: new Date(),
        amount: 100000,
        account: 'bank',
        paymentMethod: 'bank_transfer',
        purpose: 'Test',
        status: 'draft',
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });

    it('should require type', async () => {
      const paymentData = {
        paymentNumber: 'PAY-001',
        paymentDate: new Date(),
        amount: 100000,
        account: 'bank',
        paymentMethod: 'bank_transfer',
        purpose: 'Test',
        status: 'draft',
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });

    it('should require amount', async () => {
      const paymentData = {
        paymentNumber: 'PAY-001',
        type: 'incoming',
        paymentDate: new Date(),
        account: 'bank',
        paymentMethod: 'bank_transfer',
        purpose: 'Test',
        status: 'draft',
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });

    it('should validate amount is positive', async () => {
      const paymentData = {
        paymentNumber: 'PAY-001',
        type: 'incoming',
        paymentDate: new Date(),
        amount: -100000,
        account: 'bank',
        paymentMethod: 'bank_transfer',
        purpose: 'Test',
        status: 'draft',
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });

    it('should validate type enum values', async () => {
      const paymentData = {
        paymentNumber: 'PAY-001',
        type: 'invalid_type',
        paymentDate: new Date(),
        amount: 100000,
        account: 'bank',
        paymentMethod: 'bank_transfer',
        purpose: 'Test',
        status: 'draft',
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });

    it('should validate status enum values', async () => {
      const paymentData = {
        paymentNumber: 'PAY-001',
        type: 'incoming',
        paymentDate: new Date(),
        amount: 100000,
        account: 'bank',
        paymentMethod: 'bank_transfer',
        purpose: 'Test',
        status: 'invalid_status',
      };

      await expect(Payment.create(paymentData)).rejects.toThrow();
    });
  });

  describe('Payment Indexes', () => {
    it('should have index on paymentNumber', async () => {
      const indexes = await Payment.collection.getIndexes();
      expect(indexes).toHaveProperty('paymentNumber_1');
    });

    it('should have index on type', async () => {
      const indexes = await Payment.collection.getIndexes();
      expect(indexes).toHaveProperty('type_1');
    });

    it('should have index on status', async () => {
      const indexes = await Payment.collection.getIndexes();
      expect(indexes).toHaveProperty('status_1');
    });
  });

  describe('Complex Payment Scenarios', () => {
    it('should handle multiple payments for same partner', async () => {
      const payments = await Payment.create([
        {
          paymentNumber: 'PAY-MULTI-001',
          type: 'incoming',
          paymentDate: new Date(),
          amount: 100000,
          partner: testPartnerId,
          partnerName: 'Payment Test Partner',
          account: 'bank',
          paymentMethod: 'bank_transfer',
          purpose: 'Payment 1',
          status: 'confirmed',
        },
        {
          paymentNumber: 'PAY-MULTI-002',
          type: 'incoming',
          paymentDate: new Date(),
          amount: 200000,
          partner: testPartnerId,
          partnerName: 'Payment Test Partner',
          account: 'bank',
          paymentMethod: 'bank_transfer',
          purpose: 'Payment 2',
          status: 'confirmed',
        },
      ]);

      expect(payments).toHaveLength(2);

      const partnerPayments = await Payment.find({ partner: testPartnerId });
      expect(partnerPayments.length).toBeGreaterThanOrEqual(2);
    });

    it('should calculate balance for partner', async () => {
      await Payment.create([
        {
          paymentNumber: 'PAY-BAL-001',
          type: 'incoming',
          paymentDate: new Date(),
          amount: 1000000,
          partner: testPartnerId,
          partnerName: 'Payment Test Partner',
          account: 'bank',
          paymentMethod: 'bank_transfer',
          purpose: 'Income',
          status: 'confirmed',
        },
        {
          paymentNumber: 'PAY-BAL-002',
          type: 'outgoing',
          paymentDate: new Date(),
          amount: 300000,
          partner: testPartnerId,
          partnerName: 'Payment Test Partner',
          account: 'bank',
          paymentMethod: 'bank_transfer',
          purpose: 'Refund',
          status: 'confirmed',
        },
      ]);

      const incoming = await Payment.find({ 
        partner: testPartnerId, 
        type: 'incoming',
        status: 'confirmed'
      });
      const outgoing = await Payment.find({ 
        partner: testPartnerId, 
        type: 'outgoing',
        status: 'confirmed'
      });

      const totalIncoming = incoming.reduce((sum, p) => sum + p.amount, 0);
      const totalOutgoing = outgoing.reduce((sum, p) => sum + p.amount, 0);
      const balance = totalIncoming - totalOutgoing;

      expect(balance).toBe(700000);
    });
  });

});