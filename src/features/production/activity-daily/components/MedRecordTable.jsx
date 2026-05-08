import React from 'react';
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { DeleteOutline as DeleteIcon } from '@mui/icons-material';
import { UI } from '../constants';
import {
  resolveMedRecordSource,
  resolveWarehouseIssueMeta,
} from '../utils';

export default function MedRecordTable({ records, onDelete }) {
  if (records.length === 0) return null;

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle1" fontWeight={700} color={UI.text}>
        รายการยา/วัคซีน ({records.length} รายการ)
      </Typography>

      {records.map((row, idx) => {
        const sourceMeta = resolveMedRecordSource(row);
        const warehouseIssueMeta = resolveWarehouseIssueMeta(row);
        const rowBatchAllocations = Array.isArray(row.batchAllocations)
          ? row.batchAllocations
          : [];

        return (
        <Card
          key={row.id}
          variant="outlined"
          sx={{
            borderRadius: 10,
            borderColor: UI.border,
            bgcolor: UI.panel,
            boxShadow: UI.shadowSoft,
            transition: 'all 0.15s ease',
            '&:hover': {
              borderColor: UI.borderStrong,
              boxShadow: UI.shadow,
              },
            }}
          >
            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="flex-start"
                spacing={1}
              >
                <Box sx={{ flex: 1 }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    mb={0.5}
                  >
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color={UI.muted}
                    >
                      #{idx + 1}
                    </Typography>
                    <Chip
                      size="small"
                    label={row.medName || '-'}
                    sx={{
                      bgcolor: UI.accentSurface,
                      color: UI.accent,
                      fontWeight: 700,
                        height: 22,
                      }}
                    />
                    <Chip
                      size="small"
                      label={sourceMeta.label}
                      sx={{
                        bgcolor: sourceMeta.bg,
                        color: sourceMeta.color,
                        fontWeight: 700,
                        height: 22,
                      }}
                    />
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={2}
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Typography variant="body2">
                      <strong>วิธีให้:</strong> {row.method || '-'}
                    </Typography>
                    <Typography variant="body2">
                      <strong>จำนวนสุกร:</strong> {row.amount || '-'} ตัว
                    </Typography>
                    <Typography variant="body2">
                      <strong>วัคซีนที่ใช้:</strong> {row.dose || '-'} โดส
                    </Typography>
                    <Typography variant="body2">
                      <strong>โรงเรือน:</strong> {row.house || '-'}
                    </Typography>
                  </Stack>

                  {/* Batch info */}
                  {rowBatchAllocations.length > 0 && (
                    <Stack
                      direction="row"
                      spacing={0.75}
                      useFlexGap
                      flexWrap="wrap"
                      mt={0.5}
                    >
                      <Typography
                        variant="caption"
                        fontWeight={600}
                        color={UI.muted}
                      >
                        Batch:
                      </Typography>
                      {rowBatchAllocations.slice(0, 3).map((allocation) => (
                        <Chip
                          key={`${allocation.pigBatchId}-${allocation.buildingOpeningRequestId}`}
                          size="small"
                          label={`${allocation.batchNo} (${allocation.allocatedHeadcount} ตัว)`}
                        sx={{
                          bgcolor: UI.panelSoft,
                          color: UI.text,
                          fontWeight: 700,
                          height: 20,
                          fontSize: '0.7rem',
                          }}
                        />
                      ))}
                    </Stack>
                  )}

                  {/* Warehouse status */}
                  <Stack direction="row" spacing={1} mt={0.5} alignItems="center">
                    <Chip
                      size="small"
                      label={warehouseIssueMeta.label}
                      sx={{
                        bgcolor: warehouseIssueMeta.bg,
                        color: warehouseIssueMeta.color,
                        fontWeight: 700,
                        height: 20,
                        fontSize: '0.7rem',
                      }}
                    />
                    {row.lotNumber && (
                      <Typography variant="caption" color={UI.muted}>
                        Lot {row.lotNumber}
                      </Typography>
                    )}
                  </Stack>

                  {row.note && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      mt={0.5}
                      display="block"
                    >
                      หมายเหตุ: {row.note}
                    </Typography>
                  )}
                </Box>

                <Button
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={() => onDelete?.(row.id)}
                  sx={{ minWidth: 'auto' }}
                >
                  ลบ
                </Button>
              </Stack>
            </CardContent>
          </Card>
        );
      })}
    </Stack>
  );
}
