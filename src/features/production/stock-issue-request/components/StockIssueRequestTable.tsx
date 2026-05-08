'use client';

import { useMemo } from 'react';
import {
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
import { formatDateShort } from '@/lib/utils/date.util';
import { getWorkflowStatusType, toThaiWorkflowStatus } from '@/lib/utils/status.util';
import { StatusBadge } from '@/design-system';
import { PR_MAIN_TABLE_HEIGHT } from '@/core/ui-patterns/pr-ui.constants';
import type { StockIssueRequestResponse } from '../types/stock-issue-request.types';

interface StockIssueRequestTableProps {
  rows: StockIssueRequestResponse[];
  loading: boolean;
  page: number;
  rowsPerPage: number;
  onPageChange: (_event: unknown, newPage: number) => void;
  onRowsPerPageChange: (newRowsPerPage: number) => void;
  onRowDoubleClick: (row: StockIssueRequestResponse) => void;
}

const TABLE_COLUMN_WIDTHS = ['5%', '13%', '10%', '12%', '16%', '13%', '13%', '10%', '8%'] as const;

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

export function StockIssueRequestTable({
  rows,
  loading,
  page,
  rowsPerPage,
  onPageChange,
  onRowsPerPageChange,
  onRowDoubleClick,
}: StockIssueRequestTableProps) {
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
              <col key={`sir-col-${index}`} style={{ width }} />
            ))}
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>เลขที่ใบขอ</TableCell>
              <TableCell>วันที่ขอ</TableCell>
              <TableCell>ผู้ขอ</TableCell>
              <TableCell>คลังต้นทาง</TableCell>
              <TableCell>PR ต้นทาง</TableCell>
              <TableCell>ฟาร์มปลายทาง</TableCell>
              <TableCell>โรงเรือน</TableCell>
              <TableCell>สถานะ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  ยังไม่มีใบขอตัดสต๊อก
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
                      {formatDateShort(row.requestDate)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      {row.requestorName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      {row.facilityName}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {row.sourcePurchaseRequestNumber || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2">
                      {row.usageZone || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {row.usageHouseName || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <StatusBadge
                      label={toThaiWorkflowStatus(row.status)}
                      type={getWorkflowStatusType(row.status)}
                      size="small"
                    />
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
