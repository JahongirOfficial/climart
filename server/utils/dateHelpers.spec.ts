import { describe, it, expect } from 'vitest';

// Date helper functions
const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
  return date >= start && date <= end;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

describe('Date Helper Functions', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00');
      expect(formatDate(date)).toBe('2024-01-15');
    });

    it('should handle different dates', () => {
      const date = new Date('2023-12-31T23:59:59');
      expect(formatDate(date)).toBe('2023-12-31');
    });
  });

  describe('isDateInRange', () => {
    it('should return true for date in range', () => {
      const date = new Date('2024-01-15');
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      
      expect(isDateInRange(date, start, end)).toBe(true);
    });

    it('should return false for date out of range', () => {
      const date = new Date('2024-02-15');
      const start = new Date('2024-01-01');
      const end = new Date('2024-01-31');
      
      expect(isDateInRange(date, start, end)).toBe(false);
    });
  });

  describe('addDays', () => {
    it('should add days correctly', () => {
      const date = new Date('2024-01-15');
      const result = addDays(date, 5);
      
      expect(result.getDate()).toBe(20);
    });

    it('should handle month overflow', () => {
      const date = new Date('2024-01-30');
      const result = addDays(date, 5);
      
      expect(result.getMonth()).toBe(1); // February
      expect(result.getDate()).toBe(4);
    });
  });
});
