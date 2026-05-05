import { describe, it, expect } from 'vitest';
import { getThemeTokens } from './create-tokens';

describe('Theme Token Factory', () => {
  describe('light mode', () => {
    const tokens = getThemeTokens('light');

    it('should have correct background colors', () => {
      expect(tokens.background.page).toBe('#FAFAFA');
      expect(tokens.background.surface).toBe('#FFFFFF');
    });

    it('should have correct primary color', () => {
      expect(tokens.primary.main).toBe('#B42318');
      expect(tokens.primary.light).toBe('#D92D20');
      expect(tokens.primary.dark).toBe('#912018');
    });

    it('should have correct text colors', () => {
      expect(tokens.text.primary).toBe('#1A1A1A');
      expect(tokens.text.secondary).toBe('#525252');
    });

    it('should have correct border color', () => {
      expect(tokens.border).toBe('#E5E5E5');
    });

    it('should have shadow tokens', () => {
      expect(tokens.shadow.card).toBeDefined();
      expect(tokens.shadow.raised).toBeDefined();
    });

    it('should have semantic colors', () => {
      expect(tokens.success.main).toBe('#1F8A56');
      expect(tokens.warning.main).toBe('#B98511');
      expect(tokens.danger.main).toBe('#D92D20');
      expect(tokens.info.main).toBe('#2D78C5');
    });

    it('should have sidebar tokens', () => {
      expect(tokens.sidebar.background).toBeDefined();
      expect(tokens.sidebar.accent).toBe('#B42318');
    });
  });

  describe('dark mode', () => {
    const tokens = getThemeTokens('dark');

    it('should have dark background colors', () => {
      expect(tokens.background.page).toBe('#0F0F10');
      expect(tokens.background.surface).toBe('#1A1A1B');
    });

    it('should have bright primary color', () => {
      expect(tokens.primary.main).toBe('#F04438');
    });

    it('should have light text colors', () => {
      expect(tokens.text.primary).toBe('#F2F2F2');
    });

    it('should have semantic colors', () => {
      expect(tokens.success.main).toBe('#4EAF77');
      expect(tokens.info.main).toBe('#72B4FF');
    });
  });
});
