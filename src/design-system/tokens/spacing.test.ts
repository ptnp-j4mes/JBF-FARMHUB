import { describe, it, expect } from 'vitest';
import { spacing, semanticSpacing } from './spacing';

describe('Spacing Tokens', () => {
  describe('spacing scale', () => {
    it('should follow 8px grid base (4px minimum)', () => {
      expect(spacing[1]).toBe('4px');
      expect(spacing[2]).toBe('8px');
      expect(spacing[4]).toBe('16px');
      expect(spacing[8]).toBe('32px');
      expect(spacing[16]).toBe('64px');
    });

    it('should have all common spacing values', () => {
      expect(spacing[0]).toBe('0px');
      expect(spacing[3]).toBe('12px');
      expect(spacing[6]).toBe('24px');
      expect(spacing[10]).toBe('40px');
      expect(spacing[12]).toBe('48px');
    });
  });

  describe('semantic spacing', () => {
    it('default should be 16px', () => {
      expect(semanticSpacing.default).toBe(16);
    });

    it('compact should be 8px', () => {
      expect(semanticSpacing.compact).toBe(8);
    });
  });
});
