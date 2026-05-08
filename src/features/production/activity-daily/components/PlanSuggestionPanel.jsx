import React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import {
  resolvePlanStatusLabel,
  resolveWarehouseSummaryMeta,
} from '../utils';
import { UI } from '../constants';

export default function PlanSuggestionPanel({
  planSuggestions,
  otherHousePlanSuggestions,
  planLoading,
  onAppendPlan,
  onSwitchHouse,
}) {
  return (
    <Box
      sx={{
        border: `1px solid ${UI.border}`,
        borderRadius: 10,
        p: 1.5,
        bgcolor: UI.panelSoft,
      }}
    >
      <Stack spacing={1}>
        <Typography sx={{ fontWeight: 700, color: UI.text }}>
          แผนวัคซีนของวันที่เลือก
        </Typography>

        {planLoading && (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              กำลังโหลดแผนวัคซีน...
            </Typography>
          </Stack>
        )}

        {!planLoading && planSuggestions.length === 0 && (
          <Stack spacing={1}>
            <Typography variant="body2" color="text.secondary">
              ไม่พบแผนวัคซีนของโรงเรือนนี้ในวันที่เลือก
            </Typography>
            {otherHousePlanSuggestions.length > 0 && (
              <Alert severity="info" sx={{ borderRadius: 10, border: `1px solid ${UI.border}` }}>
                <Stack spacing={0.75}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    แต่ยังมีแผนวัคซีนในโรงเรือนอื่นของฟาร์มนี้
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={0.75}
                    useFlexGap
                    flexWrap="wrap"
                  >
                    {otherHousePlanSuggestions.map((task) => (
                      <Button
                        key={`switch-plan-${task.id}`}
                        size="small"
                        variant="outlined"
                        onClick={() => onSwitchHouse?.(task)}
                        sx={{ textTransform: 'none' }}
                      >
                        ไปที่ {task.houseCode}
                      </Button>
                    ))}
                  </Stack>
                </Stack>
              </Alert>
            )}
          </Stack>
        )}

        {!planLoading &&
          planSuggestions.map((task) => {
            const taskWarehouseMeta = resolveWarehouseSummaryMeta(
              task.warehouseSummary,
            );
            return (
              <Stack
                key={`plan-${task.id}`}
                direction={{ xs: 'column', md: 'row' }}
                alignItems={{ xs: 'flex-start', md: 'center' }}
                justifyContent="space-between"
                sx={{
                  border: `1px solid ${UI.border}`,
                  borderRadius: 10,
                  px: 1.5,
                  py: 1,
                  bgcolor: UI.panel,
                }}
                spacing={1}
              >
                <Box>
                  <Typography sx={{ fontWeight: 700, color: UI.text }}>
                    {task.vaccineName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    จำนวนหมู {task.headcount} ตัว &middot; แผนใช้{' '}
                    {task.dosesRequired} โดส
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={0.75}
                    useFlexGap
                    flexWrap="wrap"
                    sx={{ mt: 0.5 }}
                  >
                    {task.documentCode && (
                      <Chip
                        size="small"
                        label={`แผน ${task.documentCode}`}
                        sx={{
                          bgcolor: UI.accentSurface,
                          color: UI.accent,
                          fontWeight: 700,
                        }}
                      />
                    )}
                    <Chip
                      size="small"
                      label={resolvePlanStatusLabel(task.status)}
                      sx={{
                        bgcolor: '#f3f4f6',
                        color: UI.text,
                        fontWeight: 700,
                      }}
                    />
                    <Chip
                      size="small"
                      label={taskWarehouseMeta.label}
                      sx={{
                        bgcolor: taskWarehouseMeta.bg,
                        color: taskWarehouseMeta.color,
                        fontWeight: 700,
                      }}
                    />
                  </Stack>
                </Box>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => onAppendPlan?.(task)}
                >
                  ดึงเข้าตาราง
                </Button>
              </Stack>
            );
          })}
      </Stack>
    </Box>
  );
}
