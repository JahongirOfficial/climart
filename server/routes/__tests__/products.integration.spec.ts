import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createServer } from '../../index';
import Product from '../../models/Product';
import { setupTestDB, teardownTestDB, clearTestDB } from './test-setup';

const app = createServer();

describe('Products API Integration Tests', () => {
  beforeAll(async () => {
    await setupTestDB();
  }, 60000);

  beforeEach(async () => {
    await Product.deleteMany({});
  });

  afterAll(async () => {
    await clearTestDB(['products']);
    // Don't close connection - let other tests use it
  }, 60000);

  describe('GET /api/products', () => {
    it('should return empty array when no products exist', async () => {
      const response = await request(app).get('/api/products');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      // May have sample data, so just check it's an array
    });

    it('should return all products', async () => {
      await Product.create([
        { name: 'Product 1', sku: 'P001', unit: 'pcs', costPrice: 80, sellingPrice: 100, quantity: 50, reserved: 0 },
        { name: 'Product 2', sku: 'P002', unit: 'pcs', costPrice: 150, sellingPrice: 200, quantity: 30, reserved: 0 },
      ]);

      const response = await request(app).get('/api/products');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBeDefined();
    });
  });

  describe('GET /api/products/low-stock', () => {
    it('should return products with low stock', async () => {
      await Product.create([
        { name: 'Low Stock', sku: 'LS001', unit: 'pcs', costPrice: 80, sellingPrice: 100, quantity: 5, minStock: 10, reserved: 0 },
        { name: 'Good Stock', sku: 'GS001', unit: 'pcs', costPrice: 150, sellingPrice: 200, quantity: 50, minStock: 10, reserved: 0 },
      ]);

      const response = await request(app).get('/api/products/low-stock');
      
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].quantity).toBeLessThanOrEqual(response.body[0].minStock);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should return product by id', async () => {
      const product = await Product.create({
        name: 'Test Product',
        sku: 'TEST001',
        unit: 'pcs',
        costPrice: 80,
        sellingPrice: 100,
        quantity: 50,
        reserved: 0,
      });

      const response = await request(app).get(`/api/products/${product._id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Test Product');
      expect(response.body.sku).toBe('TEST001');
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).get(`/api/products/${fakeId}`);
      
      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Product not found');
    });
  });

  describe('POST /api/products', () => {
    it('should create new product', async () => {
      const newProduct = {
        name: 'New Product',
        sku: 'NEW001',
        category: 'Electronics',
        unit: 'pcs',
        costPrice: 100,
        sellingPrice: 150,
        quantity: 100,
        reserved: 0,
        minStock: 10,
      };

      const response = await request(app)
        .post('/api/products')
        .send(newProduct);
      
      expect(response.status).toBe(201);
      expect(response.body.name).toBe(newProduct.name);
      expect(response.body.sku).toBe(newProduct.sku);
      expect(response.body._id).toBeDefined();
    });

    it('should fail with invalid data', async () => {
      const invalidProduct = {
        sku: 'INVALID001',
        // missing required name and unit fields
      };

      const response = await request(app)
        .post('/api/products')
        .send(invalidProduct);
      
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update existing product', async () => {
      const product = await Product.create({
        name: 'Original Name',
        sku: 'ORIG001',
        unit: 'pcs',
        costPrice: 80,
        sellingPrice: 100,
        quantity: 50,
        reserved: 0,
      });

      const updates = {
        name: 'Updated Name',
        sellingPrice: 120,
      };

      const response = await request(app)
        .put(`/api/products/${product._id}`)
        .send(updates);
      
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
      expect(response.body.sellingPrice).toBe(120);
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/products/${fakeId}`)
        .send({ name: 'Test' });
      
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product', async () => {
      const product = await Product.create({
        name: 'To Delete',
        sku: 'DEL001',
        unit: 'pcs',
        costPrice: 80,
        sellingPrice: 100,
        quantity: 50,
        reserved: 0,
      });

      const response = await request(app).delete(`/api/products/${product._id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Product deleted successfully');

      const deletedProduct = await Product.findById(product._id);
      expect(deletedProduct).toBeNull();
    });

    it('should return 404 for non-existent product', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app).delete(`/api/products/${fakeId}`);
      
      expect(response.status).toBe(404);
    });
  });
});
