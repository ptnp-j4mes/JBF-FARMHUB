'use client';
import { Box, Paper, Typography, alpha } from '@mui/material';
import { Construction } from '@mui/icons-material';
import MainBreadcrumb from '@/components/layout/MainBreadcrumb';

interface PlaceholderProps {
  title: string;
  subtitle?: string;
}

export default function Placeholder({ title, subtitle }: PlaceholderProps) {
  return (
    <Box sx={{ p: { xs: 1.5, md: 4 } }}>
      <Box sx={{ mb: 4 }}>
        <MainBreadcrumb />
        <Typography
          variant="h4"
          component="h1"
          fontWeight="bold"
          gutterBottom
          color="primary.main" // ใช้ค่าสีหลักของธีม
        >
          {title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {subtitle || 'ระบบกำลังอยู่ระหว่างการพัฒนา...'}
        </Typography>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 4, md: 8 }, // responsive padding
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 10,
          borderStyle: 'dashed',
          // หัวใจสำคัญ: ใช้สีพื้นหลังที่เปลี่ยนตามโหมดอัตโนมัติ
          bgcolor: (theme) =>
            theme.palette.mode === 'light' ? 'grey.50' : 'background.paper',
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            width: 80,
            height: 80,
            // ใช้ฟังก์ชัน alpha เพื่อให้สีพื้นหลังไอคอนนุ่มนวลทั้งสองโหมด
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 3,
          }}
        >
          <Construction sx={{ fontSize: 40, color: 'primary.main' }} />
        </Box>

        <Typography
          variant="h5"
          color="text.primary"
          gutterBottom
          fontWeight="medium"
        >
          Coming Soon!
        </Typography>

        <Typography variant="body2" color="text.secondary" textAlign="center">
          {`หน้า "${title}" กำลังเตรียมความพร้อมสำหรับการใช้งานเร็วๆ นี้`}
        </Typography>
      </Paper>
    </Box>
  );
}
