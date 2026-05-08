'use client';

import { Alert, Box, Chip, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  PlayArrow as ExecIcon,
} from '@mui/icons-material';
import { UI, panelSx } from '../constants';
import PlanLineCard from '../components/PlanLineCard';
import type { FeedingFiScheduleRowResponse, FeedingPlanLineResponse, FeedingPlanSummaryResponse } from '../types';
import { normalizeFeedCodeForMatch } from '../utils';

type ExecutionTabProps = {
  rows: FeedingPlanLineResponse[];
  roleMode: 'manager' | 'worker';
  summary: FeedingPlanSummaryResponse;
  fiScheduleRows: FeedingFiScheduleRowResponse[];
  onCompleteLine: (line: FeedingPlanLineResponse) => void;
};

function resolveCartDetailForPlanLine(
  line: FeedingPlanLineResponse,
  fiScheduleRows: FeedingFiScheduleRowResponse[],
) {
  const byHouseAndItem = fiScheduleRows.find((scheduleRow) =>
    scheduleRow.houseId === (line.houseId ?? -1) && scheduleRow.feedItemId === line.feedItemId);
  if (byHouseAndItem) return byHouseAndItem;

  const normalizedFeedCode = normalizeFeedCodeForMatch(line.feedItemCode);
  const byHouseAndCode = fiScheduleRows.find((scheduleRow) =>
    scheduleRow.houseId === (line.houseId ?? -1) && scheduleRow.feedCode === normalizedFeedCode);
  if (byHouseAndCode) return byHouseAndCode;

  return null;
}

export default function ExecutionTab({
  rows,
  roleMode,
  summary,
  fiScheduleRows,
  onCompleteLine,
}: ExecutionTabProps) {
  return (
    <Box sx={{ ...panelSx, p: 0, overflow: 'hidden' }}>
      {/* Section header */}
      <Box sx={{ px: { xs: 1.6, md: 2.2 }, py: 1.4, bgcolor: alpha(UI.accentSurface, 0.82), display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${UI.border}`, flexWrap: 'wrap', gap: 1.2 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 36, height: 36, borderRadius: 10, bgcolor: '#fff', color: UI.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: UI.shadowSoft }}>
            <ExecIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: '0.98rem', letterSpacing: '-0.01em' }}>ตารางให้อาหารวันนี้</Typography>
            <Typography variant="caption" sx={{ color: UI.muted, display: 'block', mt: 0.1 }}>FI Std vs Actual</Typography>
          </Box>
        </Stack>
        <Chip
          size="small"
          label={`✅ ${summary.completedCount}/${summary.totalCount} เสร็จสิ้น`}
          sx={{ fontWeight: 800, height: 30, bgcolor: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }}
        />
      </Box>

      {/* Content */}
      <Box sx={{ p: { xs: 1.2, md: 1.6 }, bgcolor: 'rgba(255,255,255,0.7)' }}>
        <Stack spacing={1.3}>
          {rows.length === 0 && (
            <Alert severity="info" sx={{ borderRadius: 10, border: `1px solid ${UI.border}` }}>ยังไม่มีแผนให้อาหารในวันที่เลือก</Alert>
          )}
          {rows.map((row) => {
            const cartDetail = resolveCartDetailForPlanLine(row, fiScheduleRows);
            return (
              <PlanLineCard
                key={row.id}
                row={row}
                cartDetail={cartDetail}
                roleMode={roleMode}
                onComplete={onCompleteLine}
              />
            );
          })}
        </Stack>
      </Box>
    </Box>
  );
}
