import React from 'react';
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { DeleteOutline as DeleteIcon } from '@mui/icons-material';
import { UI } from '../constants';

export default function FeedRecordTable({ records, onDelete }) {
  if (records.length === 0) return null;

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle1" fontWeight={700} color={UI.text}>
        รายการอาหาร ({records.length} รายการ)
      </Typography>

      {records.map((row, idx) => (
        <Card
          key={row.id}
          variant="outlined"
          sx={{
            borderRadius: 3,
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
                <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color={UI.muted}
                  >
                    #{idx + 1}
                  </Typography>
                  {row.feedNo && (
                    <Chip
                      size="small"
                    label={row.feedNo}
                    sx={{
                      bgcolor: UI.accentSurface,
                      color: UI.accent,
                      fontWeight: 700,
                        height: 22,
                      }}
                    />
                  )}
                </Stack>

                <Stack
                  direction="row"
                  spacing={2}
                  flexWrap="wrap"
                  useFlexGap
                >
                  <Typography variant="body2">
                    <strong>อาหาร:</strong>{' '}
                    {row.feedItemName || row.feedNo || '-'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>ปริมาณ:</strong> {row.amount || '-'} กก.
                  </Typography>
                  <Typography variant="body2">
                    <strong>โรงเรือน:</strong> {row.house || '-'}
                  </Typography>
                </Stack>

                <Stack
                  direction="row"
                  spacing={2}
                  flexWrap="wrap"
                  useFlexGap
                  mt={0.25}
                >
                  <Typography variant="body2">
                    <strong>คลัง:</strong>{' '}
                    {row.warehouseName || `คลัง ${row.warehouseId || '-'}`}
                    {row.lotNumber ? ` (Lot ${row.lotNumber})` : ''}
                  </Typography>
                  {row.note && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>หมายเหตุ:</strong> {row.note}
                    </Typography>
                  )}
                </Stack>
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
      ))}
    </Stack>
  );
}
