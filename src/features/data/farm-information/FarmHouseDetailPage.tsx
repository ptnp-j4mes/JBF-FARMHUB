'use client';

import { ArrowBack, LocationOnOutlined, PersonOutline, PetsOutlined, QueryStatsOutlined, WarningAmberOutlined } from '@mui/icons-material';
import { Box, Button, Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';
import { Fragment, useEffect, useMemo, useState } from 'react';
import EmptyState from '@/components/common/EmptyState';
import { masterApi } from '@/features/admin/master/services/master.api';

type Props = {
  buildingOpeningId: number;
};

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
  shadowSoft: '0 10px 24px rgba(22, 35, 31, 0.06), 0 2px 6px rgba(22, 35, 31, 0.04)',
};

const panelSx = {
  borderRadius: 3.5,
  border: `1px solid ${UI.border}`,
  bgcolor: UI.panel,
  boxShadow: UI.shadow,
};

interface HouseDetailResponse {
  house: {
    buildingOpeningId: number;
    documentNumber: string;
    facilityCode: string;
    facilityName: string;
    houseCode: string;
    houseName: string;
    zone: string;
    generation: string;
    batchNo: string;
    status: string;
  };
  summary: {
    openingHeadCount: number;
    currentHeadCount: number;
    mortalityHead: number;
    cullHead: number;
    mortalityRatePercent?: number | null;
    fcrActual?: number | null;
    fcrTarget?: number | null;
    feedIntakeTotalKg: number;
    weightGainKg: number;
    totalTargetKg: number;
    totalActualKg: number;
    totalInboundKg: number;
    totalBoKg: number;
    currentBalanceKg: number;
    feedingEfficiencyPercent: number;
  };
  dailyRows: Array<{
    factDate: string;
    feedCode: string;
    stockHead: number;
    targetKg: number;
    actualKg: number;
    inboundKg: number;
    boKg: number;
    balanceKg: number;
    actualPerHeadKg: number;
    diffPerHeadKg: number;
    diffPercent: number;
  }>;
  activityDailyRows: Array<{
    headerId: number;
    docNo: string;
    documentType: string;
    entryDate: string;
    status: string;
    remark: string;
    selectedGroup: string;
    selectedHouse: string;
    recordCount: number;
  }>;
}

function fmt(n?: number | null, digits = 0): string {
  if (n == null || Number.isNaN(n)) return '-';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function pct(n?: number | null, digits = 2): string {
  const value = fmt(n, digits);
  return value === '-' ? '-' : `${value}%`;
}

export default function FarmHouseDetailPage({ buildingOpeningId }: Props) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [data, setData] = useState<HouseDetailResponse | null>(null);
  const [tableMode, setTableMode] = useState<'feeding' | 'daily'>('feeding');

  useEffect(() => {
    if (buildingOpeningId <= 0) {
      setData(null);
      setErrorMessage('รหัสเอกสารเปิดโรงเรือนไม่ถูกต้อง');
      setLoading(false);
      return;
    }

    const run = async () => {
      setLoading(true);
      try {
        setErrorMessage('');
        const res = await masterApi.getFarmHouseDetail(buildingOpeningId) as HouseDetailResponse;
        setData(res);
      } catch {
        setData(null);
        setErrorMessage('ไม่สามารถโหลดรายละเอียดโรงเรือนได้');
      } finally {
        setLoading(false);
      }
    };
    void run();
  }, [buildingOpeningId]);

  const cards = useMemo(() => {
    if (!data) return [];
    return [
      { label: 'คงเหลือสุกร', value: `${fmt(data.summary.currentHeadCount, 0)} ตัว`, color: '#15803D', icon: <PetsOutlined sx={{ fontSize: 18 }} /> },
      { label: 'FCR จริง', value: fmt(data.summary.fcrActual, 2), color: '#1D4ED8', icon: <QueryStatsOutlined sx={{ fontSize: 18 }} /> },
      { label: 'FCR เป้าหมาย', value: fmt(data.summary.fcrTarget, 2), color: '#334155', icon: <QueryStatsOutlined sx={{ fontSize: 18 }} /> },
      { label: 'อัตราตาย', value: pct(data.summary.mortalityRatePercent, 2), color: '#B45309', icon: <WarningAmberOutlined sx={{ fontSize: 18 }} /> },
      { label: 'ประสิทธิภาพให้อาหาร', value: pct(data.summary.feedingEfficiencyPercent, 2), color: '#7C3AED', icon: <QueryStatsOutlined sx={{ fontSize: 18 }} /> },
      { label: 'อาหารจริงสะสม', value: `${fmt(data.summary.totalActualKg, 3)} กก.`, color: '#0F766E', icon: <QueryStatsOutlined sx={{ fontSize: 18 }} /> },
      { label: 'อาหารเป้าสะสม', value: `${fmt(data.summary.totalTargetKg, 3)} กก.`, color: '#475569', icon: <QueryStatsOutlined sx={{ fontSize: 18 }} /> },
    ];
  }, [data]);

  const feedingTable = useMemo(() => {
    const feedCodes = ['110G', '111G', '112GI', '112G', '113G', '114G', '115G'];
    const dayRows = new Map<string, Record<string, { qty: number }>>();
    if (data) {
      data.dailyRows.forEach((row) => {
        const code = (row.feedCode || '').trim().toUpperCase();
        const day = (row.factDate || '').slice(0, 10);
        if (!feedCodes.includes(code) || !day) return;
        if (!dayRows.has(day)) {
          dayRows.set(day, {});
        }
        dayRows.get(day)![code] = { qty: row.actualKg };
      });
    }

    const days = Array.from(dayRows.keys()).sort();
    return { feedCodes, dayRows, days };
  }, [data]);

  const FEED_COLORS: Record<string, string> = {
    '110G': '#f5c2e7',
    '111G': '#d1d5db',
    '112GI': '#b7e4c7',
    '112G': '#d9f99d',
    '113G': '#fef08a',
    '114G': '#bfdbfe',
    '115G': '#fef900',
  };
  const FEED_HEADER_ROW1_HEIGHT = 46;
  const FEED_HEADER_TOP = {
    first: 0,
    second: FEED_HEADER_ROW1_HEIGHT,
  } as const;
  const ACTIVITY_TYPE_LABEL: Record<string, string> = {
    overview: 'ภาพรวม',
    health: 'สุขภาพสุกร',
    feed: 'อาหาร',
    meds: 'ยา/วัคซีน',
    mortality: 'ตาย/คัดทิ้ง',
    media: 'แนบไฟล์',
  };

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
            มุมมองรายละเอียดระดับโรงเรือนที่เชื่อมกับหน้าภาพรวมฟาร์ม
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
          <Box>
            <Typography sx={{ fontSize: { xs: '1.9rem', md: '2.35rem' }, fontWeight: 900, lineHeight: 1.02, color: UI.text, letterSpacing: '-0.03em' }}>
              รายละเอียดโรงเรือน
            </Typography>
            <Typography sx={{ mt: 0.8, fontSize: '0.96rem', color: UI.muted, maxWidth: 760 }}>
              สรุปข้อมูลการกิน อาหารคงเหลือ และกิจกรรมรายวันของโรงเรือนเดียว ในชุดดีไซน์เดียวกับหน้า main
            </Typography>
          </Box>
          <Typography sx={{ fontSize: '0.95rem', color: UI.muted, fontWeight: 700 }}>
            Dashboard / ข้อมูลรายฟาร์ม / โรงเรือน
          </Typography>
        </Box>
      </Box>

      <Box sx={{ ...panelSx, p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
          <Button
            component={Link}
            href="/data/farm-information"
            variant="outlined"
            size="small"
            startIcon={<ArrowBack />}
            sx={{
              borderColor: '#b8c5bf',
              color: UI.text,
              borderRadius: 2,
              boxShadow: UI.shadowSoft,
              '&:hover': { borderColor: UI.accent, bgcolor: alpha(UI.accent, 0.06) },
            }}
          >
            กลับหน้า Farm Info
          </Button>
          {data?.house?.status ? (
            <Chip
              size="small"
              label={STATUS_TEXT[data.house.status] ?? data.house.status}
              sx={{
                bgcolor: data.house.status === 'Completed' ? alpha('#15803D', 0.08) : UI.accentSurface,
                color: data.house.status === 'Completed' ? '#15803D' : UI.accent,
                fontWeight: 800,
                border: `1px solid ${data.house.status === 'Completed' ? alpha('#15803D', 0.2) : UI.borderStrong}`,
              }}
            />
          ) : null}
        </Box>
        <Typography sx={{ fontSize: '0.9rem', color: UI.muted }}>
          เอกสารเปิดโรงเรือน #{buildingOpeningId}
        </Typography>
      </Box>

      {loading ? (
        <Box sx={{ ...panelSx, p: 2 }}>
          <Typography variant="body2" sx={{ color: UI.muted }}>
            กำลังโหลดข้อมูล...
          </Typography>
        </Box>
      ) : null}
      {!loading && errorMessage ? <EmptyState title="โหลดข้อมูลไม่สำเร็จ" message={errorMessage} /> : null}

      {!loading && !errorMessage && data ? (
        <>
          <Box sx={{ ...panelSx, p: 2, background: `linear-gradient(135deg, ${alpha(UI.accentSoft, 0.18)} 0%, ${UI.panel} 48%)`, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', minWidth: 0 }}>
              <Box sx={{ display: 'grid', gap: 0.7, minWidth: 0 }}>
                <Typography sx={{ fontSize: '1.55rem', fontWeight: 900, color: UI.text, lineHeight: 1.1 }}>
                  {data.house.houseName || data.house.houseCode}
                </Typography>
                <Typography sx={{ color: UI.muted, display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <LocationOnOutlined sx={{ fontSize: 16 }} />
                  {data.house.facilityCode} - {data.house.facilityName}
                </Typography>
                <Typography sx={{ color: UI.muted, display: 'flex', alignItems: 'center', gap: 0.6 }}>
                  <PersonOutline sx={{ fontSize: 16 }} />
                  เอกสาร: {data.house.documentNumber || '-'} | Batch: {data.house.batchNo || '-'}
                </Typography>
              </Box>
              <Box sx={{ display: 'grid', gap: 0.75, justifyItems: 'end' }}>
                <Chip
                  label={STATUS_TEXT[data.house.status] ?? data.house.status ?? '-'}
                  sx={{
                    bgcolor: data.house.status === 'Completed' ? alpha('#15803D', 0.08) : alpha(UI.accent, 0.08),
                    color: data.house.status === 'Completed' ? '#15803D' : UI.accent,
                    fontWeight: 800,
                    border: `1px solid ${data.house.status === 'Completed' ? alpha('#15803D', 0.18) : UI.borderStrong}`,
                  }}
                />
                <Typography sx={{ fontSize: '0.85rem', color: UI.muted }}>
                  โซน {data.house.zone || '-'} | รุ่น {data.house.generation || '-'}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(3, minmax(0, 1fr))', xl: 'repeat(4, minmax(0, 1fr))' }, gap: 1.25, minWidth: 0 }}>
            {cards.map((card) => (
              <Box
                key={card.label}
                sx={{
                  ...panelSx,
                  p: 1.5,
                  background: `linear-gradient(135deg, ${alpha(UI.accentSoft, 0.18)} 0%, ${UI.panel} 52%)`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 0.8 }}>
                  <Typography sx={{ fontSize: '0.82rem', color: UI.muted, fontWeight: 700 }}>{card.label}</Typography>
                  <Box sx={{ color: card.color }}>{card.icon}</Box>
                </Box>
                <Typography sx={{ fontWeight: 900, fontSize: '1.2rem', lineHeight: 1.1, color: card.color }}>{card.value}</Typography>
              </Box>
            ))}
          </Box>

          <Box sx={{ ...panelSx, p: 2, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.5, flexWrap: 'wrap', minWidth: 0 }}>
              <Typography sx={{ fontWeight: 900, color: UI.text, fontSize: '1.18rem' }}>
                {tableMode === 'feeding'
                  ? 'ตารางการกิน (การให้อาหารจริงจาก Daily Activity)'
                  : 'ตารางสรุปรายวัน (ตาม sheet รายโรงเรือน)'}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', minWidth: 0 }}>
                <Button
                  size="small"
                  variant={tableMode === 'feeding' ? 'contained' : 'outlined'}
                  onClick={() => setTableMode('feeding')}
                  sx={{
                    borderRadius: 2,
                    boxShadow: UI.shadowSoft,
                    ...(tableMode === 'feeding'
                      ? { bgcolor: UI.accent, '&:hover': { bgcolor: '#154e46' } }
                      : { borderColor: '#b8c5bf', color: UI.text, '&:hover': { borderColor: UI.accent, bgcolor: alpha(UI.accent, 0.06) } }),
                  }}
                >
                  ตารางการกิน
                </Button>
                <Button
                  size="small"
                  variant={tableMode === 'daily' ? 'contained' : 'outlined'}
                  onClick={() => setTableMode('daily')}
                  sx={{
                    borderRadius: 2,
                    boxShadow: UI.shadowSoft,
                    ...(tableMode === 'daily'
                      ? { bgcolor: UI.accent, '&:hover': { bgcolor: '#154e46' } }
                      : { borderColor: '#b8c5bf', color: UI.text, '&:hover': { borderColor: UI.accent, bgcolor: alpha(UI.accent, 0.06) } }),
                  }}
                >
                  สรุปรายวัน
                </Button>
              </Box>
            </Box>

            {data.dailyRows.length === 0 ? (
              <EmptyState title="ยังไม่มีข้อมูลรายวัน" message="ไม่พบข้อมูล feeding/fact สำหรับโรงเรือนนี้" />
            ) : tableMode === 'feeding' ? (
              <TableContainer sx={{ maxHeight: 560, overflow: 'auto', border: `1px solid ${UI.border}`, borderRadius: 3, boxShadow: UI.shadowSoft, bgcolor: UI.panelSoft, maxWidth: '100%' }}>
                <Table size="small" stickyHeader sx={{ minWidth: 1280 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        rowSpan={2}
                        align="center"
                        sx={{
                          bgcolor: '#e2e8f0',
                          border: `1px solid ${UI.border}`,
                          fontWeight: 900,
                          minWidth: 110,
                          height: FEED_HEADER_ROW1_HEIGHT,
                          py: 0,
                          position: 'sticky',
                          top: FEED_HEADER_TOP.first,
                          zIndex: 5,
                        }}
                      >
                        วัน
                      </TableCell>
                      {feedingTable.feedCodes.map((code) => (
                        <TableCell
                          key={`head-${code}`}
                          colSpan={2}
                          align="center"
                          sx={{
                            bgcolor: FEED_COLORS[code] ?? '#f3f4f6',
                            border: `1px solid ${UI.border}`,
                            fontWeight: 900,
                            height: FEED_HEADER_ROW1_HEIGHT,
                            py: 0,
                            position: 'sticky',
                            top: FEED_HEADER_TOP.first,
                            zIndex: 4,
                          }}
                        >
                          {code}
                        </TableCell>
                      ))}
                    </TableRow>
                    <TableRow>
                      {feedingTable.feedCodes.map((code) => (
                        <Fragment key={`sub-${code}`}>
                          <TableCell
                            key={`sub-feed-${code}`}
                            align="center"
                            sx={{
                              bgcolor: FEED_COLORS[code] ?? '#f3f4f6',
                              border: `1px solid ${UI.border}`,
                              fontWeight: 800,
                              position: 'sticky',
                              top: FEED_HEADER_TOP.second,
                              zIndex: 4,
                            }}
                          >
                            feed no.
                          </TableCell>
                          <TableCell
                            key={`sub-qty-${code}`}
                            align="center"
                            sx={{
                              bgcolor: FEED_COLORS[code] ?? '#f3f4f6',
                              border: `1px solid ${UI.border}`,
                              fontWeight: 800,
                              position: 'sticky',
                              top: FEED_HEADER_TOP.second,
                              zIndex: 4,
                            }}
                          >
                            เบิกใช้ (kg)
                          </TableCell>
                        </Fragment>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {feedingTable.days.map((day, dayIndex) => (
                      <TableRow key={`feeding-row-${day}`}>
                        <TableCell sx={{ border: `1px dotted ${UI.borderStrong}`, bgcolor: '#f8fafc', fontWeight: 700 }}>
                          {dayIndex + 1}
                        </TableCell>
                        {feedingTable.feedCodes.map((code) => {
                          const row = feedingTable.dayRows.get(day)?.[code];
                          return (
                            <Fragment key={`cell-${code}-${day}`}>
                              <TableCell
                                key={`cell-feed-${code}-${day}`}
                                sx={{ border: `1px dotted ${UI.borderStrong}`, bgcolor: FEED_COLORS[code] ?? '#fff' }}
                              >
                                {code}
                              </TableCell>
                              <TableCell
                                key={`cell-qty-${code}-${day}`}
                                align="right"
                                sx={{ border: `1px dotted ${UI.borderStrong}`, bgcolor: FEED_COLORS[code] ?? '#fff' }}
                              >
                                {row ? fmt(row.qty, 2) : ''}
                              </TableCell>
                            </Fragment>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <TableContainer sx={{ maxHeight: 560, overflow: 'auto', border: `1px solid ${UI.border}`, borderRadius: 3, boxShadow: UI.shadowSoft, bgcolor: UI.panelSoft, maxWidth: '100%' }}>
                <Table size="small" stickyHeader sx={{ minWidth: 1120 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>วันที่</TableCell>
                      <TableCell>Feed</TableCell>
                      <TableCell align="right">Stock</TableCell>
                      <TableCell align="right">Target (kg)</TableCell>
                      <TableCell align="right">Actual (kg)</TableCell>
                      <TableCell align="right">Inbound (kg)</TableCell>
                      <TableCell align="right">BO (kg)</TableCell>
                      <TableCell align="right">Balance (kg)</TableCell>
                      <TableCell align="right">Actual/Head</TableCell>
                      <TableCell align="right">Diff/Head</TableCell>
                      <TableCell align="right">Diff %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.dailyRows.map((row, idx) => (
                      <TableRow key={`${row.factDate}-${row.feedCode}-${idx}`}>
                        <TableCell>{row.factDate?.slice(0, 10) || '-'}</TableCell>
                        <TableCell>{row.feedCode || '-'}</TableCell>
                        <TableCell align="right">{fmt(row.stockHead, 0)}</TableCell>
                        <TableCell align="right">{fmt(row.targetKg, 3)}</TableCell>
                        <TableCell align="right">{fmt(row.actualKg, 3)}</TableCell>
                        <TableCell align="right">{fmt(row.inboundKg, 3)}</TableCell>
                        <TableCell align="right">{fmt(row.boKg, 3)}</TableCell>
                        <TableCell align="right">{fmt(row.balanceKg, 3)}</TableCell>
                        <TableCell align="right">{fmt(row.actualPerHeadKg, 6)}</TableCell>
                        <TableCell align="right">{fmt(row.diffPerHeadKg, 6)}</TableCell>
                        <TableCell align="right">{fmt(row.diffPercent, 4)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>

          <Box sx={{ ...panelSx, p: 2, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, mb: 1.5, flexWrap: 'wrap', minWidth: 0 }}>
              <Typography sx={{ fontWeight: 900, color: UI.text, fontSize: '1.18rem' }}>รายการบันทึก Activity Daily</Typography>
              <Typography sx={{ fontSize: '0.85rem', color: UI.muted }}>
                ตรวจสอบการบันทึกแต่ละหัวข้อของโรงเรือนนี้
              </Typography>
            </Box>

            {(data.activityDailyRows?.length ?? 0) === 0 ? (
              <EmptyState title="ยังไม่มีรายการบันทึก Activity Daily" message="ยังไม่พบบันทึกรายวันสำหรับโรงเรือนนี้" />
            ) : (
              <TableContainer sx={{ maxHeight: 420, overflow: 'auto', border: `1px solid ${UI.border}`, borderRadius: 3, boxShadow: UI.shadowSoft, bgcolor: UI.panelSoft, maxWidth: '100%' }}>
                <Table size="small" stickyHeader sx={{ minWidth: 980 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>วันที่</TableCell>
                      <TableCell>เลขที่เอกสาร</TableCell>
                      <TableCell>หัวข้อ</TableCell>
                      <TableCell>สถานะ</TableCell>
                      <TableCell>โซน</TableCell>
                      <TableCell>โรงเรือน</TableCell>
                      <TableCell align="right">จำนวนรายการ</TableCell>
                      <TableCell>หมายเหตุ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.activityDailyRows.map((row) => (
                      <TableRow key={row.headerId}>
                        <TableCell>{row.entryDate?.slice(0, 10) || '-'}</TableCell>
                        <TableCell>{row.docNo || '-'}</TableCell>
                        <TableCell>{ACTIVITY_TYPE_LABEL[(row.documentType || '').toLowerCase()] || row.documentType || '-'}</TableCell>
                        <TableCell>{row.status || '-'}</TableCell>
                        <TableCell>{row.selectedGroup || '-'}</TableCell>
                        <TableCell>{row.selectedHouse || '-'}</TableCell>
                        <TableCell align="right">{fmt(row.recordCount, 0)}</TableCell>
                        <TableCell>{row.remark || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </>
      ) : null}
    </Box>
  );
}
