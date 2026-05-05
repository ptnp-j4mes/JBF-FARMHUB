'use client';

import { Chip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  CheckCircleOutline,
  PlayArrowOutlined,
  Schedule,
} from '@mui/icons-material';
import type { FeedingPlanLineResponse } from '../types';

type StatusChipProps = {
  status: FeedingPlanLineResponse['status'];
};

export default function StatusChip({ status }: StatusChipProps) {
  if (status === 'COMPLETED') {
    return <Chip size="small" label="เสร็จสิ้น" icon={<CheckCircleOutline />} sx={{ bgcolor: '#FEF3F2', color: '#912018', fontWeight: 800, border: `1px solid ${alpha('#B42318', 0.24)}` }} />;
  }
  if (status === 'IN_PROGRESS') {
    return <Chip size="small" label="กำลังดำเนินการ" icon={<PlayArrowOutlined />} sx={{ bgcolor: '#fff7ed', color: '#b45309', fontWeight: 800, border: `1px solid ${alpha('#f59e0b', 0.24)}` }} />;
  }
  if (status === 'CANCELLED') {
    return <Chip size="small" label="ยกเลิก" sx={{ bgcolor: '#f3f4f6', color: '#4b5563', fontWeight: 800, border: '1px solid #e5e7eb' }} />;
  }
  return <Chip size="small" label="รอดำเนินการ" icon={<Schedule />} sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 800, border: `1px solid ${alpha('#3b82f6', 0.24)}` }} />;
}
