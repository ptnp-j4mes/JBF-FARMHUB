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
import { DocumentStatus } from '@/types/status.types';
import { toThaiWorkflowStatus, getWorkflowStatusType } from '@/lib/utils/status.util';
import { StatusBadge } from '@/design-system';
import { PR_MAIN_TABLE_HEIGHT } from '@/core/ui-patterns/pr-ui.constants';

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
  onPageChange: (_event: unknown, newPage: number) => void;
  onRowsPerPageChange: (value: number) => void;
}

const urgencyCopy: Record<'normal' | 'important' | 'critical', { label: string }> = {
  normal: { label: 'ปกติ' },
  important: { label: 'ด่วน' },
  critical: { label: 'เร่งด่วน' },
};

const TABLE_COLUMN_WIDTHS = ['5%', '14%', '11%', '11%', '24%', '8%', '12%', '13%', '14%'] as const;

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

export default function StockReplenishmentRequestTable({
  rows,
  variant,
  page,
  rowsPerPage,
  onSelectedRequestIdChange,
  onPageChange,
}: Props) {
  const paginatedRows = useMemo(
    () => rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [rows, page, rowsPerPage],
  );

  return (
    <Paper
      sx={{
        borderRadius: '18px',
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
              <col key={`sr-col-${index}`} style={{ width }} />
            ))}
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>เลขที่ใบแจ้ง</TableCell>
              <TableCell>วันที่แจ้ง</TableCell>
              <TableCell>ต้องการภายใน</TableCell>
              <TableCell>{variant === 'central' ? 'ฟาร์มผู้ส่ง' : 'ส่งไปที่'}</TableCell>
              <TableCell>รายการ</TableCell>
              <TableCell>ความเร่งด่วน</TableCell>
              <TableCell>สถานะ</TableCell>
              <TableCell>ใบขอซื้อ (PR)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  ไม่พบข้อมูลคำขอเติมสต็อกกลาง
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row, index) => {
                const urgencyType = row.urgency === 'critical' ? 'error' as const : row.urgency === 'important' ? 'warning' as const : 'default' as const;
                return (
                  <TableRow
                    key={row.id}
                    hover
                    onDoubleClick={() => onSelectedRequestIdChange(row.id)}
                  >
                    <TableCell align="center">
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                        {page * rowsPerPage + index + 1}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 900, color: 'primary.main' }}>
                        {row.requestNo}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{row.requestDate}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2">{row.requiredByDate ?? '-'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        {variant === 'central' ? row.sourceFacilityName : row.targetFacilityName}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>
                        {row.lines.length}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <StatusBadge
                        label={urgencyCopy[row.urgency].label}
                        type={urgencyType}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <StatusBadge
                        label={toThaiWorkflowStatus(row.status)}
                        type={getWorkflowStatusType(row.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {row.linkedPurchaseRequestNumber ? (
                        <Typography variant="body2" sx={{ fontWeight: 900, color: 'success.main' }}>
                          {row.linkedPurchaseRequestNumber}
                        </Typography>
                      ) : (
                        <Typography variant="body2" color="text.disabled">-</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
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
        rowsPerPageOptions={[rowsPerPage]}
        labelRowsPerPage=""
        labelDisplayedRows={({ count }) =>
          `ทั้งหมด ${count === -1 ? 0 : count} รายการ`
        }
        sx={paginationSx}
      />
    </Paper>
  );
}
