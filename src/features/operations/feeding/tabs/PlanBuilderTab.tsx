'use client';

import { Alert, Box, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  Construction as PlanIcon,
} from '@mui/icons-material';
import { UI, panelSx } from '../constants';
import FiScheduleRow from '../components/FiScheduleRow';
import type { FeedingFiScheduleRowResponse, FeedingOptionHouse } from '../types';

type PlanBuilderTabProps = {
  displayedFiScheduleRows: FeedingFiScheduleRowResponse[];
  fiScheduleHouseId: number | '';
  onFiScheduleHouseChange: (houseId: number | '') => void;
  openedFilterFacilityHouses: FeedingOptionHouse[];
};

export default function PlanBuilderTab({
  displayedFiScheduleRows,
  fiScheduleHouseId,
  onFiScheduleHouseChange,
  openedFilterFacilityHouses,
}: PlanBuilderTabProps) {
  return (
    <Box sx={{ ...panelSx, p: 0, overflow: 'hidden' }}>
      {/* Section header */}
      <Box sx={{ px: { xs: 1.6, md: 2.2 }, py: 1.4, bgcolor: alpha(UI.accentSurface, 0.82), display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${UI.border}`, flexWrap: 'wrap', gap: 1.25 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Box sx={{ width: 36, height: 36, borderRadius: 10, bgcolor: '#fff', color: UI.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: UI.shadowSoft }}>
            <PlanIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 900, fontSize: '0.98rem', letterSpacing: '-0.01em' }}>ตารางวางแผนให้อาหารตาม FI/รถเข็น</Typography>
            <Typography variant="caption" sx={{ color: UI.muted, display: 'block', mt: 0.1 }}>
              คำนวณจากจำนวนตัว × FI และแบ่งรอบตามน้ำหนักรถเข็น
            </Typography>
          </Box>
        </Stack>
        <FormControl size="small" sx={{ minWidth: 210 }}>
          <InputLabel>โรงเรือน</InputLabel>
          <Select
            label="โรงเรือน"
            value={fiScheduleHouseId}
            onChange={(event) => {
              const selectedHouse = String(event.target.value);
              onFiScheduleHouseChange(selectedHouse === '' ? '' : Number(selectedHouse));
            }}
          >
            <MenuItem value="">ทุกโรงเรือน</MenuItem>
            {openedFilterFacilityHouses.map((house) => (
              <MenuItem key={house.id} value={house.id}>{house.houseCode} {house.houseName}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Content */}
      <Box sx={{ p: { xs: 1.2, md: 1.6 }, bgcolor: 'rgba(255,255,255,0.7)' }}>
        <Stack spacing={1.3}>
          {displayedFiScheduleRows.length === 0 && (
            <Alert severity="info" sx={{ borderRadius: 10, border: `1px solid ${UI.border}` }}>
              ยังไม่พบโรงเรือนที่เปิดอยู่หรือข้อมูล FI สำหรับวันที่เลือก
            </Alert>
          )}
          {displayedFiScheduleRows.map((row) => (
            <FiScheduleRow
              key={`${row.houseId}-${row.feedItemId ?? 'na'}-${row.targetDay ?? 'na'}`}
              row={row}
            />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
