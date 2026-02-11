import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import Partner from '../../models/Partner';
import { setupTestDB, teardownTestDB, clearTestDB } from './test-setup';

describe('Partners Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  }, 60000);

  afterAll(async () => {
    await clearTestDB(['partners']);
    // Don't close connection - let other tests use it
  }, 60000);

  beforeEach(async () => {
    await Partner.deleteMany({});
  });

  describe('Partner CRUD Operations', () => {
    it('should create a new partner', async () => {
      const timestamp = Date.now();
      const partnerData = {
        code: `PART-${timestamp}`,
        name: 'Test Partner',
        type: 'customer',
        status: 'active',
        phone: '+998901234567',
        email: 'test@partner.com',
        isActive: true,
      };

      const partner = await Partner.create(partnerData);

      expect(partner).toBeDefined();
      expect(partner.code).toBe(`PART-${timestamp}`);
      expect(partner.name).toBe('Test Partner');
      expect(partner.type).toBe('customer');
      expect(partner.status).toBe('active');
    });

    it('should not create partner with duplicate code', async () => {
      const timestamp = Date.now();
      const partnerData = {
        code: `PART-DUP-${timestamp}`,
        name: 'Test Partner 1',
        type: 'customer',
        isActive: true,
      };

      await Partner.create(partnerData);

      await expect(
        Partner.create({ ...partnerData, name: 'Test Partner 2' })
      ).rejects.toThrow();
    });

    it('should find partner by code', async () => {
      const timestamp = Date.now();
      const code = `PART-FIND-${timestamp}`;
      
      await Partner.create({
        code,
        name: 'Test Partner',
        type: 'supplier',
        isActive: true,
      });

      const partner = await Partner.findOne({ code });

      expect(partner).toBeDefined();
      expect(partner?.name).toBe('Test Partner');
    });

    it('should update partner information', async () => {
      const timestamp = Date.now();
      const partner = await Partner.create({
        code: `PART-UPD-${timestamp}`,
        name: 'Test Partner',
        type: 'customer',
        status: 'new',
        isActive: true,
      });

      const updatedPartner = await Partner.findByIdAndUpdate(
        partner._id,
        { status: 'vip', phone: '+998901234567' },
        { new: true }
      );

      expect(updatedPartner?.status).toBe('vip');
      expect(updatedPartner?.phone).toBe('+998901234567');
    });

    it('should delete partner', async () => {
      const timestamp = Date.now();
      const partner = await Partner.create({
        code: `PART-DEL-${timestamp}`,
        name: 'Test Partner',
        type: 'customer',
        isActive: true,
      });

      await Partner.findByIdAndDelete(partner._id);

      const deleted = await Partner.findById(partner._id);
      expect(deleted).toBeNull();
    });

    it('should filter partners by type', async () => {
      const timestamp = Date.now();
      await Partner.create([
        { code: `CUST-${timestamp}-1`, name: 'Customer 1', type: 'customer', isActive: true },
        { code: `SUPP-${timestamp}-1`, name: 'Supplier 1', type: 'supplier', isActive: true },
        { code: `BOTH-${timestamp}-1`, name: 'Both 1', type: 'both', isActive: true },
      ]);

      const customers = await Partner.find({ 
        type: 'customer',
        code: { $regex: `^CUST-${timestamp}` }
      });
      const suppliers = await Partner.find({ 
        type: 'supplier',
        code: { $regex: `^SUPP-${timestamp}` }
      });

      expect(customers).toHaveLength(1);
      expect(suppliers).toHaveLength(1);
    });

    it('should filter active partners', async () => {
      const timestamp = Date.now();
      await Partner.create([
        { code: `ACT-${timestamp}-1`, name: 'Active Partner', type: 'customer', isActive: true },
        { code: `INACT-${timestamp}-1`, name: 'Inactive Partner', type: 'customer', isActive: false },
      ]);

      const activePartners = await Partner.find({ 
        isActive: true,
        code: { $regex: `^ACT-${timestamp}` }
      });

      expect(activePartners).toHaveLength(1);
      expect(activePartners[0].name).toBe('Active Partner');
    });
  });

  describe('Partner Validation', () => {
    it('should require code field', async () => {
      const partnerData = {
        name: 'Test Partner',
        type: 'customer',
        isActive: true,
      };

      await expect(Partner.create(partnerData)).rejects.toThrow();
    });

    it('should require name field', async () => {
      const timestamp = Date.now();
      const partnerData = {
        code: `PART-VAL-${timestamp}`,
        type: 'customer',
        isActive: true,
      };

      await expect(Partner.create(partnerData)).rejects.toThrow();
    });

    it('should validate type enum', async () => {
      const timestamp = Date.now();
      const partnerData = {
        code: `PART-ENUM-${timestamp}`,
        name: 'Test Partner',
        type: 'invalid_type',
        isActive: true,
      };

      await expect(Partner.create(partnerData)).rejects.toThrow();
    });

    it('should validate status enum', async () => {
      const timestamp = Date.now();
      const partnerData = {
        code: `PART-STATUS-${timestamp}`,
        name: 'Test Partner',
        type: 'customer',
        status: 'invalid_status',
        isActive: true,
      };

      await expect(Partner.create(partnerData)).rejects.toThrow();
    });
  });

  describe('Partner Indexes', () => {
    it('should have unique index on code', async () => {
      const indexes = await Partner.collection.getIndexes();
      
      expect(indexes).toHaveProperty('code_1');
    });

    it('should have index on type', async () => {
      const indexes = await Partner.collection.getIndexes();
      
      expect(indexes).toHaveProperty('type_1');
    });
  });
});
