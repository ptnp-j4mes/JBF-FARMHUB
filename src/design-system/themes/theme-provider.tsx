'use client';

/**
 * Theme Provider
 * FarmHUB Design System - Theme context with light/dark/auto support
 *
 * Moved from src/contexts/ThemeContext.tsx
 */

import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
} from 'react';
import {
  ThemeProvider,
  PaletteMode,
  useMediaQuery,
  CssBaseline,
} from '@mui/material';
import { createAppTheme } from './create-app-theme';
import type { ThemeMode } from '../types';

interface ColorModeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleColorMode: () => void;
}

const ColorModeContext = createContext<ColorModeContextType>({
  mode: 'auto',
  setMode: () => {},
  toggleColorMode: () => {},
});

export const useColorMode = () => useContext(ColorModeContext);

export default function AppThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setModeState] = useState<ThemeMode>('auto');
  const [mounted, setMounted] = useState(false);

  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  useEffect(() => {
    const savedMode = localStorage.getItem('themeMode') as ThemeMode;
    if (savedMode) {
      setModeState(savedMode);
    }
    setMounted(true);
  }, []);

  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('themeMode', newMode);
    }
  };

  const toggleColorMode = () => {
    const nextMode = mode === 'light' ? 'dark' : 'light';
    setMode(nextMode);
  };

  const activeMode = useMemo((): PaletteMode => {
    if (mode === 'auto') {
      return prefersDarkMode ? 'dark' : 'light';
    }
    return mode as PaletteMode;
  }, [mode, prefersDarkMode]);

  const theme = useMemo(() => createAppTheme(activeMode), [activeMode]);

  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ColorModeContext.Provider value={{ mode, setMode, toggleColorMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}
