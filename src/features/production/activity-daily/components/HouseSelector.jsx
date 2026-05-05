import React from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { UI } from '../constants';

export default function HouseSelector({
  houseGroups,
  selectedGroup,
  selectedHouse,
  isLoading = false,
  onSelectGroup,
  onSelectHouse,
}) {
  const currentGroupHouses =
    houseGroups.find((group) => group.id === selectedGroup)?.houses ?? [];

  if (isLoading) {
    return (
      <Stack spacing={1.5}>
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <CircularProgress size={18} thickness={5} />
          <Typography variant="body2" color="text.secondary" fontWeight={600}>
            กำลังโหลดโรงเรือน...
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.25, pr: 0.25 }}>
          {[0, 1, 2].map((index) => (
            <Skeleton
              key={`group-skeleton-${index}`}
              variant="rounded"
              width={112}
              height={40}
              sx={{ borderRadius: 2.5, flexShrink: 0 }}
            />
          ))}
        </Stack>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr 1fr',
              md: 'repeat(4, minmax(0,1fr))',
            },
            gap: { xs: 1, md: 1.25 },
          }}
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton
              key={`house-skeleton-${index}`}
              variant="rounded"
              height={138}
              sx={{ borderRadius: 2.6 }}
            />
          ))}
        </Box>
      </Stack>
    );
  }

  if (houseGroups.length === 0 || currentGroupHouses.length === 0) {
    return (
      <Alert severity="warning" sx={{ borderRadius: 2 }}>
        ฟาร์มนี้ยังไม่มีโรงเรือนที่เปิดใช้งาน
      </Alert>
    );
  }

  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle1" fontWeight={700} color={UI.text}>
        เลือกโรงเรือน
      </Typography>

      <Stack
        direction="row"
        spacing={1}
        sx={{ overflowX: 'auto', pb: 0.25, pr: 0.25 }}
      >
        {houseGroups.map((group, groupIndex) => (
          <Button
            key={`${group.id}-${group.label}-${groupIndex}`}
            variant={selectedGroup === group.id ? 'contained' : 'outlined'}
            disabled={isLoading}
            onClick={() => onSelectGroup(group.id)}
            sx={{
              minWidth: { xs: 108, md: 120 },
              whiteSpace: 'nowrap',
              borderRadius: 2.5,
              flexShrink: 0,
              ...(selectedGroup === group.id
                ? {
                    bgcolor: UI.accent,
                    color: '#fff',
                    '&:hover': { bgcolor: '#10473f' },
                  }
                : {
                    bgcolor: '#fff',
                    borderColor: UI.border,
                    color: UI.text,
                    '&:hover': {
                      borderColor: UI.accent,
                      bgcolor: alpha(UI.accent, 0.06),
                    },
                  }),
            }}
          >
            {group.label}
          </Button>
        ))}
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr 1fr',
            md: 'repeat(4, minmax(0,1fr))',
          },
          gap: { xs: 1, md: 1.25 },
        }}
      >
        {currentGroupHouses.map((house, houseIndex) => {
          const isActive = selectedHouse === house.code;
          return (
            <Card
              key={`${selectedGroup}-${house.code}-${house.name ?? ''}-${houseIndex}`}
              variant="outlined"
              onClick={() => !isLoading && onSelectHouse(house.code)}
              sx={{
                cursor: isLoading ? 'default' : 'pointer',
                borderRadius: 2.6,
                borderColor: isActive ? UI.accent : UI.borderStrong,
                borderWidth: isActive ? 2 : 1,
                position: 'relative',
                bgcolor: isActive ? alpha(UI.accent, 0.04) : '#fff',
                boxShadow: isActive ? UI.shadowSoft : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={1}
                  gap={1}
                >
                  <Stack spacing={0.1} sx={{ minWidth: 0 }}>
                    <Typography
                      fontWeight={700}
                      color={isActive ? UI.accent : 'text.primary'}
                      noWrap
                    >
                      {house.code}
                    </Typography>
                    {house.name ? (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        noWrap
                      >
                        {house.name}
                      </Typography>
                    ) : null}
                  </Stack>
                  <Chip
                    size="small"
                    label={
                      house.status
                        ? String(house.status)
                        : `อายุ ${house.ageDays ?? '-'} วัน`
                    }
                    sx={{ height: 22, maxWidth: 92 }}
                  />
                </Stack>
                <Stack spacing={0.6}>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap">
                    {Number.isFinite(Number(house.ageDays)) ? (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`อายุ ${house.ageDays} วัน`}
                        sx={{ height: 22 }}
                      />
                    ) : null}
                    {house.batchNo ? (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`Batch ${house.batchNo}`}
                        sx={{ height: 22 }}
                      />
                    ) : null}
                  </Stack>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      คงเหลือ:
                    </Typography>
                    <Typography variant="h6" fontWeight={700}>
                      {house.currentQuantity ?? '-'} ตัว
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Stack>
  );
}
