'use client';

import { VisibilityOutlined, Agriculture, HomeWorkOutlined, GroupsOutlined, ScaleOutlined } from '@mui/icons-material';
import {
  Box,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { type ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import SearchField from '@/components/common/SearchField';
import DataTable, { type Column } from '@/components/common/DataTable';
import EmptyState from '@/components/common/EmptyState';
import {
  BLOCK_FIELDSET_LEGEND_SX,
  BLOCK_FIELDSET_SX,
  BLOCK_TABLE_FIELDSET_ALIGNED_SX,
  MASTER_PROGRAM_SHELL_FIELDSET_SX,
} from '@/core/ui-patterns/block-style.template';
import { MasterSectionLayout } from '@/features/admin/master/components';
import { masterApi } from '@/features/admin/master/services/master.api';

interface FiStandardCategoryCard {
  key: string;
  label: string;
  count: number;
  active: boolean;
}

interface FiStandardProfileOption {
  id: string;
  name: string;
  referenceCode: string;
}

interface FiStandardFacilityOption {
  id: number;
  code: string;
  name: string;
}

interface FiStandardHouseOption {
  id: number;
  facilityId: number;
  houseCode: string;
  houseName: string;
}

interface FiStandardGenderOption {
  value: 'ALL' | 'MALE' | 'FEMALE';
  label: string;
}

interface FiStandardSummaryCard {
  itemId: number;
  feedCode: string;
  feedName: string;
  startDay: number;
  endDay: number;
  totalDays: number;
  totalFiKg: number;
  colorHex: string;
}

interface FiStandardDailyRow {
  id?: string;
  day: number;
  itemId: number;
  feedCode: string;
  feedName: string;
  dailyFiKg: number;
  cumulativeFi: number;
}

interface FiStandardOptionsResponse {
  categories: FiStandardCategoryCard[];
  profiles: FiStandardProfileOption[];
  facilities: FiStandardFacilityOption[];
  houses: FiStandardHouseOption[];
  genders: FiStandardGenderOption[];
  hasFarmAccess?: boolean;
  isFarmScopeEnforced?: boolean;
  accessMessage?: string;
}

interface FiStandardRecordsResponse {
  profileId: string | null;
  profileName: string;
  referenceCode: string;
  gender: 'ALL' | 'MALE' | 'FEMALE';
  facilityId: number | null;
  houseId: number | null;
  search: string;
  page: number;
  pageSize: number;
  totalCount: number;
  summaryCards: FiStandardSummaryCard[];
  rows: FiStandardDailyRow[];
  colorMap: Record<string, string>;
  hasFarmAccess?: boolean;
  isFarmScopeEnforced?: boolean;
  accessMessage?: string;
}

const CATEGORY_ICONS: Record<string, ReactElement> = {
  farms: <Agriculture sx={{ fontSize: 20 }} />,
  houses: <HomeWorkOutlined sx={{ fontSize: 20 }} />,
  personnel: <GroupsOutlined sx={{ fontSize: 20 }} />,
  'fi-std': <ScaleOutlined sx={{ fontSize: 20 }} />,
};

interface MasterFiStandardPageProps {
  standalone?: boolean;
  title?: string;
}

export function MasterFiStandardPage({ standalone = false, title = 'มาตรฐาน FI (Feed Intake Standard)' }: MasterFiStandardPageProps = {}) {
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<FiStandardOptionsResponse>({
    categories: [],
    profiles: [],
    facilities: [],
    houses: [],
    genders: [{ value: 'ALL', label: 'ทุกเพศ' }],
    hasFarmAccess: true,
    isFarmScopeEnforced: false,
    accessMessage: '',
  });
  const [records, setRecords] = useState<FiStandardRecordsResponse>({
    profileId: null,
    profileName: '',
    referenceCode: '',
    gender: 'ALL',
    facilityId: null,
    houseId: null,
    search: '',
    page: 1,
    pageSize: 150,
    totalCount: 0,
    summaryCards: [],
    rows: [],
    colorMap: {},
    hasFarmAccess: true,
    isFarmScopeEnforced: false,
    accessMessage: '',
  });
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [selectedGender, setSelectedGender] = useState<'ALL' | 'MALE' | 'FEMALE'>('ALL');
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | ''>('');
  const [selectedHouseId, setSelectedHouseId] = useState<number | ''>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(150);

  const loadOptions = useCallback(async (facilityId?: number) => {
    const response = (await masterApi.getFiStandardOptions(facilityId)) as FiStandardOptionsResponse;
    setOptions(response);
    if (!selectedProfileId && response.profiles.length > 0) {
      setSelectedProfileId(response.profiles[0].id);
    }
  }, [selectedProfileId]);

  const loadRecords = useCallback(async () => {
    if (!selectedProfileId) return;
    setLoading(true);
    try {
      const response = (await masterApi.getFiStandardRecords({
        profileId: selectedProfileId,
        gender: selectedGender,
        facilityId: selectedFacilityId === '' ? undefined : selectedFacilityId,
        houseId: selectedHouseId === '' ? undefined : selectedHouseId,
        search,
        page: page + 1,
        pageSize: rowsPerPage,
      })) as FiStandardRecordsResponse;
      setRecords(response);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, selectedFacilityId, selectedGender, selectedHouseId, selectedProfileId]);

  useEffect(() => {
    loadOptions().catch(() => {
      setOptions((prev) => ({ ...prev, profiles: [] }));
    });
  }, [loadOptions]);

  useEffect(() => {
    loadRecords().catch(() => {
      setRecords((prev) => ({ ...prev, rows: [], summaryCards: [], totalCount: 0 }));
    });
  }, [loadRecords]);

  const handleFacilityChange = async (value: number | '') => {
    setSelectedFacilityId(value);
    setSelectedHouseId('');
    setPage(0);
    await loadOptions(value === '' ? undefined : value);
  };

  const columns = useMemo<Column<FiStandardDailyRow>[]>(() => [
    {
      id: 'day',
      label: 'วัน',
      minWidth: 72,
      align: 'center',
      format: (value) => Number(value).toLocaleString('en-US'),
    },
    {
      id: 'feedCode',
      label: 'เบอร์อาหาร',
      minWidth: 180,
      format: (_, row) => (
        <Chip
          size="small"
          label={row.feedCode}
          sx={{
            bgcolor: records.colorMap[row.feedCode] ?? '#E2E8F0',
            fontWeight: 700,
            minWidth: 84,
          }}
        />
      ),
    },
    {
      id: 'dailyFiKg',
      label: 'FI/ตัว (กก.)',
      minWidth: 120,
      align: 'right',
      format: (value) => Number(value).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
    },
    {
      id: 'cumulativeFi',
      label: 'FI สะสม',
      minWidth: 120,
      align: 'right',
      format: (value) => Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    },
    {
      id: 'action',
      label: 'Action',
      minWidth: 90,
      align: 'center',
      format: (_, row) => (
        <Tooltip title={`ดูรายละเอียดวันที่ ${row.day}`}>
          <VisibilityOutlined fontSize="small" />
        </Tooltip>
      ),
    },
  ], [records.colorMap]);

  const availableHouses = useMemo(
    () => options.houses.filter((house) => (selectedFacilityId === '' ? true : house.facilityId === selectedFacilityId)),
    [options.houses, selectedFacilityId],
  );
  const noFarmAccess = options.hasFarmAccess === false || records.hasFarmAccess === false;
  const noFarmAccessMessage = records.accessMessage || options.accessMessage || 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลฟาร์มสำหรับมาตรฐาน FI';

  const content = (
      <Box component="fieldset" sx={MASTER_PROGRAM_SHELL_FIELDSET_SX}>
        <Box sx={{ p: 2, display: 'grid', gap: 2 }}>
          {standalone ? (
            <Box
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 10,
                p: 1.5,
                bgcolor: '#F8FAFC',
              }}
            >
              <Typography variant="h6" fontWeight={800}>
                {title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Dashboard สรุปข้อมูลฟาร์มและมาตรฐานการกินอาหาร (FI)
              </Typography>
            </Box>
          ) : null}
          {noFarmAccess ? (
            <EmptyState
              title="ยังไม่สามารถแสดงข้อมูลมาตรฐาน FI"
              message={noFarmAccessMessage}
            />
          ) : (
            <>
          <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0, 1fr))' } }}>
            {options.categories.map((card) => (
              <Box
                key={card.key}
                sx={{
                  border: '1px solid',
                  borderColor: card.active ? '#93C5FD' : 'divider',
                  bgcolor: card.active ? '#EFF6FF' : 'background.paper',
                  borderRadius: 10,
                  px: 1.5,
                  py: 1.25,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {CATEGORY_ICONS[card.key] ?? <ScaleOutlined sx={{ fontSize: 20 }} />}
                  <Typography fontSize={13} fontWeight={700}>{card.label}</Typography>
                </Box>
                <Chip label={card.count.toLocaleString('en-US')} size="small" color={card.active ? 'primary' : 'default'} />
              </Box>
            ))}
          </Box>

          <Box component="fieldset" sx={BLOCK_FIELDSET_SX}>
            <Typography component="legend" sx={BLOCK_FIELDSET_LEGEND_SX}>มาตรฐาน FI (Feed Intake Standard)</Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 1.5, justifyContent: 'space-between' }}>
              <Box>
                <Typography fontWeight={700}>{records.profileName || '-'}</Typography>
                <Typography variant="body2" color="text.secondary">
                  อ้างอิง: {records.referenceCode || '-'}
                </Typography>
              </Box>
              <ToggleButtonGroup
                size="small"
                value={selectedProfileId}
                exclusive
                onChange={(_, value: string | null) => {
                  if (!value) return;
                  setSelectedProfileId(value);
                  setPage(0);
                }}
              >
                {options.profiles.map((profile) => (
                  <ToggleButton key={profile.id} value={profile.id}>
                    {profile.name}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, minmax(0, 1fr))', lg: 'repeat(4, minmax(0, 1fr))' } }}>
            {records.summaryCards.map((card) => (
              <Box key={`${card.itemId}-${card.startDay}`} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 10, p: 1.25, bgcolor: 'background.paper' }}>
                <Chip size="small" label={card.feedCode} sx={{ bgcolor: card.colorHex, fontWeight: 700, mb: 0.5 }} />
                <Typography variant="body2" color="text.secondary">{card.startDay}-{card.endDay} วัน</Typography>
                <Typography variant="body2" fontWeight={700}>{Number(card.totalFiKg).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} กก./ตัว</Typography>
              </Box>
            ))}
          </Box>

          <Box component="fieldset" sx={BLOCK_FIELDSET_SX}>
            <Typography component="legend" sx={BLOCK_FIELDSET_LEGEND_SX}>ค้นหาและกรองข้อมูล</Typography>
            <Box sx={{ display: 'grid', gap: 1.25, gridTemplateColumns: { xs: '1fr', md: '2fr repeat(4, minmax(0, 1fr))' } }}>
              <SearchField
                placeholder="ค้นหาวัน หรือเบอร์อาหาร"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(0);
                }}
              />

              <FormControl size="small">
                <InputLabel>ฟาร์ม</InputLabel>
                <Select
                  label="ฟาร์ม"
                  value={selectedFacilityId}
                  onChange={(event) => {
                    void handleFacilityChange(event.target.value as number | '');
                  }}
                >
                  <MenuItem value="">ทุกฟาร์ม</MenuItem>
                  {options.facilities.map((facility) => (
                    <MenuItem key={facility.id} value={facility.id}>{facility.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small">
                <InputLabel>โรงเรือน</InputLabel>
                <Select
                  label="โรงเรือน"
                  value={selectedHouseId}
                  onChange={(event) => {
                    setSelectedHouseId(event.target.value as number | '');
                    setPage(0);
                  }}
                  disabled={selectedFacilityId === ''}
                >
                  <MenuItem value="">ทุกโรงเรือน</MenuItem>
                  {availableHouses.map((house) => (
                    <MenuItem key={house.id} value={house.id}>
                      {house.houseCode} - {house.houseName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl size="small">
                <InputLabel>เพศ</InputLabel>
                <Select
                  label="เพศ"
                  value={selectedGender}
                  onChange={(event) => {
                    setSelectedGender(event.target.value as 'ALL' | 'MALE' | 'FEMALE');
                    setPage(0);
                  }}
                >
                  {options.genders.map((genderOption) => (
                    <MenuItem key={genderOption.value} value={genderOption.value}>{genderOption.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Box component="fieldset" sx={BLOCK_TABLE_FIELDSET_ALIGNED_SX}>
            <Typography component="legend" sx={BLOCK_FIELDSET_LEGEND_SX}>ตารางข้อมูลการกินรายวัน</Typography>
            <DataTable
              columns={columns}
              data={records.rows}
              loading={loading}
              page={page}
              rowsPerPage={rowsPerPage}
              totalCount={records.totalCount}
              onPageChange={setPage}
              onRowsPerPageChange={(value) => {
                setRowsPerPage(value);
                setPage(0);
              }}
              footerSummaryText={`แสดงทั้งหมด ${records.totalCount.toLocaleString('en-US')} รายการ`}
              rowsPerPageOptions={[50, 100, 150, 300]}
              emptyMessage="ไม่พบข้อมูลมาตรฐาน FI"
            />
          </Box>
            </>
          )}
        </Box>
      </Box>
  );

  if (standalone) {
    return content;
  }

  return <MasterSectionLayout>{content}</MasterSectionLayout>;
}
