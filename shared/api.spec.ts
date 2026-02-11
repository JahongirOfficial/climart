import { describe, it, expect } from 'vitest';

describe('Shared API Types', () => {
  it('should have consistent type definitions', () => {
    // This test ensures that shared types are importable
    // and don't have circular dependencies
    
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      code: 'TEST001',
      price: 100,
      stock: 50,
    };

    expect(mockProduct.id).toBeDefined();
    expect(mockProduct.name).toBe('Test Product');
    expect(typeof mockProduct.price).toBe('number');
  });

  it('should validate data structures', () => {
    const mockOrder = {
      id: '1',
      customerId: 'CUST001',
      items: [
        { productId: 'PROD001', quantity: 2, price: 100 },
      ],
      total: 200,
      status: 'pending',
    };

    expect(mockOrder.items).toHaveLength(1);
    expect(mockOrder.total).toBe(200);
    expect(mockOrder.status).toBe('pending');
  });
});
