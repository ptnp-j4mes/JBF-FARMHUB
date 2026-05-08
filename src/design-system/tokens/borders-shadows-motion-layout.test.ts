import { describe, it, expect } from 'vitest';
import { radius, borderWidth, focusRing } from './borders';
import { shadowsLight, shadowsDark } from './shadows';
import { duration, easing, transitions } from './motion';
import { sidebar, header, zIndex, breakpoints } from './layout';

describe('Border Tokens', () => {
  it('should have all radius levels', () => {
    expect(radius.xs).toBe(10);
    expect(radius.sm).toBe(10);
    expect(radius.md).toBe(10);
    expect(radius.lg).toBe(10);
    expect(radius.xl).toBe(10);
    expect(radius.pill).toBe(999);
  });

  it('focus ring should have correct width', () => {
    expect(focusRing.light).toContain('3px');
  });
});

describe('Shadow Tokens', () => {
  it('light mode should have 6 shadow levels', () => {
    expect(shadowsLight.tiny).toBeDefined();
    expect(shadowsLight.soft).toBeDefined();
    expect(shadowsLight.card).toBeDefined();
    expect(shadowsLight.raised).toBeDefined();
    expect(shadowsLight.glass).toBeDefined();
    expect(shadowsLight.accent).toBeDefined();
  });

  it('dark mode shadows should be darker', () => {
    expect(shadowsDark.card).toContain('rgba(0, 0, 0');
  });
});

describe('Motion Tokens', () => {
  it('should have easing curves', () => {
    expect(easing.standard).toContain('cubic-bezier');
  });

  it('should have duration scale', () => {
    expect(duration.fast).toBe(160);
    expect(duration.smooth).toBe(200);
    expect(duration.menu).toBe(400);
  });

  it('transitions should combine duration and easing', () => {
    expect(transitions.sidebarWidth).toContain('cubic-bezier');
    expect(transitions.smooth).toContain('ease');
  });
});

describe('Layout Tokens', () => {
  it('sidebar should be 256px expanded, 80px collapsed', () => {
    expect(sidebar.width).toBe(256);
    expect(sidebar.collapsedWidth).toBe(80);
  });

  it('header should be 80px height', () => {
    expect(header.height).toBe(80);
  });

  it('z-index scale should be ordered correctly', () => {
    expect(zIndex.sidebar).toBeGreaterThan(zIndex.header);
    expect(zIndex.drawer).toBeGreaterThan(zIndex.sidebar);
    expect(zIndex.dialog).toBeGreaterThan(zIndex.drawer);
    expect(zIndex.tooltip).toBeGreaterThan(zIndex.dialog);
  });

  it('mobile breakpoint should be 640px', () => {
    expect(breakpoints.mobile).toBe(640);
  });
});
