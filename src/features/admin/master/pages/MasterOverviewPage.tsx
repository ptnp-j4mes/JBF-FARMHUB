'use client';

import {
  Box,
  Typography,
  Paper,
  alpha,
  useTheme,
  Button,
} from '@mui/material';
import { 
  DashboardOutlined, 
  ArrowForward,
  Agriculture,
  Inventory,
  People,
  Category,
  Warehouse,
  FactCheck
} from '@mui/icons-material';
import type { MasterLookups } from '../services/master.api';

interface MasterOverviewPageProps {
  lookups?: MasterLookups;
}

export function MasterOverviewPage({ lookups }: MasterOverviewPageProps) {
  const theme = useTheme();
  
  const stats = [
    { label: 'ฟาร์มทั้งหมด', value: lookups?.farms?.length ?? 0, icon: Agriculture, color: '#10b981' },
    { label: 'โซนเลี้ยง', value: lookups?.zones?.length ?? 0, icon: Category, color: '#3b82f6' },
    { label: 'โรงเรือน', value: lookups?.houses?.length ?? 0, icon: Warehouse, color: '#6366f1' },
    { label: 'จำนวนสินค้า', value: lookups?.items?.length ?? 0, icon: Inventory, color: '#f59e0b' },
    { label: 'คู่ค้าบริษัท', value: lookups?.partners?.length ?? 0, icon: People, color: '#ec4899' },
    { label: 'กฎเกณฑ์แจ้งเตือน', value: lookups?.alertRules?.length ?? 0, icon: FactCheck, color: '#8b5cf6' },
  ];

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto', p: 1 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, color: theme.palette.mode === 'dark' ? '#f8fafc' : '#1e293b', mb: 1 }}>
          ภาพรวมข้อมูลหลัก
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b' }}>
          ยินดีต้อนรับสู่ศูนย์กลางการจัดการข้อมูลพื้นฐานของระบบ JBFarmHUB
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(12, minmax(0, 1fr))' },
          gap: 3,
          mb: 4,
        }}
      >
        {stats.map((stat) => (
          <Box
            key={stat.label}
            sx={{
              gridColumn: { xs: 'span 12', sm: 'span 6', md: 'span 4', lg: 'span 2' },
            }}
          >
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 4,
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? alpha('#94a3b8', 0.1) : '#e2e8f0',
                bgcolor: theme.palette.mode === 'dark' ? alpha('#1e293b', 0.4) : '#ffffff',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 24px -10px rgba(0,0,0,0.1)',
                  borderColor: stat.color,
                },
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(stat.color, 0.1),
                    color: stat.color,
                  }}
                >
                  <stat.icon />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 900, color: theme.palette.mode === 'dark' ? '#f8fafc' : '#1e293b' }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="caption" sx={{ color: theme.palette.mode === 'dark' ? '#94a3b8' : '#64748b', fontWeight: 600 }}>
                    {stat.label}
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        ))}
      </Box>
      
      {/* Visual Placeholder for more complex dashboard elements */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(12, minmax(0, 1fr))' },
          gap: 3,
        }}
      >
        <Box sx={{ gridColumn: { xs: 'span 12', lg: 'span 8' } }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: 320,
              borderRadius: 4,
              border: '1px solid',
              borderColor: '#e2e8f0',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              bgcolor: alpha('#f8fafc', 0.5),
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <DashboardOutlined sx={{ fontSize: 48, mb: 2, color: '#cbd5e1' }} />
            <Typography variant="body1" sx={{ color: '#94a3b8', fontWeight: 600 }}>
              ส่วนแสดงกราฟสถิติและความเคลื่อนไหวของข้อมูล
            </Typography>
            <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
              ข้อมูลจะแสดงผลโดยอัตโนมัติเมื่อมีปริมาณข้อมูลที่เหมาะสม
            </Typography>
          </Paper>
        </Box>
        <Box sx={{ gridColumn: { xs: 'span 12', lg: 'span 4' } }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              height: 320,
              borderRadius: 4,
              border: '1px solid',
              borderColor: '#e2e8f0',
              bgcolor: '#ffffff',
            }}
          >
             <Typography variant="h6" sx={{ fontWeight: 800, mb: 2, fontSize: '1rem' }}>
              อัปเดตล่าสุด
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {[1, 2, 3].map((i) => (
                <Box key={i} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FactCheck sx={{ color: '#94a3b8', fontSize: 20 }} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>แก้ไขข้อมูลสินค้ารายการที่ {i}</Typography>
                    <Typography variant="caption" sx={{ color: '#94a3b8' }}>2 ชั่วโมงที่ผ่านมา โดย Admin</Typography>
                  </Box>
                </Box>
              ))}
            </Box>
            <Button fullWidth sx={{ mt: 3, textTransform: 'none', fontWeight: 700, py: 1 }} endIcon={<ArrowForward />}>
              ดูบันทึกกิจกรรมทั้งหมด
            </Button>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
