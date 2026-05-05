'use client';

import { useMemo } from 'react';
import { Chip, Typography } from '@mui/material';
import { DocumentStatus } from '@/types/status.types';
import { getWorkflowStatusChipSx, toThaiWorkflowStatus } from '@/lib/utils/status.util';
import { JBFarmTable, JBFarmTableColumn } from '@/components/common';

export type StockReplenishmentRequest = {
  id: string;
  requestNo: string;
  sourceFacilityName: string;
  targetFacilityName: string;
  requestDate: string;
  requiredByDate?: string;
  urgency: 'normal' | 'important' | 'critical';
  status: DocumentStatus;
  lines: Array<{ itemCode: string; itemName: string }>;
  linkedPurchaseRequestNumber?: string;
};

interface Props {
  rows: StockReplenishmentRequest[];
  variant: 'farm' | 'central';
  page: number;
  rowsPerPage: number;
  selectedRequestId: string;
  onSelectedRequestIdChange: (value: string) => void;
  onPageChange: (value: number) => void;
  onRowsPerPageChange: (value: number) => void;
}

const urgencyCopy: Record<'normal' | 'important' | 'critical', { label: string }> = {
  normal: { label: 'ปกติ' },
  important: { label: 'ด่วน' },
  critical: { label: 'เร่งด่วน' },
};

export default function StockReplenishmentRequestTable({
  rows,
  variant,
  page,
  rowsPerPage,
  selectedRequestId,
  onSelectedRequestIdChange,
  onPageChange,
  onRowsPerPageChange,
}: Props) {
  const columns = useMemo<JBFarmTableColumn<StockReplenishmentRequest>[]>(() => [
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
      id: 'requestNo',
      label: 'เลขที่ใบแจ้ง',
      width: 135,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 900, color: 'primary.main', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {row.requestNo}
        </Typography>
      ),
    },
    {
      id: 'requestDate',
      label: 'วันที่แจ้ง',
      width: 110,
      render: (row) => <Typography variant="body2">{row.requestDate}</Typography>,
    },
    {
      id: 'requiredByDate',
      label: 'ต้องการภายใน',
      width: 110,
      render: (row) => <Typography variant="body2">{row.requiredByDate ?? '-'}</Typography>,
    },
    {
      id: 'facility',
      label: variant === 'central' ? 'ฟาร์มผู้ส่ง' : 'ส่งไปที่',
      width: 220,
      render: (row) => (
        <Typography variant="body2" sx={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {variant === 'central' ? row.sourceFacilityName : row.targetFacilityName}
        </Typography>
      ),
    },
    {
      id: 'lines',
      label: 'รายการ',
      width: 75,
      render: (row) => <Typography variant="body2" sx={{ fontWeight: 800 }}>{row.lines.length}</Typography>,
    },
    {
      id: 'urgency',
      label: 'ความเร่งด่วน',
      width: 110,
      render: (row) => <Chip label={urgencyCopy[row.urgency].label} size="small" variant="outlined" />,
    },
    {
      id: 'status',
      label: 'สถานะ',
      width: 125,
      render: (row) => (
        <Chip 
          label={toThaiWorkflowStatus(row.status)} 
          sx={getWorkflowStatusChipSx(row.status)} 
          size="small" 
        />
      ),
    },
    {
      id: 'linkedPr',
      label: 'ใบขอซื้อ (PR)',
      width: 140,
      render: (row) => row.linkedPurchaseRequestNumber ? (
        <Typography variant="body2" sx={{ fontWeight: 900, color: 'success.main' }}>
          {row.linkedPurchaseRequestNumber}
        </Typography>
      ) : (
        <Typography variant="body2" color="text.disabled">-</Typography>
      ),
    },
  ], [page, rowsPerPage, variant]);

  return (
    <JBFarmTable
      columns={columns}
      rows={rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)}
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={rows.length}
      getRowId={(row) => row.id}
      selectedRowId={selectedRequestId}
      onPageChange={onPageChange}
      onRowsPerPageChange={onRowsPerPageChange}
      onRowDoubleClick={(row) => onSelectedRequestIdChange(row.id)}
      emptyMessage="ไม่พบข้อมูลคำขอเติมสต็อกกลาง"
      paginationLabel="รวมทั้งหมด"
    />
  );
}
