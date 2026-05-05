import type { ReactNode } from 'react';
import { Box } from '@mui/material';

// 1. Component สำหรับครอบการ์ดสถิติด้านบน (แยกไว้ให้ปรับ Padding ได้ง่าย)
export const StatsWrapper = ({ children }: { children: ReactNode }) => (
  <Box sx={{ p: { xs: 1.5, md: 2.5 }, pb: { xs: 0, md: 0 } }}>
    {children}
  </Box>
);

// 2. Component สำหรับครอบเนื้อหาหลัก เช่น ปุ่มและตาราง (แยกไว้ให้ปรับ Padding ได้ง่าย)
export const ContentWrapper = ({ children }: { children: ReactNode }) => (
  <Box sx={{ p: { xs: 1.5, md: 2.5 } }}>
    {children}
  </Box>
);

// 3. Component สำหรับเป็นพื้นหลังหรือการ์ดใบใหญ่สุดของหน้า (ครอบทั้งหมด)
export const PageRootWrapper = ({ children }: { children: ReactNode }) => (
  <Box sx={{ p: 0, bgcolor: '#f2f3f2' }}>
    {children}
  </Box>
);
