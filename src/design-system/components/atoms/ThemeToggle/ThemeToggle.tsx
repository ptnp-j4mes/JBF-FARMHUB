'use client';

import { IconButton } from '@mui/material';
import { useColorMode } from '@/contexts/ThemeContext'; // Import Hook ของเรา
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

export default function ThemeToggle() {
  const { mode, toggleColorMode } = useColorMode();

  return (
    <IconButton onClick={toggleColorMode} color="inherit">
      {/* ถ้าเป็น Dark ให้โชว์รูปพระอาทิตย์, ถ้าไม่ใช่ให้โชว์รูปพระจันทร์ */}
      {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
    </IconButton>
  );
}
