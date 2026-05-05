import { describe, it, expect } from 'vitest';
import {
  red,
  primaryLight,
  primaryDark,
  surfaceLight,
  surfaceDark,
  foregroundLight,
  foregroundDark,
  borderLight,
  borderDark,
  semanticLight,
  semanticDark,
  sidebarLight,
  sidebarDark,
} from './colors';

describe('Color Tokens', () => {
  describe('red scale', () => {
    it('should have all 10 shades (50-900)', () => {
      expect(red[50]).toBe('#FEF3F2');
      expect(red[100]).toBe('#FEE4E2');
      expect(red[200]).toBe('#FECDCA');
      expect(red[300]).toBe('#FDA29B');
      expect(red[400]).toBe('#F97066');
      expect(red[500]).toBe('#F04438');
      expect(red[600]).toBe('#D92D20');
      expect(red[700]).toBe('#B42318'); // ANCHOR
      expect(red[800]).toBe('#912018');
      expect(red[900]).toBe('#7A271A');
    });
  });

  describe('primary tokens', () => {
    it('light mode primary should have correct anchor color', () => {
      expect(primaryLight.main).toBe('#B42318');
    });

    it('dark mode primary should have correct anchor color', () => {
      expect(primaryDark.main).toBe('#F04438');
    });

    it('should have alpha variants', () => {
      expect(primaryLight.alpha04).toContain('rgba');
      expect(primaryLight.alpha12).toContain('rgba');
      expect(primaryDark.alpha12).toContain('rgba');
    });
  });

  describe('surface colors', () => {
    it('light mode should have near-white page background', () => {
      expect(surfaceLight.page).toBe('#FAFAFA');
      expect(surfaceLight.surface).toBe('#FFFFFF');
    });

    it('dark mode should have dark page background', () => {
      expect(surfaceDark.page).toBe('#0F0F10');
      expect(surfaceDark.surface).toBe('#1A1A1B');
    });
  });

  describe('semantic colors', () => {
    it('light mode should have correct semantic colors', () => {
      expect(semanticLight.success.main).toBe('#1F8A56');
      expect(semanticLight.warning.main).toBe('#B98511');
      expect(semanticLight.danger.main).toBe('#D92D20');
      expect(semanticLight.info.main).toBe('#2D78C5');
    });

    it('dark mode should have correct semantic colors', () => {
      expect(semanticDark.success.main).toBe('#4EAF77');
      expect(semanticDark.warning.main).toBe('#E3C15A');
      expect(semanticDark.danger.main).toBe('#F97066');
      expect(semanticDark.info.main).toBe('#72B4FF');
    });

    it('each semantic color should have soft and border variants', () => {
      expect(semanticLight.success.soft).toContain('rgba');
      expect(semanticLight.success.border).toContain('rgba');
      expect(semanticDark.success.soft).toContain('rgba');
    });
  });

  describe('sidebar colors', () => {
    it('light sidebar should have proper panel color', () => {
      expect(sidebarLight.panel).toBe('#FFFFFF');
      expect(sidebarLight.hover).toBe('#FEF3F2');
    });

    it('dark sidebar should have proper hover state', () => {
      expect(sidebarDark.hover).toContain('rgba');
    });
  });
});
