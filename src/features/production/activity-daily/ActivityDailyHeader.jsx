import React from 'react';
import { Box, Chip, Stack, TextField, Typography } from '@mui/material';
import { UI } from './constants';

export default function ActivityDailyHeader({
  entryDate,
  setEntryDate,
  currentUserName,
  selectedFacility,
  entryStatus,
  hydrating,
}) {
  return (
    <Box
      sx={{
        borderRadius: 3.5,
        border: `1px solid ${UI.border}`,
        bgcolor: UI.panel,
        background: `linear-gradient(135deg, ${UI.accentSurface} 0%, ${UI.panel} 58%)`,
        boxShadow: UI.shadow,
        px: { xs: 2, md: 2.6 },
        py: { xs: 2, md: 2.4 },
        display: 'grid',
        gap: 1.3,
        mb: 2,
      }}
    >
      {/* Title row */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
        }}
      >
        <Chip
          size="small"
          label="Daily Activity"
          sx={{
            bgcolor: '#fff',
            color: UI.accent,
            fontWeight: 800,
            border: `1px solid ${UI.borderStrong}`,
            height: 28,
          }}
        />
        <Typography sx={{ fontSize: '0.9rem', color: UI.muted }}>
          ฟอร์มบันทึกประจำวันสำหรับใช้งานหน้างานจริง รองรับทั้งมือถือและจอใหญ่
        </Typography>
      </Box>

      {/* Main title */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 1.5,
          flexWrap: 'wrap',
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: { xs: '1.85rem', md: '2.35rem' },
              fontWeight: 900,
              lineHeight: 1.02,
              color: UI.text,
              letterSpacing: '-0.03em',
            }}
          >
            บันทึกข้อมูลประจำวัน
          </Typography>
          <Typography
            sx={{
              mt: 0.8,
              fontSize: '0.96rem',
              color: UI.muted,
              maxWidth: 760,
            }}
          >
            เลือกโรงเรือน บันทึกสุขภาพ อาหาร ยา และหลักฐานจาก flow เดียวที่อ่านง่าย กดง่าย และไม่ล้าบนมือถือ
          </Typography>
        </Box>
        <Typography
          sx={{ fontSize: '0.95rem', color: UI.muted, fontWeight: 700 }}
        >
          Dashboard / บันทึกข้อมูลประจำวัน
        </Typography>
      </Box>

      {/* Info fields */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            lg: 'repeat(3, 1fr)',
          },
          gap: { xs: 1, md: 1.25 },
          mt: 1,
        }}
      >
        <TextField
          size="small"
          label="วันที่เอกสาร"
          type="date"
          value={entryDate}
          onChange={(event) => setEntryDate(event.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: UI.panelSoft } }}
        />
        <TextField
          size="small"
          label="ผู้รายงาน"
          value={currentUserName}
          InputProps={{ readOnly: true }}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: UI.panelSoft } }}
        />
        <TextField
          size="small"
          label="ฟาร์ม / โซน"
          value={
            selectedFacility
              ? `${selectedFacility.code} - ${selectedFacility.name}`
              : '-'
          }
          InputProps={{ readOnly: true }}
          sx={{ '& .MuiOutlinedInput-root': { bgcolor: UI.panelSoft } }}
        />
      </Box>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        sx={{ mt: 0.9, gap: 0.6 }}
      >
        <Typography variant="caption" color="text.secondary">
          สถานะเอกสาร: {entryStatus}
        </Typography>
        {hydrating && (
          <Typography variant="caption" color="text.secondary">
            กำลังโหลดข้อมูลเดิม...
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
