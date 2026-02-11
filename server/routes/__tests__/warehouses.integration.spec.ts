import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import Warehouse from '../../models/Warehouse';
import { setupTestDB, teardownTestDB, clearTestDB } from './test-setup';

describe('Warehouses Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  }, 60000);

  afterAll(async () => {
    await clearTestDB(['warehouses']);
    // Close connection after last test
    await teardownTestDB();
  }, 60000);

  beforeEach(async () => {
    await Warehouse.deleteMany({});
  });

  describe('Warehouse CRUD Operations', () => {
    it('should create a new warehouse', async () => {
      const warehouseData = {
        name: 'Asosiy ombor',
        code: 'WH001',
        address: 'Toshkent, Chilonzor tumani',
        contactPerson: 'Alisher Valiyev',
        phone: '+998901234567',
        capacity: 1000,
        isActive: true,
      };

      const warehouse = await Warehouse.create(warehouseData);

      expect(warehouse).toBeDefined();
      expect(warehouse.name).toBe('Asosiy ombor');
      expect(warehouse.code).toBe('WH001');
      expect(warehouse.capacity).toBe(1000);
    });

    it('should not create warehouse with duplicate name', async () => {
      const warehouseData = {
        name: 'Asosiy ombor',
        code: 'WH001',
        address: 'Toshkent',
        isActive: true,
      };

      await Warehouse.create(warehouseData);

      await expect(
        Warehouse.create({ ...warehouseData, code: 'WH002' })
      ).rejects.toThrow();
    });

    it('should not create warehouse with duplicate code', async () => {
      const warehouseData = {
        name: 'Asosiy ombor',
        code: 'WH001',
        address: 'Toshkent',
        isActive: true,
      };

      await Warehouse.create(warehouseData);

      await expect(
        Warehouse.create({ ...warehouseData, name: 'Ikkinchi ombor' })
      ).rejects.toThrow();
    });

    it('should find warehouse by code', async () => {
      await Warehouse.create({
        name: 'Asosiy ombor',
        code: 'WH001',
        address: 'Toshkent',
        isActive: true,
      });

      const warehouse = await Warehouse.findOne({ code: 'WH001' });

      expect(warehouse).toBeDefined();
      expect(warehouse?.name).toBe('Asosiy ombor');
    });

    it('should update warehouse information', async () => {
      const warehouse = await Warehouse.create({
        name: 'Asosiy ombor',
        code: 'WH001',
        address: 'Toshkent',
        capacity: 500,
        isActive: true,
      });

      warehouse.capacity = 1000;
      warehouse.contactPerson = 'Alisher Valiyev';
      await warehouse.save();

      const updated = await Warehouse.findById(warehouse._id);
      expect(updated?.capacity).toBe(1000);
      expect(updated?.contactPerson).toBe('Alisher Valiyev');
    });

    it('should deactivate warehouse', async () => {
      const warehouse = await Warehouse.create({
        name: 'Asosiy ombor',
        code: 'WH001',
        address: 'Toshkent',
        isActive: true,
      });

      warehouse.isActive = false;
      await warehouse.save();

      const updated = await Warehouse.findById(warehouse._id);
      expect(updated?.isActive).toBe(false);
    });

    it('should filter active warehouses', async () => {
      await Warehouse.create([
        { name: 'Ombor 1', code: 'WH001', address: 'Toshkent', isActive: true },
        { name: 'Ombor 2', code: 'WH002', address: 'Samarqand', isActive: false },
        { name: 'Ombor 3', code: 'WH003', address: 'Buxoro', isActive: true },
      ]);

      const activeWarehouses = await Warehouse.find({ isActive: true });

      expect(activeWarehouses).toHaveLength(2);
    });
  });

  describe('Warehouse Validation', () => {
    it('should require name field', async () => {
      const warehouseData = {
        code: 'WH001',
        address: 'Toshkent',
        isActive: true,
      };

      await expect(Warehouse.create(warehouseData)).rejects.toThrow();
    });

    it('should require code field', async () => {
      const warehouseData = {
        name: 'Asosiy ombor',
        address: 'Toshkent',
        isActive: true,
      };

      await expect(Warehouse.create(warehouseData)).rejects.toThrow();
    });

    it('should require address field', async () => {
      const warehouseData = {
        name: 'Asosiy ombor',
        code: 'WH001',
        isActive: true,
      };

      await expect(Warehouse.create(warehouseData)).rejects.toThrow();
    });

    it('should validate capacity is non-negative', async () => {
      const warehouseData = {
        name: 'Asosiy ombor',
        code: 'WH001',
        address: 'Toshkent',
        capacity: -100,
        isActive: true,
      };

      await expect(Warehouse.create(warehouseData)).rejects.toThrow();
    });
  });

  describe('Warehouse Indexes', () => {
    it('should have unique index on name', async () => {
      const indexes = await Warehouse.collection.getIndexes();
      
      expect(indexes).toHaveProperty('name_1');
    });

    it('should have unique index on code', async () => {
      const indexes = await Warehouse.collection.getIndexes();
      
      expect(indexes).toHaveProperty('code_1');
    });

    it('should have index on isActive', async () => {
      const indexes = await Warehouse.collection.getIndexes();
      
      expect(indexes).toHaveProperty('isActive_1');
    });
  });
});
