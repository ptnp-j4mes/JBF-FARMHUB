import React from 'react';
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from '@mui/material';
import { DeleteOutline as DeleteIcon } from '@mui/icons-material';
import { UI } from '../constants';
import { getMortalityImageSrc } from '../utils';

export default function MortalityRecordTable({
  records,
  onDelete,
  onImageClick,
}) {
  if (records.length === 0) return null;

  return (
    <Stack spacing={1}>
      <Typography variant="subtitle1" fontWeight={700} color={UI.text}>
        รายการตาย/คัดทิ้ง ({records.length} รายการ)
      </Typography>

      {records.map((row, idx) => (
        <Card
          key={row.id}
          variant="outlined"
          sx={{
            borderRadius: 2.6,
            borderColor: UI.border,
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
                  <Chip
                    size="small"
                    label={row.type}
                    sx={{
                      bgcolor: row.type === 'ตาย' ? '#fee2e2' : '#fef3c7',
                      color: row.type === 'ตาย' ? '#991b1b' : '#92400e',
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
                    <strong>สาเหตุ:</strong> {row.reason || '-'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>คอก:</strong> {row.stall || '-'}
                  </Typography>
                  <Typography variant="body2">
                    <strong>วันที่ตาย:</strong>{' '}
                    {row.deathDay ? `Day ${row.deathDay}` : '-'}
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
                    <strong>จำนวน:</strong> {row.amount} ตัว
                  </Typography>
                  <Typography variant="body2">
                    <strong>น้ำหนัก:</strong> {row.weight || '-'} กก.
                  </Typography>
                </Stack>
              </Box>

              <Stack direction="row" spacing={0.75} alignItems="center">
                {row.hasImage && getMortalityImageSrc(row) ? (
                  <Box
                    component="img"
                    src={getMortalityImageSrc(row)}
                    alt={row.imageName || 'mortality-evidence'}
                    onClick={() => onImageClick?.(row)}
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 1.5,
                      objectFit: 'cover',
                      border: `1px solid ${UI.border}`,
                      cursor: 'pointer',
                    }}
                  />
                ) : null}
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
            </Stack>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
