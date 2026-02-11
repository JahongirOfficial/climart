import { describe, it, expect } from 'vitest';

// Business logic calculations
const calculateTotal = (items: Array<{ price: number; quantity: number }>): number => {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
};

const calculateProfit = (revenue: number, cost: number): number => {
  return revenue - cost;
};

const calculateProfitMargin = (revenue: number, cost: number): number => {
  if (revenue === 0) return 0;
  return ((revenue - cost) / revenue) * 100;
};

const calculateTax = (amount: number, taxRate: number): number => {
  return amount * (taxRate / 100);
};

describe('Business Calculations', () => {
  describe('Total Calculation', () => {
    it('should calculate order total correctly', () => {
      const items = [
        { price: 100, quantity: 2 },
        { price: 50, quantity: 3 },
      ];
      expect(calculateTotal(items)).toBe(350);
    });

    it('should handle empty items', () => {
      expect(calculateTotal([])).toBe(0);
    });

    it('should handle single item', () => {
      const items = [{ price: 100, quantity: 1 }];
      expect(calculateTotal(items)).toBe(100);
    });
  });

  describe('Profit Calculation', () => {
    it('should calculate profit correctly', () => {
      expect(calculateProfit(1000, 600)).toBe(400);
    });

    it('should handle loss', () => {
      expect(calculateProfit(500, 700)).toBe(-200);
    });

    it('should handle zero cost', () => {
      expect(calculateProfit(1000, 0)).toBe(1000);
    });
  });

  describe('Profit Margin Calculation', () => {
    it('should calculate profit margin correctly', () => {
      expect(calculateProfitMargin(1000, 600)).toBe(40);
    });

    it('should handle zero revenue', () => {
      expect(calculateProfitMargin(0, 100)).toBe(0);
    });

    it('should handle 100% profit margin', () => {
      expect(calculateProfitMargin(1000, 0)).toBe(100);
    });
  });

  describe('Tax Calculation', () => {
    it('should calculate tax correctly', () => {
      expect(calculateTax(1000, 12)).toBe(120);
    });

    it('should handle zero tax rate', () => {
      expect(calculateTax(1000, 0)).toBe(0);
    });

    it('should handle decimal amounts', () => {
      expect(calculateTax(99.99, 12)).toBeCloseTo(11.999, 2);
    });
  });
});
