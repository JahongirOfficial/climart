import { describe, it, expect } from 'vitest';

// Array helper functions
const unique = <T>(arr: T[]): T[] => {
  return [...new Set(arr)];
};

const groupBy = <T>(arr: T[], key: keyof T): Record<string, T[]> => {
  return arr.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
};

const sortBy = <T>(arr: T[], key: keyof T, order: 'asc' | 'desc' = 'asc'): T[] => {
  return [...arr].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
};

describe('Array Helper Functions', () => {
  describe('unique', () => {
    it('should remove duplicates', () => {
      expect(unique([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(unique(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('should handle empty array', () => {
      expect(unique([])).toEqual([]);
    });

    it('should handle array without duplicates', () => {
      expect(unique([1, 2, 3])).toEqual([1, 2, 3]);
    });
  });

  describe('groupBy', () => {
    it('should group by key', () => {
      const items = [
        { category: 'A', value: 1 },
        { category: 'B', value: 2 },
        { category: 'A', value: 3 },
      ];

      const grouped = groupBy(items, 'category');
      expect(grouped['A']).toHaveLength(2);
      expect(grouped['B']).toHaveLength(1);
    });

    it('should handle empty array', () => {
      expect(groupBy([], 'key' as any)).toEqual({});
    });
  });

  describe('sortBy', () => {
    it('should sort ascending', () => {
      const items = [
        { name: 'C', value: 3 },
        { name: 'A', value: 1 },
        { name: 'B', value: 2 },
      ];

      const sorted = sortBy(items, 'value', 'asc');
      expect(sorted[0].value).toBe(1);
      expect(sorted[2].value).toBe(3);
    });

    it('should sort descending', () => {
      const items = [
        { name: 'C', value: 3 },
        { name: 'A', value: 1 },
        { name: 'B', value: 2 },
      ];

      const sorted = sortBy(items, 'value', 'desc');
      expect(sorted[0].value).toBe(3);
      expect(sorted[2].value).toBe(1);
    });
  });
});
