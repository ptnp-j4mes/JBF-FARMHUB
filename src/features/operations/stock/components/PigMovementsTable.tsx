'use client';

import { useCallback, useEffect, useState } from 'react';
import { Box, Chip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import dayjs from '@/lib/dayjs';
import { formatNumber } from '@/lib/utils/format.util';
import { DataTable, type Column } from '@/components/common';
import { PR_MAIN_TABLE_BOTTOM_PADDING, PR_MAIN_TABLE_HEIGHT } from '@/core/ui-patterns/pr-ui.constants';
import { pigTransactionsService } from '../services/pig-transactions.service';
import type { PigMovementRow } from '../types/pig-transactions.types';
import { FACILITY_CHANGED_EVENT, getCurrentFacilityCode } from '@/lib/facility-context';

const UI = {
  panel: '#ffffff',
  panelSoft: '#f8faf8',
  panelMuted: '#f2f6f3',
  border: '#dde2de',
  text: '#2f3a37',
  muted: '#7d8783',
  accent: 'rgb(22, 90, 80)',
  accentSurface: '#edf5f1',
  shadow: '0 18px 40px rgba(22, 35, 31, 0.08), 0 3px 10px rgba(22, 35, 31, 0.05)',
  shadowSoft: '0 10px 24px rgba(22, 35, 31, 0.06), 0 2px 6px rgba(22, 35, 31, 0.04)',
};

type PigMovementsTableProps = {
  onRowDoubleClick?: (row: PigMovementRow) => void;
};

export function PigMovementsTable({ onRowDoubleClick }: PigMovementsTableProps) {
  const [rows, setRows] = useState<PigMovementRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const facilityCode = getCurrentFacilityCode() ?? undefined;
      const response = await pigTransactionsService.getLatestMovements(page + 1, pageSize, facilityCode);
      setRows(response.data ?? []);
      setTotalCount(response.totalCount ?? 0);
    } catch {
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const onFacilityChanged = () => {
      setPage(0);
      void loadData();
    };
    window.addEventListener(FACILITY_CHANGED_EVENT, onFacilityChanged);
    return () => window.removeEventListener(FACILITY_CHANGED_EVENT, onFacilityChanged);
  }, [loadData]);


  const columns: Column<PigMovementRow>[] = [
    {
      id: 'transactionDate',
      label: 'วันที่/เวลา',
      align: 'center',
      minWidth: 132,
      width: 132,
      format: (value) => dayjs(String(value)).format('DD/MM/YYYY HH:mm'),
    },
    { id: 'batchNo', label: 'รุ่น', align: 'center', minWidth: 108, width: 108 },
    {
      id: 'transactionType',
      label: 'ประเภทรายการ',
      align: 'center',
      minWidth: 112,
      width: 112,
      format: (value) => {
        const type = String(value);
        let color = '#4a6982';
        if (type === 'รับเข้า') color = '#2e7d32';
        else if (type === 'ย้าย') color = '#ed6c02';
        else if (type === 'ส่งออก') color = '#7c5ce5';
        else if (type === 'ตาย' || type === 'คัดทิ้ง') color = '#d32f2f';

        return (
          <Chip
            label={type}
            size="small"
            sx={{
              bgcolor: alpha(color, 0.12),
              color,
              fontWeight: 800,
              minWidth: 76,
            }}
          />
        );
      }
    },
    { id: 'houseName', label: 'โรงเรือน', align: 'center', minWidth: 170, width: 170 },
    {
      id: 'quantity',
      label: 'จำนวน (ตัว)',
      align: 'right',
      minWidth: 102,
      width: 102,
      format: (value) => formatNumber(Number(value ?? 0)),
    },
    { id: 'detail', label: 'รายละเอียด', align: 'center', minWidth: 210, width: 210 },
  ];

  return (
    <Box
      sx={{
        p: 1.5,
        borderRadius: 10,
        border: `1px solid ${UI.border}`,
        bgcolor: UI.panel,
        boxShadow: UI.shadow,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap', mb: 1.1 }}>
        <Box>
          <Typography sx={{ fontSize: '1.08rem', fontWeight: 900, color: UI.text, mb: 0.45 }}>
            ประวัติการเคลื่อนไหวล่าสุด
          </Typography>
          <Typography sx={{ fontSize: '0.88rem', color: UI.muted }}>
            แสดงการรับเข้า ย้าย ส่งออก และการเปลี่ยนแปลงสต๊อกย้อนหลังตามฟาร์มที่เลือกอยู่
          </Typography>
        </Box>
        <Chip
          label={`${formatNumber(totalCount)} รายการ`}
          sx={{ bgcolor: UI.accentSurface, color: UI.accent, fontWeight: 800 }}
        />
      </Box>
      <Typography variant="caption" color="red" sx={{ display: 'block', mb: 1, textAlign: 'right' }}>
        *ดับเบิลคลิกที่แถวเพื่อดูรายละเอียดเพิ่มเติม
      </Typography>
      <DataTable
        columns={columns}
        data={rows}
        loading={loading}
        emptyMessage="ไม่พบประวัติการเคลื่อนไหว"
        includeManagementColumn={false}
        page={page}
        rowsPerPage={pageSize}
        totalCount={totalCount}
        onPageChange={setPage}
        onRowsPerPageChange={(nextRowsPerPage) => {
          setPageSize(nextRowsPerPage);
          setPage(0);
        }}
        stickyHeader
        paperSx={{
          borderRadius: 10,
          border: `1px solid ${UI.border}`,
          boxShadow: UI.shadow,
          bgcolor: UI.panelSoft,
          height: PR_MAIN_TABLE_HEIGHT,
          pb: `${PR_MAIN_TABLE_BOTTOM_PADDING}px`,
        }}
        tableContainerSx={{
          overflowX: 'auto',
          overflowY: 'auto',
          scrollbarGutter: 'stable',
        }}
        headerCellSx={{
          bgcolor: `${UI.panelMuted} !important`,
          color: '#4a5451 !important',
          fontWeight: 800,
          fontSize: '15px',
          py: 0,
          textAlign: 'center !important',
          verticalAlign: 'middle',
          borderBottom: `1px solid ${UI.border}`,
        }}
        tableSx={{
          '& .MuiTable-root': {
            minWidth: { xs: 836, md: 836 },
            tableLayout: 'fixed',
          },
          '& .MuiTableBody-root .MuiTableCell-root': {
            py: 1.05,
            verticalAlign: 'middle',
            whiteSpace: 'normal',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            borderBottom: `1px solid ${UI.border}`,
            color: UI.text,
          },
          '& .MuiTableHead-root .MuiTableCell-root': {
            whiteSpace: 'nowrap',
            overflowWrap: 'normal',
            wordBreak: 'normal',
          },
          '& .MuiTableBody-root .MuiTableRow-root:hover': {
            bgcolor: '#f1f5f2',
          },
        }}
        onRowDoubleClick={onRowDoubleClick}
      />
    </Box>
  );
}
