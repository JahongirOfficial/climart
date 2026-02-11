import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import Contract from '../../models/Contract';
import Partner from '../../models/Partner';
import { setupTestDB, teardownTestDB, clearTestDB } from './test-setup';

describe('Contracts Integration Tests', () => {
  let testPartner: any;

  beforeAll(async () => {
    await setupTestDB();
  }, 60000);

  afterAll(async () => {
    await clearTestDB(['contracts', 'partners']);
    // Don't close connection - let other tests use it
  }, 60000);

  beforeEach(async () => {
    await Contract.deleteMany({});
    await Partner.deleteMany({});

    const timestamp = Date.now();
    testPartner = await Partner.create({
      code: `PART-${timestamp}`,
      name: 'Test Partner',
      type: 'customer',
      isActive: true,
    });
  });

  describe('Contract CRUD Operations', () => {
    it('should create a new contract', async () => {
      const timestamp = Date.now();
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const contractData = {
        contractNumber: `CNT-${timestamp}`,
        partner: testPartner._id,
        partnerName: testPartner.name,
        contractDate: new Date(),
        startDate: new Date(),
        endDate: futureDate,
        currency: 'UZS',
        totalAmount: 10000000,
        status: 'active',
        isDefault: false,
      };

      const contract = await Contract.create(contractData);

      expect(contract).toBeDefined();
      expect(contract.contractNumber).toBe(`CNT-${timestamp}`);
      expect(contract.currency).toBe('UZS');
      expect(contract.status).toBe('active');
    });

    it('should not create contract with duplicate contractNumber', async () => {
      const timestamp = Date.now();
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const contractData = {
        contractNumber: `CNT-DUP-${timestamp}`,
        partner: testPartner._id,
        partnerName: testPartner.name,
        contractDate: new Date(),
        startDate: new Date(),
        endDate: futureDate,
        currency: 'UZS',
        status: 'active',
        isDefault: false,
      };

      await Contract.create(contractData);

      await expect(Contract.create(contractData)).rejects.toThrow();
    });

    it('should find contracts by partner', async () => {
      const timestamp = Date.now();
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      await Contract.create({
        contractNumber: `CNT-FIND-${timestamp}`,
        partner: testPartner._id,
        partnerName: testPartner.name,
        contractDate: new Date(),
        startDate: new Date(),
        endDate: futureDate,
        currency: 'UZS',
        status: 'active',
        isDefault: false,
      });

      const contracts = await Contract.find({ partner: testPartner._id });

      expect(contracts).toHaveLength(1);
      expect(contracts[0].partnerName).toBe('Test Partner');
    });

    it('should update contract status', async () => {
      const timestamp = Date.now();
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const contract = await Contract.create({
        contractNumber: `CNT-UPD-${timestamp}`,
        partner: testPartner._id,
        partnerName: testPartner.name,
        contractDate: new Date(),
        startDate: new Date(),
        endDate: futureDate,
        currency: 'UZS',
        status: 'active',
        isDefault: false,
      });

      contract.status = 'cancelled';
      await contract.save();

      const updated = await Contract.findById(contract._id);
      expect(updated?.status).toBe('cancelled');
    });

    it('should filter active contracts', async () => {
      const timestamp = Date.now();
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const pastDate = new Date();
      pastDate.setFullYear(pastDate.getFullYear() - 1);

      await Contract.create([
        {
          contractNumber: `CNT-ACT-${timestamp}`,
          partner: testPartner._id,
          partnerName: testPartner.name,
          contractDate: new Date(),
          startDate: new Date(),
          endDate: futureDate,
          currency: 'UZS',
          status: 'active',
          isDefault: false,
        },
        {
          contractNumber: `CNT-EXP-${timestamp}`,
          partner: testPartner._id,
          partnerName: testPartner.name,
          contractDate: pastDate,
          startDate: pastDate,
          endDate: pastDate,
          currency: 'UZS',
          status: 'expired',
          isDefault: false,
        },
      ]);

      const activeContracts = await Contract.find({ 
        status: 'active',
        contractNumber: { $regex: `^CNT-ACT-${timestamp}` }
      });

      expect(activeContracts).toHaveLength(1);
    });
  });

  describe('Contract Validation', () => {
    it('should require contractNumber', async () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const contractData = {
        partner: testPartner._id,
        partnerName: testPartner.name,
        contractDate: new Date(),
        startDate: new Date(),
        endDate: futureDate,
        currency: 'UZS',
        status: 'active',
        isDefault: false,
      };

      await expect(Contract.create(contractData)).rejects.toThrow();
    });

    it('should validate currency enum', async () => {
      const timestamp = Date.now();
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const contractData = {
        contractNumber: `CNT-CURR-${timestamp}`,
        partner: testPartner._id,
        partnerName: testPartner.name,
        contractDate: new Date(),
        startDate: new Date(),
        endDate: futureDate,
        currency: 'INVALID',
        status: 'active',
        isDefault: false,
      };

      await expect(Contract.create(contractData)).rejects.toThrow();
    });

    it('should validate status enum', async () => {
      const timestamp = Date.now();
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);

      const contractData = {
        contractNumber: `CNT-STAT-${timestamp}`,
        partner: testPartner._id,
        partnerName: testPartner.name,
        contractDate: new Date(),
        startDate: new Date(),
        endDate: futureDate,
        currency: 'UZS',
        status: 'invalid_status',
        isDefault: false,
      };

      await expect(Contract.create(contractData)).rejects.toThrow();
    });
  });
});
