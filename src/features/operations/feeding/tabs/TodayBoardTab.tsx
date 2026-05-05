'use client';

import { Alert, Box, Chip, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Dashboard as BoardIcon,
} from '@mui/icons-material';
import { UI, panelSx } from '../constants';
import HouseTaskCard, { type HouseTodayBoardItem } from '../components/HouseTaskCard';

type TodayBoardTabProps = {
  houseTodayBoard: HouseTodayBoardItem[];
  cartRoundsTotal: number;
  cartRoundsRemaining: number;
  onViewExecution: () => void;
};

export default function TodayBoardTab({
  houseTodayBoard,
  cartRoundsTotal,
  cartRoundsRemaining,
  onViewExecution,
}: TodayBoardTabProps) {
  return (
    <Box sx={{ ...panelSx, mb: 2, p: 0, overflow: 'hidden' }}>
      {/* Section header */}
      <Box sx={{ px: { xs: 1.6, md: 2.2 }, py: 1.4, bgcolor: alpha(UI.accentSurface, 0.82), display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${UI.border}`, flexWrap: 'wrap', gap: 1.2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#fff', color: UI.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: UI.shadowSoft }}>
            <BoardIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: '0.98rem', letterSpacing: '-0.01em' }}>Today Board</Typography>
            <Typography variant="caption" sx={{ color: UI.muted, display: 'block', mt: 0.1 }}>
              แสดงงานให้อาหารที่ต้องทำวันนี้
            </Typography>
          </Box>
        </Stack>
        <Chip
          size="small"
          color="primary"
          label={`คันคงเหลือ ${cartRoundsRemaining}/${cartRoundsTotal}`}
          sx={{ fontWeight: 800, height: 30, bgcolor: '#fff', border: `1px solid ${UI.border}`, color: UI.accent }}
        />
      </Box>

      {/* Content */}
      <Box sx={{ p: { xs: 1.2, md: 1.6 }, bgcolor: 'rgba(255,255,255,0.7)' }}>
        <Stack spacing={1.3}>
          {houseTodayBoard.length === 0 && (
            <Alert severity="info" sx={{ borderRadius: 2.2, border: `1px solid ${UI.border}` }}>
              ยังไม่มีโรงเรือนที่เปิดอยู่สำหรับแผนให้อาหารวันนี้
            </Alert>
          )}
          {houseTodayBoard.map((house) => (
            <HouseTaskCard
              key={house.houseId}
              house={house}
              onViewExecution={onViewExecution}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
