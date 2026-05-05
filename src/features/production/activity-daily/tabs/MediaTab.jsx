import React from 'react';
import {
  Box,
  Button,
  Card,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  Image as ImageIcon,
  Videocam as VideoIcon,
  PhotoCamera as CameraIcon,
  UploadFile as UploadFileIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { UI, SECTION_CARD_SX, FORM_INPUT_SX, PRIMARY_ACTION_SX, SECONDARY_ACTION_SX } from '../constants';
import LocationChip from '../components/LocationChip';

export default function MediaTab({
  generalRemark,
  setGeneralRemark,
  selectedHouse,
}) {
  return (
    <Stack spacing={2}>
      {/* Upload zone */}
      <Card sx={SECTION_CARD_SX}>
        <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
          <Typography variant="subtitle1" fontWeight={700} color={UI.text}>
            แนบรูปภาพ/วิดีโอ
          </Typography>
          <LocationChip houseCode={selectedHouse} />
        </Stack>

        <Stack spacing={1.5}>
          <Box
            sx={{
              border: `2px dashed ${alpha(UI.accent, 0.2)}`,
              borderRadius: 2.6,
              p: 4,
              textAlign: 'center',
              bgcolor: UI.panelSoft,
            }}
          >
            <UploadFileIcon sx={{ fontSize: 36, color: UI.accent, mb: 1 }} />
            <Typography fontWeight={600}>
              ลากไฟล์มาวาง หรือคลิกเพื่อเลือก
            </Typography>
            <Typography variant="body2" color="text.secondary">
              รองรับ PNG, JPG, MP4, MOV ขนาดไม่เกิน 50MB
            </Typography>
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <Button
              variant="outlined"
              startIcon={<ImageIcon />}
              sx={SECONDARY_ACTION_SX}
            >
              เลือกรูป
            </Button>
            <Button
              variant="outlined"
              startIcon={<VideoIcon />}
              sx={SECONDARY_ACTION_SX}
            >
              เลือกวิดีโอ
            </Button>
            <Button
              variant="contained"
              startIcon={<CameraIcon />}
              sx={PRIMARY_ACTION_SX}
            >
              ถ่ายรูป
            </Button>
          </Stack>
        </Stack>
      </Card>

      {/* Remark */}
      <Card sx={SECTION_CARD_SX}>
        <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
          <Typography variant="subtitle1" fontWeight={700} color={UI.text}>
            หมายเหตุ
          </Typography>
          <LocationChip houseCode={selectedHouse} />
        </Stack>
        <TextField
          size="small"
          fullWidth
          multiline
          minRows={3}
          value={generalRemark}
          onChange={(event) => setGeneralRemark(event.target.value)}
          placeholder="บันทึกหมายเหตุเพิ่มเติม..."
          sx={FORM_INPUT_SX}
        />
      </Card>
    </Stack>
  );
}
