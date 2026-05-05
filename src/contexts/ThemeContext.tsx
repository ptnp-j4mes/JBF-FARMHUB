'use client';

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
import { createAppTheme } from '@/core/theme/create-app-theme';

// กำหนด Type ของโหมดที่เราจะใช้
type ThemeMode = 'light' | 'dark' | 'auto';

interface ColorModeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleColorMode: () => void;
}

const ColorModeContext = createContext<ColorModeContextType>({
  mode: 'auto',
  setMode: () => { },
  toggleColorMode: () => { },
});

export const useColorMode = () => useContext(ColorModeContext);

export default function ThemeContext({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setModeState] = useState<ThemeMode>('auto');
  const [mounted, setMounted] = useState(false);

  // ตรวจสอบ System Preference ของเครื่องผู้ใช้
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  useEffect(() => {
    // โหลดค่าจาก LocalStorage เมื่อเริ่มต้น
    const savedMode = localStorage.getItem('themeMode') as ThemeMode;
    if (savedMode) {
      setModeState(savedMode);
    }
    setMounted(true);
  }, []);

  // ฟังก์ชันนี้รับค่าเป็น String เท่านั้น (ThemeMode)
  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('themeMode', newMode);
    }
  };

  // --- จุดที่แก้ไข ---
  const toggleColorMode = () => {
    // เราใช้ค่า 'mode' ปัจจุบันมาเช็คโดยตรง แทนที่จะส่ง function เข้าไป
    // ถ้าเป็น light ให้เป็น dark, ถ้าเป็นอย่างอื่น (dark หรือ auto) ให้กลับมา light
    const nextMode = mode === 'light' ? 'dark' : 'light';
    setMode(nextMode);
  };
  // ----------------

  // คำนวณโหมดที่จะแสดงผลจริง (Active Mode)
  const activeMode = useMemo((): PaletteMode => {
    if (mode === 'auto') {
      return prefersDarkMode ? 'dark' : 'light';
    }
    return mode as PaletteMode;
  }, [mode, prefersDarkMode]);

  // สร้าง Theme ของ MUI
  const theme = useMemo(() => createAppTheme(activeMode), [activeMode]);

  // ป้องกัน Hydration Mismatch
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
