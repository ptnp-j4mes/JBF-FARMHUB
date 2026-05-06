'use client';

import { Chip, Typography } from '@mui/material';
import { DataTable, type Column } from '@/components/common';
import type { BuildingOpeningResponse } from '../types';
import { formatDateShort } from '@/lib/utils/date.util';
import { getWorkflowStatusChipSx, toThaiWorkflowStatus } from '@/lib/utils/status.util';
import { PR_MAIN_TABLE_BOTTOM_PADDING, PR_MAIN_TABLE_HEIGHT } from '@/core/ui-patterns/pr-ui.constants';
import { buildingOpeningTableShellSx } from './BuildingOpeningWorkspaceChrome';

type BuildingOpeningListProps = {
  data: BuildingOpeningResponse[];
  loading?: boolean;
  emptyMessage?: string;
  onView: (row: BuildingOpeningResponse) => void;
};

export function BuildingOpeningList({ data, loading, emptyMessage, onView }: BuildingOpeningListProps) {
  const columns: Column<BuildingOpeningResponse>[] = [
    {
      id: 'documentNumber',
      label: 'เลขที่เอกสาร',
      align: 'left',
      minWidth: 100,
      format: (value) => (
        <Typography variant="body2" fontWeight="medium" textAlign="left">
          {value as React.ReactNode}
        </Typography>
      ),
    },
    {
      id: 'requestDate',
      label: 'วันที่เปิด',
      align: 'center',
      minWidth: 120,
      format: (value) => formatDateShort(value as string),
    },
    {
      id: 'houseName',
      label: 'โรงเรือน',
      align: 'left',
      minWidth: 200,
      format: (value) => (
        <Typography
          variant="body2"
          noWrap
          title={String(value ?? '')}
          sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {String(value ?? '')}
        </Typography>
      ),
    },
    {
      id: 'quantity',
      label: 'จำนวน',
      align: 'right',
      minWidth: 80,
      format: (value) => Number(value ?? 0).toLocaleString(),
    },
    {
      id: 'actualReceivedQuantity',
      label: 'รับเข้าจริง',
      align: 'right',
      minWidth: 80,
      format: (value) => Number(value ?? 0).toLocaleString(),
    },
    {
      id: 'checklistProgress',
      label: 'Checklist',
      align: 'center',
      minWidth: 80,
      sortAccessor: (row) => row.checklistTotal ? row.checklistCompleted / row.checklistTotal : 0,
      format: (_, row) => `${row.checklistCompleted}/${row.checklistTotal}`,
    },
    {
      id: 'status',
      label: 'สถานะ',
      align: 'center',
      minWidth: 120,
      width: 120,
      format: (value) => (
        <Chip label={toThaiWorkflowStatus(String(value ?? ''))} size="small" sx={getWorkflowStatusChipSx(String(value ?? ''))} />
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={data}
      loading={loading}
      emptyMessage={emptyMessage || 'ยังไม่มีรายการเปิดโรงเรือน'}
      onRowDoubleClick={onView}
      enforceEntityColumns={false}
      includeManagementColumn={false}
      statusColumnWidth={120}
      paperSx={{
        ...buildingOpeningTableShellSx,
        height: PR_MAIN_TABLE_HEIGHT,
        pb: `${PR_MAIN_TABLE_BOTTOM_PADDING}px`,
      }}
      tableContainerSx={{
        overflowX: 'auto',
        overflowY: 'auto',
        scrollbarGutter: 'stable',
      }}
      stickyHeader
      headerCellSx={{
        bgcolor: 'background.paper !important',
        color: 'text.primary !important',
        fontWeight: 800,
        fontSize: '15px',
        py: 0,
        textAlign: 'center !important',
        verticalAlign: 'middle',
        borderBottom: '1px solid',
        borderColor: 'divider',
        whiteSpace: 'nowrap',
        wordBreak: 'keep-all',
        overflowWrap: 'normal',
        lineHeight: 1.25,
      }}
      tableSx={{
        '& .MuiTable-root': {
          minWidth: { xs: 920, md: 920 },
          tableLayout: 'fixed',
        },
        '& .MuiTableBody-root .MuiTableCell-root': {
          whiteSpace: 'normal',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          py: 1.05,
          verticalAlign: 'middle',
          borderBottom: '1px solid',
          borderColor: 'divider',
          color: 'text.primary',
        },
        '& .MuiTableHead-root .MuiTableCell-root': {
          whiteSpace: 'nowrap',
          overflowWrap: 'normal',
          wordBreak: 'normal',
        },
      }}
    />
  );
}
