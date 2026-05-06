'use client';

import {
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { StockIssueRequestResponse } from '@/features/production/stock-issue-request/types/stock-issue-request.types';
import { formatDateShort } from '@/lib/utils/date.util';
import { toThaiWorkflowStatus, getWorkflowStatusType } from '@/lib/utils/status.util';
import { StatusBadge } from '@/design-system';
import { StockActionButton } from './StockActionButton';

type Props = {
  rows: StockIssueRequestResponse[];
  loading?: boolean;
  onView: (row: StockIssueRequestResponse) => void;
};

export function PendingIssueRequestList({ rows, loading = false, onView }: Props) {
  return (
    <Paper
      sx={{
        borderRadius: '18px',
        overflow: 'hidden',
        boxShadow: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
      }}
    >
      <TableContainer sx={{ maxHeight: 360, overflowY: 'auto', overflowX: 'auto', scrollbarGutter: 'stable' }}>
        <Table size="small" stickyHeader sx={{
          minWidth: 1320,
          tableLayout: 'fixed',
            '& .MuiTableCell-head': {
              bgcolor: (t: any) => alpha(t.palette.primary.main, 0.06),
              color: 'text.primary',
              fontWeight: 800,
            textAlign: 'center',
            verticalAlign: 'middle',
            borderBottom: '1px solid',
            borderBottomColor: 'divider',
            borderRight: '1px solid',
            borderRightColor: 'divider',
            '&:last-of-type': { borderRight: 'none' },
          },
          '& .MuiTableBody-root .MuiTableCell-root': {
            py: 1,
            verticalAlign: 'middle',
            borderBottom: '1px solid',
            borderBottomColor: 'divider',
            color: 'text.primary',
          },
          '& .MuiTableBody-root .MuiTableRow-root:hover': { bgcolor: (t: any) => alpha(t.palette.primary.main, 0.04) },
        }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 150 }}>เลขที่ใบขอ</TableCell>
              <TableCell sx={{ width: 170 }}>ตัดจากคลัง</TableCell>
              <TableCell sx={{ width: 170 }}>คลังต้นทาง</TableCell>
              <TableCell sx={{ width: 170 }}>ฟาร์มปลายทาง</TableCell>
              <TableCell sx={{ width: 140 }}>โรงเรือน</TableCell>
              <TableCell sx={{ width: 140 }}>ผู้ขอ</TableCell>
              <TableCell sx={{ width: 300 }}>รายการ</TableCell>
              <TableCell align="center" sx={{ width: 120 }}>สถานะ</TableCell>
              <TableCell align="center" sx={{ width: 110 }}>วันที่ขอ</TableCell>
              <TableCell align="center" sx={{ width: 100 }}>จัดการ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                  กำลังโหลดรายการรอตัดสต๊อก...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 6 }}>
                  ยังไม่มีรายการรอยืนยันตัดสต๊อก
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const firstLine = row.lines[0];

                return (
                  <TableRow key={row.id} hover>
                    <TableCell sx={{ minWidth: 140 }}>
                      <Typography variant="body2" fontWeight={700}>
                        {row.documentNumber}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 160 }}>
                      {firstLine?.warehouseName ?? '-'}
                    </TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{row.facilityName}</TableCell>
                    <TableCell sx={{ minWidth: 160 }}>{row.usageZone || '-'}</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>{row.usageHouseName || '-'}</TableCell>
                    <TableCell sx={{ minWidth: 140 }}>{row.requestorName}</TableCell>
                    <TableCell sx={{ minWidth: 260 }}>
                      <Stack spacing={0.5}>
                        {row.lines.map((line) => (
                          <Typography key={line.id} variant="body2">
                            {line.itemName} {line.requestedQuantity} {line.uomName}
                          </Typography>
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell align="center" sx={{ minWidth: 120 }}>
                      <StatusBadge size="small" label={toThaiWorkflowStatus(row.status)} type={getWorkflowStatusType(row.status)} />
                    </TableCell>
                    <TableCell align="center" sx={{ minWidth: 110 }}>{formatDateShort(row.requestDate)}</TableCell>
                    <TableCell align="center" sx={{ minWidth: 100 }}>
                      <StockActionButton tone="info" size="small" shape="pill" onClick={() => onView(row)}>
                        รายละเอียด
                      </StockActionButton>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
