import React from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import {
  PhotoCamera as CameraIcon,
  UploadFile as UploadFileIcon,
  CheckCircle as CheckIcon,
} from '@mui/icons-material';
import { alpha } from '@mui/material/styles';
import { UI, PRIMARY_ACTION_SX, SECONDARY_ACTION_SX } from '../constants';

export default function MortalityAttachDialog({
  open,
  onClose,
  onFileUpload,
  onCameraCapture,
  currentImageName,
  currentImageUrl,
  cameraInputRef,
  uploadInputRef,
}) {
  const hasImage = Boolean(currentImageName && currentImageUrl);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          borderRadius: 3.5,
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
        แนบรูปหลักฐานตาย/คัดทิ้ง
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, bgcolor: UI.panel }} dividers>
        <Stack spacing={2}>
          {/* Drop zone */}
          <Box
            onClick={() => uploadInputRef?.current?.click()}
            sx={{
              border: `2px dashed ${alpha(UI.accent, 0.3)}`,
              borderRadius: 3,
              p: 3,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: UI.panelSoft,
              transition: 'all 0.15s ease',
              '&:hover': {
                borderColor: UI.accent,
                bgcolor: alpha(UI.accent, 0.04),
              },
            }}
          >
            <CameraIcon sx={{ fontSize: 36, color: UI.accent, mb: 1 }} />
            <Typography fontWeight={600} color={UI.text}>
              ลากรูปมาวาง หรือคลิกเพื่อเลือก
            </Typography>
            <Typography variant="body2" color={UI.muted}>
              PNG, JPG ขนาดไม่เกิน 10MB
            </Typography>
          </Box>

          {/* Preview */}
          {hasImage && (
              <Box
                sx={{
                  borderRadius: 2.5,
                  border: `1px solid ${UI.border}`,
                  p: 1.5,
                  bgcolor: UI.panelSoft,
                }}
              >
              <Stack direction="row" spacing={1.5} alignItems="center">
                {currentImageUrl && (
                  <Box
                    component="img"
                    src={currentImageUrl}
                    alt={currentImageName}
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: 1.5,
                      objectFit: 'cover',
                      border: `1px solid ${UI.border}`,
                    }}
                  />
                )}
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <CheckIcon sx={{ fontSize: 18, color: '#1e9c68' }} />
                    <Typography variant="body2" fontWeight={600} color="#912018">
                      แนบรูปแล้ว
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color={UI.muted}>
                    {currentImageName}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}

          {/* Divider */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Divider sx={{ flex: 1 }} />
            <Typography variant="caption" color={UI.muted}>
              หรือ
            </Typography>
            <Divider sx={{ flex: 1 }} />
          </Box>

          {/* Action buttons */}
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<UploadFileIcon />}
              onClick={() => {
                onClose();
                uploadInputRef?.current?.click();
              }}
              sx={SECONDARY_ACTION_SX}
            >
              เลือกไฟล์
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<CameraIcon />}
              onClick={() => {
                onClose();
                cameraInputRef?.current?.click();
              }}
              sx={SECONDARY_ACTION_SX}
            >
              ถ่ายรูป
            </Button>
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 2.5, py: 1.5, borderTop: `1px solid ${UI.border}`, bgcolor: UI.panel }}>
        <Button onClick={onClose} sx={SECONDARY_ACTION_SX}>
          ยกเลิก
        </Button>
        {hasImage && (
          <Button
            variant="contained"
            startIcon={<CheckIcon />}
            onClick={onClose}
            sx={PRIMARY_ACTION_SX}
          >
            ยืนยันแนบรูป
          </Button>
        )}
      </DialogActions>

      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={onCameraCapture}
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onFileUpload}
      />
    </Dialog>
  );
}
