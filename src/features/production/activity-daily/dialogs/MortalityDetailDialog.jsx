import React from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { DeleteOutline as DeleteIcon } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { UI, PRIMARY_ACTION_SX, SECONDARY_ACTION_SX } from '../constants';
import { getMortalityImageSrc } from '../utils';

export default function MortalityDetailDialog({
  open,
  onClose,
  record,
  recordIndex,
  onDelete,
}) {
  if (!record) return null;

  const imageSrc = getMortalityImageSrc(record);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 10,
          overflow: 'hidden',
          border: `1px solid ${UI.border}`,
          boxShadow: UI.shadowSoft,
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: UI.panel,
          color: UI.text,
          fontWeight: 700,
          borderBottom: `1px solid ${UI.border}`,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography fontWeight={700}>
            รายละเอียด #{recordIndex + 1}
          </Typography>
          <Chip
            size="small"
            label={record.type}
            sx={{
              bgcolor:
                record.type === 'ตาย' ? '#fee2e2' : '#fef3c7',
              color:
                record.type === 'ตาย' ? '#991b1b' : '#92400e',
              fontWeight: 700,
              height: 22,
            }}
          />
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, bgcolor: UI.panel }} dividers>
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            spacing={3}
            flexWrap="wrap"
            useFlexGap
          >
            <Box>
              <Typography variant="caption" color={UI.muted}>
                สาเหตุ
              </Typography>
              <Typography fontWeight={600}>
                {record.reason || '-'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color={UI.muted}>
                วันที่ตาย
              </Typography>
              <Typography fontWeight={600}>
                {record.deathDay ? `Day ${record.deathDay}` : '-'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color={UI.muted}>
                คอก
              </Typography>
              <Typography fontWeight={600}>
                {record.stall || '-'}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color={UI.muted}>
                จำนวน
              </Typography>
              <Typography fontWeight={600}>
                {record.amount} ตัว
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color={UI.muted}>
                น้ำหนัก
              </Typography>
              <Typography fontWeight={600}>
                {record.weight || '-'} กก.
              </Typography>
            </Box>
          </Stack>

          {imageSrc && (
            <Box>
              <Typography
                variant="caption"
                color={UI.muted}
                display="block"
                mb={0.5}
              >
                รูปหลักฐาน
              </Typography>
              <Box
                component="img"
                src={imageSrc}
                alt={record.imageName || 'mortality-evidence'}
                sx={{
                  width: '100%',
                  maxHeight: 400,
                  objectFit: 'contain',
                  borderRadius: 10,
                  border: `1px solid ${UI.border}`,
                  bgcolor: UI.panelSoft,
                }}
              />
            </Box>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: `1px solid ${UI.border}`, bgcolor: UI.panel }}>
        <Button
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => {
            onDelete?.(record.id);
            onClose();
          }}
          sx={SECONDARY_ACTION_SX}
        >
          ลบรายการ
        </Button>
        <Button onClick={onClose} variant="contained" sx={PRIMARY_ACTION_SX}>
          ปิด
        </Button>
      </DialogActions>
    </Dialog>
  );
}
