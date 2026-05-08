'use client';

import { useMemo } from 'react';
import {
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { formatDateTime } from '@/lib/utils/date.util';
import { formatNumber } from '@/lib/utils/format.util';
import { getWorkflowStatusType, toThaiWorkflowStatus } from '@/lib/utils/status.util';
import { StatusBadge } from '@/design-system';
import { PR_MAIN_TABLE_HEIGHT } from '@/core/ui-patterns/pr-ui.constants';
import type { StockAdjustmentRequestResponse } from '@/features/production/stock/types/stock-adjustment-request.types';

interface StockAdjustmentRequestTableProps {
  rows: StockAdjustmentRequestResponse[];
  loading: boolean;
  page: number;
  rowsPerPage: number;
  onPageChange: (_event: unknown, newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  onView: (request: StockAdjustmentRequestResponse) => void;
  onRowDoubleClick: (request: StockAdjustmentRequestResponse) => void;
}

const TABLE_COLUMN_WIDTHS = ['6%', '18%', '14%', '22%', '14%', '14%', '12%'] as const;

const paginationSx = {
  '& .MuiTablePagination-toolbar': {
    px: { xs: 1, sm: 2 },
    minHeight: { xs: 48, sm: 52 },
    flexWrap: { xs: 'wrap', sm: 'nowrap' },
    rowGap: { xs: 0.6, sm: 0 },
    justifyContent: 'flex-end',
  },
  '& .MuiTablePagination-selectLabel, & .MuiTablePagination-input, & .MuiTablePagination-spacer':
    {
      display: 'none',
    },
  '& .MuiTablePagination-displayedRows': {
    m: 0,
  },
} as const;

export function StockAdjustmentRequestTable({
  rows,
  loading,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onView,
  onRowDoubleClick,
}: StockAdjustmentRequestTableProps) {
  const paginatedRows = useMemo(
    () => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [rows, page, rowsPerPage],
  );

  return (
    <Paper
      sx={{
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        height: PR_MAIN_TABLE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <TableContainer
        sx={{
          flex: 1,
          minHeight: 0,
          overflowX: 'auto',
          overflowY: 'auto',
          scrollbarGutter: 'stable',
        }}
      >
        <Table
          size="small"
          stickyHeader
          sx={{
            width: '100%',
            tableLayout: 'fixed',
            '& .MuiTableCell-root': {
              px: { xs: 0.85, sm: 1.6 },
              py: { xs: 1.2, sm: 1.45 },
              verticalAlign: 'middle',
            },
            '& .MuiTableCell-head': {
              bgcolor: 'background.paper',
              backgroundImage: (t) =>
                `linear-gradient(${alpha(t.palette.primary.main, 0.06)}, ${alpha(t.palette.primary.main, 0.06)})`,
              color: 'text.primary',
              fontWeight: 800,
              fontSize: '15px',
              textAlign: 'center',
              verticalAlign: 'middle',
              borderBottom: '1px solid',
              borderColor: 'divider',
              whiteSpace: 'nowrap',
              overflowWrap: 'normal',
              wordBreak: 'normal',
            },
            '& .MuiTableBody-root .MuiTableCell-root': {
              borderBottom: '1px solid',
              borderColor: 'divider',
              color: 'text.primary',
            },
            '& .MuiTableBody-root .MuiTableRow-root:hover': {
              bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
              cursor: 'pointer',
            },
            '& .MuiTableCell-root:first-of-type': {
              pl: { xs: 1.05, sm: 1.8 },
            },
            '& .MuiTableCell-root:last-of-type': {
              pr: { xs: 1.05, sm: 1.8 },
            },
          }}
        >
          <colgroup>
            {TABLE_COLUMN_WIDTHS.map((width, index) => (
              <col key={`sar-col-${index}`} style={{ width }} />
            ))}
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>เลขที่เอกสาร</TableCell>
              <TableCell>วันที่ขอ</TableCell>
              <TableCell>Facility</TableCell>
              <TableCell align="right">มูลค่า Diff</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell align="center">จัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  ยังไม่มีคำขอปรับสต๊อก
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row, index) => (
                <TableRow
                  key={row.id}
                  hover
                  onDoubleClick={() => onRowDoubleClick(row)}
                >
                  <TableCell align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                      {page * rowsPerPage + index + 1}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 900, color: 'primary.main' }}>
                      {row.documentNumber}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {formatDateTime(row.requestDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      {row.facilityName}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2">
                      {formatNumber(row.totalDeltaValue ?? 0, 2)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <StatusBadge
                      label={toThaiWorkflowStatus(row.status)}
                      type={getWorkflowStatusType(row.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Button size="small" variant="outlined" onClick={() => onView(row)}>
                      ดูรายละเอียด
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={rows.length}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={onPageChange}
        onRowsPerPageChange={(event) => onRowsPerPageChange(parseInt(event.target.value, 10))}
        rowsPerPageOptions={[10, 25, 50]}
        labelRowsPerPage=""
        labelDisplayedRows={({ count }) =>
          `ทั้งหมด ${count === -1 ? 0 : count} รายการ`
        }
        sx={paginationSx}
      />
    </Paper>
  );
}
