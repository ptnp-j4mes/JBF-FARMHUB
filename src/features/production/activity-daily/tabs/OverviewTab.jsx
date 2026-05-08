import React from 'react';
import {
  Alert,
  Box,
  Card,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { UI, SECTION_CARD_SX } from '../constants';
import HouseSelector from '../components/HouseSelector';
import LocationChip from '../components/LocationChip';

export default function OverviewTab({
  houseGroups,
  selectedGroup,
  selectedHouse,
  currentGroupHouses,
  hasOpenedHouses,
  isLoading,
  onSelectGroup,
  onSelectHouse,
}) {
  return (
    <Stack spacing={2}>
      <Alert
        icon={<InfoIcon fontSize="inherit" />}
        severity="info"
        sx={{
          borderRadius: 10,
          border: `1px solid ${UI.border}`,
          bgcolor: UI.accentSurface,
          color: UI.text,
          '& .MuiAlert-icon': { color: UI.accent },
        }}
      >
        ระบบตั้งค่า FI STD อัตโนมัติ: ดึงค่ามาตรฐานจาก Master Data เมื่อกรอกอายุเลี้ยง
      </Alert>

      {/* House Selector */}
      <Card sx={SECTION_CARD_SX}>
        <Typography variant="subtitle1" fontWeight={700} color={UI.text} mb={1.5}>
          เลือกเพื่อเปลี่ยนโรงเรือน
        </Typography>
        <HouseSelector
          houseGroups={houseGroups}
          selectedGroup={selectedGroup}
          selectedHouse={selectedHouse}
          isLoading={isLoading}
          onSelectGroup={onSelectGroup}
          onSelectHouse={onSelectHouse}
        />
      </Card>

      {/* Environment */}
      {hasOpenedHouses && (
        <Card sx={SECTION_CARD_SX}>
          <Stack direction="row" spacing={1} alignItems="center" mb={1.5}>
            <Typography variant="subtitle1" fontWeight={700} color={UI.text}>
              สภาพแวดล้อมทั่วไป
            </Typography>
            <LocationChip houseCode={selectedHouse} />
          </Stack>

          <Stack spacing={1.5}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' },
                gap: 1.25,
              }}
            >
              {[
                { label: 'อุณหภูมิเช้า (°C)', value: '26.5' },
                { label: 'อุณหภูมิกลางวัน (°C)', value: '30.0' },
                { label: 'อุณหภูมิเย็น (°C)', value: '28.0' },
                { label: 'ความชื้นรวม (%)', value: '70' },
              ].map((item) => (
              <TextField
                key={item.label}
                size="small"
                label={item.label}
                value={item.value}
                InputProps={{ readOnly: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 10,
                    bgcolor: UI.panelSoft,
                    boxShadow: UI.shadowSoft,
                  },
                }}
              />
              ))}
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                gap: 1.25,
              }}
            >
              {['กลิ่นแอมโมเนีย', 'การระบายอากาศ', 'แสงสว่าง'].map(
                (label) => (
                  <FormControl key={label} size="small" fullWidth>
                  <InputLabel>{label}</InputLabel>
                  <Select
                    defaultValue="ปกติ"
                    label={label}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 10,
                        bgcolor: UI.panelSoft,
                        boxShadow: UI.shadowSoft,
                      },
                    }}
                  >
                      <MenuItem value="ปกติ">ปกติ</MenuItem>
                      <MenuItem value="เฝ้าระวัง">เฝ้าระวัง</MenuItem>
                      <MenuItem value="ผิดปกติ">ผิดปกติ</MenuItem>
                    </Select>
                  </FormControl>
                ),
              )}
            </Box>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
