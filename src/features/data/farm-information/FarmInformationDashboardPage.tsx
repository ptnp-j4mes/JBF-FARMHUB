'use client';

import { LocationOnOutlined, PersonOutline, WarningAmberOutlined } from '@mui/icons-material';
import { Box, Button, Chip, FormControl, MenuItem, Select, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import EmptyState from '@/components/common/EmptyState';
import { masterApi } from '@/features/admin/master/services/master.api';
import { getCurrentFacilityId } from '@/lib/facility-context';

interface FacilityOption {
  id: number;
  code: string;
  name: string;
}

interface DashboardSummary {
  facilityId: number;
  facilityCode: string;
  facilityName: string;
  managerName: string;
  activeHouseCount: number;
  totalCurrentHead: number;
  totalCapacityHead: number;
  fcrAverage?: number | null;
  mortalityRatePercent?: number | null;
  totalFeedKg?: number | null;
  alertCount: number;
}

interface HouseCard {
  buildingOpeningId: number;
  documentNumber: string;
  houseCode: string;
  houseName: string;
  batchNo: string;
  status: string;
  currentHeadCount: number;
  capacityHeadCount: number;
  fcrActual?: number | null;
  fcrTarget?: number | null;
  mortalityRatePercent?: number | null;
  receivedDate?: string | null;
}

interface DashboardResponse {
  hasFarmAccess: boolean;
  accessMessage: string;
  facilities: FacilityOption[];
  selectedFacilityId?: number | null;
  summary?: DashboardSummary | null;
  houses: HouseCard[];
}

const STATUS_TEXT: Record<string, string> = {
  Draft: 'ฉบับร่าง',
  Submitted: 'รอดำเนินการ',
  InProgress: 'กำลังดำเนินการ',
  AwaitingReceive: 'รอรับเข้า',
  Completed: 'เสร็จสิ้น',
  Cancelled: 'ยกเลิก',
  Approved: 'อนุมัติ',
};

const UI = {
  panel: '#ffffff',
  panelSoft: '#f8faf8',
  panelMuted: '#f2f6f3',
  border: '#dde2de',
  borderStrong: '#cad4cf',
  text: '#2f3a37',
  muted: '#7d8783',
  accent: 'rgb(22, 90, 80)',
  accentSoft: '#dce8e4',
  accentSurface: '#edf5f1',
  shadow: '0 18px 40px rgba(22, 35, 31, 0.08), 0 3px 10px rgba(22, 35, 31, 0.05)',
  softShadow: '0 10px 24px rgba(22, 35, 31, 0.06), 0 2px 6px rgba(22, 35, 31, 0.04)',
};

const panelSx = {
  borderRadius: 3.5,
  border: `1px solid ${UI.border}`,
  bgcolor: UI.panel,
  boxShadow: UI.shadow,
};

function fmt(n?: number | null, digits = 0): string {
  if (n == null || Number.isNaN(n)) return '-';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export default function FarmInformationDashboardPage() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [data, setData] = useState<DashboardResponse>({
    hasFarmAccess: true,
    accessMessage: '',
    facilities: [],
    selectedFacilityId: null,
    summary: null,
    houses: [],
  });
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | ''>('');

  const loadDashboard = async (facilityId?: number) => {
    setLoading(true);
    try {
      setErrorMessage('');
      const res = (await masterApi.getFarmInformationDashboard(facilityId)) as DashboardResponse;
      setData(res);
      if ((facilityId == null || facilityId === 0) && res.selectedFacilityId) {
        setSelectedFacilityId(res.selectedFacilityId);
      }
    } catch (error) {
      setErrorMessage('ไม่สามารถโหลดข้อมูลได้ชั่วคราว กรุณาลองใหม่อีกครั้ง');
      setData((prev) => ({
        ...prev,
        summary: null,
        houses: [],
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentFacilityId = getCurrentFacilityId();
    if (currentFacilityId) {
      setSelectedFacilityId(currentFacilityId);
      void loadDashboard(currentFacilityId);
      return;
    }

    void loadDashboard();
  }, []);

  const noAccess = data.hasFarmAccess === false;
  const selectedFacility = useMemo(
    () => data.facilities.find((farm) => farm.id === selectedFacilityId) ?? null,
    [data.facilities, selectedFacilityId],
  );

  return (
    <Box sx={{ width: '100%', maxWidth: 1440, mx: 'auto', p: { xs: 1.5, md: 2 }, display: 'grid', gap: 2, bgcolor: UI.bg, minWidth: 0, overflowX: 'hidden' }}>
      <Box
        sx={{
          ...panelSx,
          background: `linear-gradient(135deg, ${UI.accentSurface} 0%, ${UI.panel} 58%)`,
          px: { xs: 2, md: 2.6 },
          py: { xs: 2, md: 2.4 },
          display: 'grid',
          gap: 1.4,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            size="small"
            label="Farm Information"
            sx={{
              bgcolor: '#fff',
              color: UI.accent,
              fontWeight: 800,
              border: `1px solid ${UI.borderStrong}`,
              height: 28,
            }}
          />
          <Typography sx={{ fontSize: '0.9rem', color: UI.muted }}>
            แสดงข้อมูลจากเอกสารเปิดโรงเรือนที่ยังใช้งานอยู่ เพื่อสแกนสถานะฟาร์มได้เร็วขึ้น
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap', minWidth: 0 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: { xs: '1.9rem', md: '2.35rem' }, fontWeight: 900, lineHeight: 1.02, color: UI.text, letterSpacing: '-0.03em' }}>
              ข้อมูลรายฟาร์ม
            </Typography>
            <Typography sx={{ mt: 0.8, fontSize: '0.96rem', color: UI.muted, maxWidth: 760 }}>
              ติดตามผู้รับผิดชอบ จำนวนโรงเรือนที่เปิดอยู่ สุกรคงเหลือ ประสิทธิภาพการเลี้ยง และสัญญาณเตือนจากหน้าจอเดียว
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.95rem', color: UI.muted, fontWeight: 700 }}>
            Dashboard / ข้อมูลรายฟาร์ม
          </Typography>
        </Box>
      </Box>

      <Box sx={{ ...panelSx, p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', minWidth: 0 }}>
          <Button component={Link} href="/data/farm-information/feed-inbound-plan" variant="outlined" size="small" sx={{ borderColor: '#b8c5bf', color: UI.text, borderRadius: 2, boxShadow: UI.softShadow, '&:hover': { borderColor: UI.accent, bgcolor: alpha(UI.accent, 0.06) } }}>
            แผนเรียกเข้าอาหาร
          </Button>
          <Button component={Link} href="/data/farm-information/fi-management" variant="outlined" size="small" sx={{ borderColor: '#b8c5bf', color: UI.text, borderRadius: 2, boxShadow: UI.softShadow, '&:hover': { borderColor: UI.accent, bgcolor: alpha(UI.accent, 0.06) } }}>
            จัดการ FI
          </Button>
        </Box>
        <Box sx={{ minWidth: 0, width: { xs: '100%', md: 'auto' } }}>
          <FormControl size="small" sx={{ minWidth: { xs: '100%', md: 260 }, width: { xs: '100%', md: 260 }, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: UI.panelSoft, boxShadow: UI.softShadow } }}>
            <Select
              displayEmpty
              value={selectedFacilityId}
              onChange={(event) => {
                const id = event.target.value as number;
                setSelectedFacilityId(id);
                void loadDashboard(id);
              }}
            >
              {data.facilities.map((facility) => (
                <MenuItem key={facility.id} value={facility.id}>{facility.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {noAccess ? (
        <EmptyState
          title="ยังไม่สามารถแสดงข้อมูลฟาร์ม"
          message={data.accessMessage || 'คุณไม่มีสิทธิ์เข้าถึงฟาร์ม'}
        />
      ) : null}

      {!noAccess && errorMessage ? (
        <EmptyState title="โหลดข้อมูลไม่สำเร็จ" message={errorMessage} />
      ) : null}

      {!noAccess && !errorMessage && data.summary ? (
        <>
          <Box sx={{ ...panelSx, p: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', minWidth: 0 }}>
              <Box sx={{ display: 'grid', gap: 0.75, minWidth: 0 }}>
                <Typography sx={{ fontSize: '1.55rem', fontWeight: 900, color: UI.text, lineHeight: 1.1 }}>{data.summary.facilityName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  <LocationOnOutlined sx={{ fontSize: 16, verticalAlign: 'text-bottom' }} /> {data.summary.facilityCode}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <PersonOutline sx={{ fontSize: 16, verticalAlign: 'text-bottom' }} /> ผู้รับผิดชอบล่าสุด: {data.summary.managerName || '-'}
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, minmax(0,1fr))' }, gap: 1.25, width: { xs: '100%', md: 'auto' }, minWidth: 0 }}>
                <Box sx={{ borderRadius: 2.6, border: `1px solid ${UI.border}`, bgcolor: UI.panelMuted, p: 1.35 }}>
                  <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#15803D', lineHeight: 1 }}>{fmt(data.summary.fcrAverage, 2)}</Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: UI.muted }}>FCR เฉลี่ย</Typography>
                </Box>
                <Box sx={{ borderRadius: 2.6, border: `1px solid ${UI.border}`, bgcolor: UI.panelMuted, p: 1.35 }}>
                  <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#B45309', lineHeight: 1 }}>{fmt(data.summary.mortalityRatePercent, 2)}%</Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: UI.muted }}>อัตราตาย</Typography>
                </Box>
                <Box sx={{ borderRadius: 2.6, border: `1px solid ${UI.border}`, bgcolor: UI.panelMuted, p: 1.35 }}>
                  <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#1D4ED8', lineHeight: 1 }}>{fmt(data.summary.totalFeedKg, 0)}</Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: UI.muted }}>อาหารที่ใช้ (กก.)</Typography>
                </Box>
                <Box sx={{ borderRadius: 2.6, border: `1px solid ${UI.border}`, bgcolor: UI.panelMuted, p: 1.35 }}>
                  <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#BE123C', lineHeight: 1 }}>{fmt(data.summary.alertCount, 0)}</Typography>
                  <Typography sx={{ fontSize: '0.8rem', color: UI.muted }}>การแจ้งเตือน</Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          <Box sx={{ ...panelSx, p: 2, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap', minWidth: 0 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontWeight: 900, color: UI.text, fontSize: '1.18rem', mb: 0.6 }}>โรงเรือนที่เปิดอยู่</Typography>
                <Typography variant="body2" color="text.secondary">
                  จำนวนโรงเรือนที่เปิดอยู่: {fmt(data.summary.activeHouseCount, 0)} | คงเหลือรวม: {fmt(data.summary.totalCurrentHead, 0)} ตัว
                </Typography>
              </Box>
              <Chip
                label={`Capacity ${fmt(data.summary.totalCapacityHead, 0)} ตัว`}
                sx={{ bgcolor: UI.accentSurface, color: UI.accent, fontWeight: 800 }}
              />
            </Box>
          </Box>

          {data.houses.length === 0 ? (
            <EmptyState
              title="ไม่พบโรงเรือนที่เปิดอยู่"
              message={selectedFacility ? `ฟาร์ม ${selectedFacility.name} ยังไม่มีโรงเรือนที่เปิดอยู่` : 'ยังไม่มีข้อมูลโรงเรือน'}
            />
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' }, gap: 1.5, minWidth: 0 }}>
              {data.houses.map((house) => {
                const capacity = house.capacityHeadCount > 0 ? house.capacityHeadCount : house.currentHeadCount;
                const percent = capacity > 0 ? (house.currentHeadCount / capacity) * 100 : 0;
                return (
                  <Box
                    key={`${house.buildingOpeningId}-${house.houseCode}`}
                    sx={{
                      ...panelSx,
                      p: 1.6,
                      background: `linear-gradient(135deg, ${alpha(UI.accentSoft, 0.22)} 0%, ${UI.panel} 48%)`,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontWeight: 900, color: UI.text }}>{house.houseName || house.houseCode}</Typography>
                      <Chip
                        size="small"
                        label={STATUS_TEXT[house.status] ?? house.status}
                        color={house.status === 'Completed' ? 'success' : 'warning'}
                        variant={house.status === 'Completed' ? 'outlined' : 'filled'}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      เอกสาร: {house.documentNumber || '-'} | Batch: {house.batchNo || '-'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      คงเหลือ {fmt(house.currentHeadCount, 0)}/{fmt(capacity, 0)} ตัว
                    </Typography>

                    <Box sx={{ height: 8, bgcolor: '#E5E7EB', borderRadius: 999, mt: 1.1, mb: 1.3 }}>
                      <Box sx={{ width: `${Math.min(percent, 100)}%`, height: '100%', borderRadius: 999, bgcolor: UI.accent }} />
                    </Box>

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 0.55, columnGap: 1, borderTop: `1px solid ${UI.border}`, pt: 1.1 }}>
                      <Typography variant="body2" color="text.secondary">FCR จริง</Typography>
                      <Typography variant="body2" sx={{ textAlign: 'right', fontWeight: 700 }}>{fmt(house.fcrActual, 2)}</Typography>
                      <Typography variant="body2" color="text.secondary">FCR เป้าหมาย</Typography>
                      <Typography variant="body2" sx={{ textAlign: 'right', fontWeight: 700 }}>{fmt(house.fcrTarget, 2)}</Typography>
                      <Typography variant="body2" color="text.secondary">อัตราตาย</Typography>
                      <Typography variant="body2" sx={{ textAlign: 'right', fontWeight: 700 }}>
                        {house.mortalityRatePercent != null ? `${fmt(house.mortalityRatePercent, 2)}%` : '-'}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 1.25, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        component={Link}
                        href={`/data/farm-information/house/${house.buildingOpeningId}`}
                        size="small"
                        variant="outlined"
                        sx={{ borderRadius: 2, borderColor: '#b8c5bf', color: UI.text, boxShadow: UI.softShadow, '&:hover': { borderColor: UI.accent, bgcolor: alpha(UI.accent, 0.06) } }}
                      >
                        ดูรายละเอียดโรงเรือน
                      </Button>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </>
      ) : null}

      {loading ? (
        <Typography variant="body2" color="text.secondary">กำลังโหลดข้อมูล...</Typography>
      ) : null}

      {!noAccess && !errorMessage && !data.summary && !loading ? (
        <EmptyState
          title="ยังไม่มีข้อมูลโรงเรือนที่เปิดอยู่"
          message="ระบบจะแสดงข้อมูลเมื่อมีเอกสารเปิดโรงเรือนที่ยังใช้งานอยู่"
        />
      ) : null}
    </Box>
  );
}
