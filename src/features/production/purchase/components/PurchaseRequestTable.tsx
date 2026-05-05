'use client';

import { useMemo, ChangeEvent } from 'react';
import { Chip, Typography } from '@mui/material';
import { formatDateShort } from '@/lib/utils/date.util';
import { getWorkflowStatusChipSx, toThaiWorkflowStatus } from '@/lib/utils/status.util';
import { URGENCY_LABELS_THAI } from '@/lib/constants/status-labels';
import type { PurchaseRequestResponse } from '../types';
import { JBFarmTable, JBFarmTableColumn } from '@/components/common';

interface PurchaseRequestTableProps {
  rows: PurchaseRequestResponse[];
  loading?: boolean;
  page: number;
  rowsPerPage: number;
  onPageChange: (_event: unknown, newPage: number) => void;
  onRowsPerPageChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onRowDoubleClick: (request: PurchaseRequestResponse) => void;
}

const urgencyChipMap: Record<string, { label: string; color: 'default' | 'warning' | 'error' }> = {
  Normal: { label: URGENCY_LABELS_THAI['Normal'], color: 'default' },
  High: { label: URGENCY_LABELS_THAI['High'], color: 'warning' },
  Urgent: { label: URGENCY_LABELS_THAI['Urgent'], color: 'error' },
};

export function PurchaseRequestTable({
  rows,
  loading = false,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onRowDoubleClick,
}: PurchaseRequestTableProps) {
  const columns = useMemo<JBFarmTableColumn<PurchaseRequestResponse>[]>(() => [
    {
      id: 'no',
      label: '#',
      width: 40,
      render: (_, index) => (
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
          {page * rowsPerPage + index + 1}
        </Typography>
      ),
    },
    {
      id: 'documentNumber',
      label: 'เลขที่ใบขอซื้อ',
      width: 135,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 900, color: 'primary.main' }}>
          {row.documentNumber}
        </Typography>
      ),
    },
    {
      id: 'requestDate',
      label: 'วันที่ขอซื้อ',
      width: 100,
      render: (row) => (
        <Typography variant="body2">
          {formatDateShort(row.requestDate)}
        </Typography>
      ),
    },
    {
      id: 'requestorName',
      label: 'ผู้ขอ',
      width: 165,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          {row.requestorName}
        </Typography>
      ),
    },
    {
      id: 'items',
      label: 'รายการ',
      width: 70,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 800 }}>
          {row.lines.length.toLocaleString()}
        </Typography>
      ),
    },
    {
      id: 'urgency',
      label: 'ความเร่งด่วน',
      width: 95,
      render: (row) => (
        <Chip
          label={urgencyChipMap[row.urgency]?.label ?? row.urgency}
          color={urgencyChipMap[row.urgency]?.color ?? 'default'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      id: 'status',
      label: 'สถานะ',
      width: 115,
      render: (row) => (
        <Chip
          label={toThaiWorkflowStatus(row.status)}
          sx={getWorkflowStatusChipSx(row.status)}
          size="small"
        />
      ),
    },
  ], [page, rowsPerPage]);

  return (
    <JBFarmTable
      columns={columns}
      rows={rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)}
      loading={loading}
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={rows.length}
      getRowId={(row) => row.id}
      onPageChange={(newPage) => onPageChange(null, newPage)}
      onRowsPerPageChange={(newRowsPerPage) => {
        const fakeEvent = { target: { value: newRowsPerPage.toString() } } as ChangeEvent<HTMLInputElement>;
        onRowsPerPageChange(fakeEvent);
      }}
      onRowDoubleClick={onRowDoubleClick}
      minWidth={750}
      emptyMessage="ไม่พบข้อมูลใบขอซื้อ"
    />
  );
}
