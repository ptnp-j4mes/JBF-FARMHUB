import { describe, it, expect } from 'vitest';
import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  headingStyles,
} from './typography';

describe('Typography Tokens', () => {
  describe('font family', () => {
    it('should include Bai Jamjuree', () => {
      expect(fontFamily.primary).toContain('Bai Jamjuree');
    });

    it('should include fallback fonts', () => {
      expect(fontFamily.primary).toContain('system-ui');
      expect(fontFamily.primary).toContain('sans-serif');
    });

    it('should have monospace stack', () => {
      expect(fontFamily.monospace).toContain('monospace');
    });
  });

  describe('font size scale', () => {
    it('should have all size levels', () => {
      expect(fontSize.xs).toBeDefined();
      expect(fontSize.sm).toBeDefined();
      expect(fontSize.base).toBeDefined();
      expect(fontSize.md).toBeDefined();
      expect(fontSize.lg).toBeDefined();
      expect(fontSize.xl).toBeDefined();
      expect(fontSize['2xl']).toBeDefined();
      expect(fontSize['3xl']).toBeDefined();
      expect(fontSize['4xl']).toBeDefined();
    });

    it('base should be 14px equivalent', () => {
      expect(fontSize.base).toBe('0.875rem');
    });
  });

  describe('font weights', () => {
    it('should have weight scale from 400 to 800', () => {
      expect(fontWeight.regular).toBe(400);
      expect(fontWeight.medium).toBe(500);
      expect(fontWeight.semibold).toBe(600);
      expect(fontWeight.bold).toBe(700);
      expect(fontWeight.extrabold).toBe(800);
    });
  });

  describe('heading styles', () => {
    it('h1 should be largest with extrabold weight', () => {
      expect(headingStyles.h1.fontWeight).toBe(800);
      expect(headingStyles.h1.letterSpacing).toBe('-0.02em');
    });

    it('all headings should have defined lineHeight', () => {
      Object.values(headingStyles).forEach((style) => {
        expect(style.lineHeight).toBeDefined();
        expect(style.lineHeight).toBeGreaterThan(0);
      });
    });
  });
});
