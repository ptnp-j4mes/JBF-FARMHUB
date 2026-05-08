import { describe, expect, it } from 'vitest';
import { createAppTheme } from './create-app-theme';
import { createSidemenuTheme, createSidemenuMasterTheme } from './create-sidemenu-theme';
import { createGlassStyle, glassPanelSx } from '../utils/glass';

describe('Radius normalization', () => {
  it('keeps the app theme shape scalar at 1 so sx radius 10 resolves to 10px', () => {
    const theme = createAppTheme('light');

    expect(theme.shape.borderRadius).toBe(1);
    expect(theme.unstable_sx({ borderRadius: 10 })).toEqual({ borderRadius: 10 });
    expect(theme.components?.MuiPaper?.styleOverrides?.root).toMatchObject({ borderRadius: 10 });
    expect(theme.components?.MuiOutlinedInput?.styleOverrides?.root).toMatchObject({ borderRadius: 10 });
  });

  it('keeps the sidemenu theme shape scalar at 1 and uses 10px tokens', () => {
    const theme = createSidemenuTheme('light');
    const master = createSidemenuMasterTheme('light');

    expect(theme.shape.borderRadius).toBe(1);
    expect(theme.components?.MuiPaper?.styleOverrides?.root).toMatchObject({ borderRadius: 10 });
    expect(theme.components?.MuiButton?.styleOverrides?.root).toMatchObject({ borderRadius: 10 });
    expect(master.radius.xs).toBe(10);
    expect(master.radius.md).toBe(10);
    expect(master.radius.pill).toBe(999);
  });

  it('defaults glass helpers to the 10px radius contract', () => {
    expect(createGlassStyle('light')).toMatchObject({ borderRadius: 10 });
    expect(glassPanelSx('light')).toMatchObject({ borderRadius: 10 });
  });
});
