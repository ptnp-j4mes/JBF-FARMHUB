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
import type { StockTransactionRow } from '../types';
import { formatNumber } from '@/lib/utils/format.util';
import { parseIssueTransactionMeta } from '../utils/issue-history.util';

type IssueTransactionListProps = {
  rows: StockTransactionRow[];
  loading?: boolean;
  onView?: (row: StockTransactionRow) => void;
};

export function IssueTransactionList({
  rows,
  loading = false,
  onView,
}: IssueTransactionListProps) {
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
      <TableContainer sx={{ maxHeight: 420, overflowY: 'auto', overflowX: 'auto', scrollbarGutter: 'stable' }}>
        <Table size="small" stickyHeader sx={{
            minWidth: 1400,
            tableLayout: 'fixed',
            '& .MuiTableCell-head': {
              bgcolor: 'background.paper',
              backgroundImage: (t: any) =>
                `linear-gradient(${alpha(t.palette.primary.main, 0.06)}, ${alpha(t.palette.primary.main, 0.06)})`,
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
              <TableCell sx={{ width: 150 }}>เลขที่เอกสาร</TableCell>
              <TableCell sx={{ width: 130 }}>วันที่</TableCell>
              <TableCell sx={{ width: 280 }}>รายการ</TableCell>
              <TableCell sx={{ width: 150 }}>ตัดจากคลัง</TableCell>
              <TableCell sx={{ width: 170 }}>คลังต้นทาง</TableCell>
              <TableCell sx={{ width: 170 }}>ฟาร์มปลายทาง</TableCell>
              <TableCell sx={{ width: 170 }}>โรงเรือน</TableCell>
              <TableCell sx={{ width: 140 }}>ประเภทปลายทาง</TableCell>
              <TableCell sx={{ width: 170 }}>ผู้ขอ / ผู้รับ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  กำลังโหลดรายการตัดสต๊อก...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                  ยังไม่มีรายการตัดสต๊อก
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const firstLine = row.lines[0];
                const meta = parseIssueTransactionMeta(row);

                return (
                  <TableRow key={row.id} hover onDoubleClick={() => onView?.(row)} sx={{ cursor: onView ? 'pointer' : 'default' }}>
                    <TableCell sx={{ minWidth: 140 }}>
                      <Typography variant="body2" fontWeight={800}>
                        {row.documentNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        โดย {row.createdByUsername}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 120 }}>
                      <Typography variant="body2">
                        {new Date(row.transactionDate).toLocaleString('th-TH')}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 260 }}>
                      <Stack spacing={0.8}>
                        {row.lines.map((line) => (
                          <div key={line.id}>
                            {(() => {
                              const isPigLine = (row.requestType ?? '').toLowerCase() === 'pig' || Boolean(line.pigItemId);
                              const displayName = isPigLine
                                ? (line.pigItemName || line.itemName || line.pigItemCode || line.itemCode || '-')
                                : (line.itemName || line.pigItemName || line.itemCode || line.pigItemCode || '-');
                              const displayCode = isPigLine
                                ? (line.pigItemCode || line.itemCode || '-')
                                : (line.itemCode || line.pigItemCode || '-');

                              return (
                                <>
                                  <Typography variant="body2" fontWeight={700}>
                                    {displayName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {displayCode}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {line.isBagDisplay
                                      ? `${formatNumber(Number(line.displayQuantity ?? 0))} ${line.displayUomName || 'กระสอบ'} (${formatNumber(line.quantity)} กก.)`
                                      : `${formatNumber(line.quantity)} ${line.uomName}`}
                                    {line.lotNumber ? ` • Lot ${line.lotNumber}` : ''}
                                  </Typography>
                                </>
                              );
                            })()}
                          </div>
                        ))}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ minWidth: 140 }}>
                      <Typography variant="body2">
                        {firstLine?.fromWarehouseName ?? '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      <Typography variant="body2">
                        {meta.usageFacilityName || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 160 }}>
                      <Typography variant="body2">
                        {meta.usageZone || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      <Typography variant="body2">
                        {meta.usageHouseName || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 140 }}>
                      <Typography variant="body2" fontWeight={700}>
                        {meta.usageTargetType || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ minWidth: 180 }}>
                      <Stack spacing={0.4}>
                        <Typography variant="body2">
                          ผู้ขอ: {meta.requestedByName || '-'}
                        </Typography>
                        <Typography variant="body2">
                          ผู้รับ: {meta.receivedByName || '-'}
                        </Typography>
                      </Stack>
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
