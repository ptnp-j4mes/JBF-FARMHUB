import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  CheckCircle as CheckIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { UI, SECTION_CARD_SX, FORM_INPUT_SX } from '../constants';
import LocationChip from '../components/LocationChip';

export default function HealthTab({
  healthToggles,
  onToggleChange,
  selectedHouse,
}) {
  const makeToggle = (label, keyName) => (
    <Card
      variant="outlined"
      key={keyName}
      sx={{
        borderRadius: 3,
        borderColor: UI.border,
        bgcolor: UI.panel,
        boxShadow: UI.shadowSoft,
      }}
    >
      <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          gap={1}
        >
          <Typography fontWeight={600}>{label}</Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={healthToggles[keyName]}
            onChange={(_, value) => {
              if (value) onToggleChange(keyName, value);
            }}
            sx={{
              '& .MuiToggleButton-root': {
                px: 1.25,
                py: 0.5,
                borderColor: UI.borderStrong,
                color: '#64748b',
                fontWeight: 700,
                textTransform: 'none',
              },
              '& .MuiToggleButton-root.Mui-selected': {
                borderColor: 'transparent',
              },
              '& .MuiToggleButton-root.Mui-selected:hover': {
                borderColor: 'transparent',
              },
              '& .health-toggle-normal.Mui-selected': {
                bgcolor: alpha(UI.accent, 0.14),
                color: UI.accent,
              },
              '& .health-toggle-abnormal.Mui-selected': {
                bgcolor: '#fde8e8',
                color: '#991b1b',
              },
            }}
          >
            <ToggleButton value="normal" className="health-toggle-normal">
              <CheckIcon sx={{ fontSize: 16, mr: 0.5 }} />
              ปกติ
            </ToggleButton>
            <ToggleButton
              value="abnormal"
              className="health-toggle-abnormal"
            >
              <CancelIcon sx={{ fontSize: 16, mr: 0.5 }} />
              ผิดปกติ
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Stack spacing={2}>
      {/* Health Data */}
      <Card sx={SECTION_CARD_SX}>
        <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
          <Typography variant="subtitle1" fontWeight={700} color={UI.text}>
            ข้อมูลสุขภาพสุกร
          </Typography>
          <LocationChip houseCode={selectedHouse} />
        </Stack>

        <Stack spacing={1.5}>
          <TextField
            size="small"
            label="สุขภาพโดยรวม"
            multiline
            minRows={3}
            placeholder="สังเกตพฤติกรรมสุกร..."
            sx={FORM_INPUT_SX}
          />
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2,1fr)' },
              gap: 1.25,
            }}
          >
            {makeToggle('การกินอาหาร', 'eating')}
            {makeToggle('การเคลื่อนไหว', 'movement')}
            {makeToggle('การหายใจ', 'breathing')}
            {makeToggle('สภาพผิวหนัง', 'skin')}
          </Box>
        </Stack>
      </Card>

      {/* Problems and Solutions */}
      <Card sx={SECTION_CARD_SX}>
        <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
          <Typography variant="subtitle1" fontWeight={700} color={UI.text}>
            ปัญหาและการแก้ไข
          </Typography>
          <LocationChip houseCode={selectedHouse} />
        </Stack>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2,1fr)' },
            gap: 1.25,
          }}
        >
          <TextField
            size="small"
            label="ปัญหาที่พบ"
            multiline
            minRows={3}
            sx={FORM_INPUT_SX}
          />
          <TextField
            size="small"
            label="การแก้ไข/ดำเนินการ"
            multiline
            minRows={3}
            sx={FORM_INPUT_SX}
          />
          <TextField
            size="small"
            label="กิจกรรมเสริม"
            multiline
            minRows={3}
            sx={{ ...FORM_INPUT_SX, gridColumn: { md: '1 / span 2' } }}
          />
        </Box>
      </Card>
    </Stack>
  );
}
