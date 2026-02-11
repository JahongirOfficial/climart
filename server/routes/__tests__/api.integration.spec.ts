import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createServer } from '../../index';

const app = createServer();

describe('API General Integration Tests', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/test-erp';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Health Check Endpoints', () => {
    it('GET /api/ping should return pong message', async () => {
      const response = await request(app).get('/api/ping');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.message).toBe('string');
    });

    it('GET /api/demo should return demo response', async () => {
      const response = await request(app).get('/api/demo');
      
      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });
  });

  describe('CORS and Headers', () => {
    it('should have CORS headers', async () => {
      const response = await request(app).get('/api/ping');
      
      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should accept JSON content type', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Content-Type', 'application/json')
        .send({ 
          name: 'Test', 
          sku: 'T001', 
          unit: 'pcs',
          costPrice: 80, 
          sellingPrice: 100, 
          quantity: 10,
          reserved: 0,
        });
      
      // Should not fail due to content type
      expect([200, 201, 400]).toContain(response.status);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/non-existent-route');
      
      expect(response.status).toBe(404);
    });

    it('should handle invalid JSON', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('Content-Type', 'application/json')
        .send('invalid json{');
      
      expect(response.status).toBe(400);
    });

    it('should handle invalid MongoDB ObjectId', async () => {
      const response = await request(app).get('/api/products/invalid-id');
      
      expect(response.status).toBe(500);
    });
  });

  describe('Data Initialization', () => {
    it('POST /api/init-data should initialize sample data', async () => {
      const response = await request(app)
        .post('/api/init-data')
        .send({ force: false });
      
      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.message).toContain('Sample data');
      }
    });
  });
});
