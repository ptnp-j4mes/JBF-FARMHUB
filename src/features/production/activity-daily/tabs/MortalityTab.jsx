import React from 'react';
import {
  Box,
  Button,
  Card,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  PhotoCamera as CameraIcon,
  CheckCircle as CheckIcon,
  DeleteOutline as DeleteIcon,
} from '@mui/icons-material';
import { UI, SECTION_CARD_SX, FORM_INPUT_SX, PRIMARY_ACTION_SX, SECONDARY_ACTION_SX } from '../constants';
import { INITIAL_MORTALITY_FORM } from '../constants';
import LocationChip from '../components/LocationChip';
import MortalityRecordTable from '../components/MortalityRecordTable';

export default function MortalityTab({
  mortalityForm,
  setMortalityForm,
  mortalityRecords,
  setMortalityRecords,
  autoDeathDay,
  selectedHouse,
  onOpenAttachDialog,
  onClearImage,
  onDeleteRecord,
  onImageClick,
  nextRowId,
}) {
  const canAdd =
    mortalityForm.reason && mortalityForm.deathDay && mortalityForm.hasImage;

  const handleAdd = () => {
    if (!canAdd) return;
    setMortalityRecords((prev) => [
      ...prev,
      { ...mortalityForm, id: nextRowId() },
    ]);
    setMortalityForm({
      ...INITIAL_MORTALITY_FORM,
      deathDay: autoDeathDay,
    });
  };

  return (
    <Stack spacing={2}>
      {/* Form */}
      <Card sx={SECTION_CARD_SX}>
        <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
          <Typography variant="subtitle1" fontWeight={700} color={UI.text}>
            เพิ่มรายการตาย/คัดทิ้ง
          </Typography>
          <LocationChip houseCode={selectedHouse} />
        </Stack>

        <Stack spacing={1.5}>
          <Typography variant="body2" color={UI.muted}>
            กรุณาแนบรูปถ่ายสุกรที่ตาย/คัดทิ้งทุกตัว (1 ตัว = 1 รูป)
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              gap: 1.25,
            }}
          >
            <FormControl size="small">
              <InputLabel>ประเภท</InputLabel>
              <Select
                value={mortalityForm.type}
                label="ประเภท"
                sx={FORM_INPUT_SX}
                onChange={(e) =>
                  setMortalityForm((prev) => ({
                    ...prev,
                    type: e.target.value,
                  }))
                }
              >
                <MenuItem value="ตาย">ตาย</MenuItem>
                <MenuItem value="คัดทิ้ง">คัดทิ้ง</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>สาเหตุ</InputLabel>
              <Select
                value={mortalityForm.reason}
                label="สาเหตุ"
                sx={FORM_INPUT_SX}
                onChange={(e) =>
                  setMortalityForm((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
              >
                <MenuItem value="">เลือกสาเหตุ</MenuItem>
                <MenuItem value="ป่วย">ป่วย</MenuItem>
                <MenuItem value="ขาเจ็บ">ขาเจ็บ</MenuItem>
                <MenuItem value="ท้องร่วง">ท้องร่วง</MenuItem>
                <MenuItem value="อื่นๆ">อื่นๆ</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="คอก"
              value={mortalityForm.stall}
              onChange={(e) =>
                setMortalityForm((prev) => ({
                  ...prev,
                  stall: e.target.value,
                }))
              }
              placeholder="กรอกคอก"
              sx={FORM_INPUT_SX}
            />

            <TextField
              size="small"
              label="จำนวน"
              value={mortalityForm.amount}
              onChange={(e) =>
                setMortalityForm((prev) => ({
                  ...prev,
                  amount: Number(e.target.value) || 1,
                }))
              }
              inputProps={{ inputMode: 'numeric' }}
              sx={FORM_INPUT_SX}
            />

            <TextField
              size="small"
              label="น้ำหนัก (กก.)"
              value={mortalityForm.weight}
              onChange={(e) =>
                setMortalityForm((prev) => ({
                  ...prev,
                  weight: e.target.value,
                }))
              }
              inputProps={{ inputMode: 'decimal' }}
              sx={FORM_INPUT_SX}
            />

            <TextField
              size="small"
              label="วันที่ตาย (Day - Auto)"
              value={mortalityForm.deathDay}
              InputProps={{ readOnly: true }}
              helperText="ระบบคำนวณอัตโนมัติจากวันรับเลี้ยง"
              sx={FORM_INPUT_SX}
            />
          </Box>

          {/* Image buttons */}
          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant={mortalityForm.hasImage ? 'contained' : 'outlined'}
              color={mortalityForm.hasImage ? 'success' : 'primary'}
              startIcon={
                mortalityForm.hasImage ? <CheckIcon /> : <CameraIcon />
              }
              onClick={onOpenAttachDialog}
              sx={
                mortalityForm.hasImage
                  ? PRIMARY_ACTION_SX
                  : SECONDARY_ACTION_SX
              }
            >
              {mortalityForm.hasImage
                ? 'แนบรูปแล้ว (เปลี่ยนรูป)'
                : 'แนบรูปหลักฐาน'}
            </Button>
            {mortalityForm.hasImage && (
              <Button
                variant="outlined"
                color="error"
                onClick={onClearImage}
                sx={SECONDARY_ACTION_SX}
              >
                ลบรูป
              </Button>
            )}
          </Stack>

          {mortalityForm.imageName && (
            <Typography variant="caption" color="text.secondary">
              ไฟล์แนบ: {mortalityForm.imageName}
            </Typography>
          )}

          <Stack direction="row" justifyContent="flex-end">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              disabled={!canAdd}
              onClick={handleAdd}
              sx={PRIMARY_ACTION_SX}
            >
              เพิ่มเข้าตาราง
            </Button>
          </Stack>
        </Stack>
      </Card>

      {/* Record cards */}
      <MortalityRecordTable
        records={mortalityRecords}
        onDelete={onDeleteRecord}
        onImageClick={onImageClick}
      />

      {/* Hidden gallery for Viewer */}
      <Box
        sx={{
          position: 'fixed',
          width: 1,
          height: 1,
          overflow: 'hidden',
          opacity: 0,
          pointerEvents: 'none',
          left: -99999,
          top: -99999,
        }}
      />
    </Stack>
  );
}
