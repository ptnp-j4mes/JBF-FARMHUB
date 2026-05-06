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
import {
  buildReceiveRoundMetaMap,
  getReceiptPlainRemarks,
  getReceiptReceiverLabel,
} from '../utils/receive-history.util';
import { getFeedSiloDisplayLabel } from '../utils/location-display.util';
import { StatusBadge } from '@/design-system';

type ReceiveTransactionListProps = {
  rows: StockTransactionRow[];
  loading?: boolean;
  onView?: (row: StockTransactionRow) => void;
};

export function ReceiveTransactionList({
  rows,
  loading = false,
  onView,
}: ReceiveTransactionListProps) {
  const roundMetaMap = buildReceiveRoundMetaMap(rows);

  const requestTypeMeta = (requestType?: string | null) =>
    (requestType ?? '').toLowerCase() === 'pig'
      ? { label: 'Pig', color: 'warning' as const }
      : { label: 'Material', color: 'info' as const };

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
      <TableContainer sx={{ maxHeight: 320, overflowY: 'auto', overflowX: 'auto', scrollbarGutter: 'stable' }}>
        <Table size="small" stickyHeader sx={{
            minWidth: 1240,
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
              <TableCell sx={{ width: 150 }}>เลขที่ GR</TableCell>
              <TableCell sx={{ width: 150 }}>อ้างอิง PR</TableCell>
              <TableCell sx={{ width: 120 }}>วันที่รับ</TableCell>
              <TableCell sx={{ width: 130 }}>ผู้รับ</TableCell>
              <TableCell sx={{ width: 120 }}>ครั้งที่รับ</TableCell>
              <TableCell sx={{ width: 330 }}>รายการ</TableCell>
              <TableCell sx={{ width: 220 }}>หมายเหตุ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  กำลังโหลดประวัติการรับสินค้า...
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  ยังไม่มีประวัติการรับสินค้า
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => {
                const roundMeta = roundMetaMap.get(row.id);
                const roundLabel = roundMeta?.isReturned
                  ? 'ตีกลับ'
                  : roundMeta?.isCompletionRound
                    ? `${roundMeta.roundLabel} (ครบใบ PR)`
                    : roundMeta?.roundLabel ?? 'รับของครั้งที่ 1';

                return (
                <TableRow key={row.id} hover onDoubleClick={() => onView?.(row)} sx={{ cursor: onView ? 'pointer' : 'default' }}>
                  <TableCell align="center" sx={{ minWidth: 140 }}>
                    <Stack spacing={0.5} alignItems="center">
                      <Typography variant="body2" fontWeight={800}>
                        {row.documentNumber}
                      </Typography>
                      <StatusBadge
                        label={requestTypeMeta(row.requestType).label}
                        type={requestTypeMeta(row.requestType).color}
                        size="small"
                      />
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ minWidth: 140 }}>
                    <Typography variant="body2" fontWeight={700}>
                      {row.sourceDocumentNumber ?? '-'}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Typography variant="body2">
                      {new Date(row.transactionDate).toLocaleDateString('th-TH')}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 140 }}>
                    <Typography variant="body2">{getReceiptReceiverLabel(row)}</Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 120 }}>
                    <Typography variant="body2" fontWeight={700}>
                      {roundLabel}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 280 }}>
                    <Stack spacing={0.8}>
                      {row.lines.map((line) => (
                        <div key={line.id}>
                          <Typography variant="body2" fontWeight={700}>
                            {(row.requestType ?? '').toLowerCase() === 'pig' ? (line.pigItemName || line.itemName) : line.itemName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatNumber(line.quantity)} {line.uomName}
                            {line.lotNumber ? ` • Lot ${line.lotNumber}` : ''}
                            {line.feedSiloName ? ` • ไซโล ${getFeedSiloDisplayLabel(line.feedSiloName, line.feedSiloCode)}` : ''}
                          </Typography>
                        </div>
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ minWidth: 180 }}>
                    <Typography variant="body2" color="text.secondary">
                      {getReceiptPlainRemarks(row) || '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              )})
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
