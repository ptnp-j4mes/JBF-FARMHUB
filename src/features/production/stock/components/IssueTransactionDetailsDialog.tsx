'use client';

import {
  Box,
  Dialog,
  DialogContent,
  Divider,
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
import { useTheme } from '@mui/material/styles';
import type { StockTransactionRow } from '../types';
import { formatNumber } from '@/lib/utils/format.util';
import { parseIssueTransactionMeta } from '../utils/issue-history.util';
import DialogTitleWithClose from '@/design-system/components/atoms/DialogTitleWithClose/DialogTitleWithClose';
import { getFeedSiloDisplayLabel } from '../utils/location-display.util';
import {
  STOCK_DIALOG_LEGEND_SX,
  getStockDialogFieldsetSx,
  getStockDialogFormSx,
  getStockDialogPaperSx,
  getStockDialogSectionBoxSx,
  getStockDialogTableSx,
} from './stock-dialog.constants';

type IssueTransactionDetailsDialogProps = {
  open: boolean;
  transaction: StockTransactionRow | null;
  onClose: () => void;
};

export function IssueTransactionDetailsDialog({
  open,
  transaction,
  onClose,
}: IssueTransactionDetailsDialogProps) {
  const theme = useTheme();
  if (!transaction) return null;

  const meta = parseIssueTransactionMeta(transaction);
  const sourceWarehouseName = getUniqueWarehouseName(transaction.lines);
  const sourcePrNumber = transaction.sourceDocumentNumber || meta.referenceNote || '-';
  const statusValue = transaction.sourceDocumentStatus || transaction.transactionType || '-';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: getStockDialogPaperSx(theme) }}>
      <DialogTitleWithClose onClose={onClose} variant="master">
        รายละเอียดใบเบิกสินค้า
      </DialogTitleWithClose>
      <DialogContent dividers sx={getStockDialogFormSx(theme)}>
        <Stack spacing={3}>
          <Box component="fieldset" sx={getStockDialogFieldsetSx(theme)}>
            <Typography component="legend" sx={STOCK_DIALOG_LEGEND_SX}>
              ข้อมูลเอกสาร
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                gap: 2,
              }}
            >
              <Info label="เลขที่เอกสาร" value={transaction.documentNumber} />
              <Info label="วันที่ทำรายการ" value={new Date(transaction.transactionDate).toLocaleString('th-TH')} />
              <Info label="สถานะ" value={statusValue} />
              <Info label="ผู้ขอ" value={meta.requestedByName || '-'} />
              <Info label="คลังต้นทาง" value={sourceWarehouseName} />
              <Info label="ประเภทปลายทาง" value={meta.usageTargetType || '-'} />
              <Info label="ฟาร์มปลายทาง" value={meta.usageZone || '-'} />
              <Info label="โรงเรือน" value={meta.usageHouseName || '-'} />
              <Info label="วัตถุประสงค์การใช้" value={meta.issuePurpose || 'เบิกสินค้า'} />
              <Info label="PR ต้นทาง" value={sourcePrNumber} />
              <Info label="รายละเอียดอ้างอิง" value={meta.referenceNote || '-'} />
              <Info label="หมายเหตุ" value={meta.plainRemarks || '-'} />
            </Box>
          </Box>
          <Divider />
          <Box component="fieldset" sx={{ ...getStockDialogFieldsetSx(theme), p: 0, overflow: 'hidden' }}>
            <Typography component="legend" sx={{ ...STOCK_DIALOG_LEGEND_SX, ml: 1 }}>
              รายการสินค้า
            </Typography>
            <TableContainer component={Paper} elevation={0} sx={{ ...getStockDialogTableSx(theme), maxHeight: 320, overflowY: 'auto', overflowX: 'auto', p: 2 }}>
              <Table
                size="small"
                stickyHeader
                sx={{
                  '& .MuiTableCell-head': {
                    textAlign: 'center',
                    verticalAlign: 'middle',
                  },
                  '& .MuiTableBody-root .MuiTableCell-root': {
                    py: 1,
                    verticalAlign: 'middle',
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>รายการ</TableCell>
                    <TableCell>คลังต้นทาง</TableCell>
                    <TableCell>ไซโล</TableCell>
                    <TableCell>lot</TableCell>
                    <TableCell align="right">จำนวนที่ตัด</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transaction.lines.map((line) => {
                    const isPigLine = (transaction.requestType ?? '').toLowerCase() === 'pig';
                    const displayName = isPigLine
                      ? (line.pigItemName || line.itemName || '-')
                      : (line.itemName || line.pigItemName || '-');
                    const displayCode = isPigLine
                      ? (line.pigItemCode || line.itemCode || '-')
                      : (line.itemCode || line.pigItemCode || '-');

                    return (
                      <TableRow key={line.id} hover>
                        <TableCell sx={{ minWidth: 220 }}>
                          <Stack spacing={0.2}>
                            <Typography variant="body2" fontWeight={700}>
                              {displayName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {displayCode}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ minWidth: 180 }}>
                          <Typography variant="body2">{line.fromWarehouseName || '-'}</Typography>
                        </TableCell>
                        <TableCell sx={{ minWidth: 180 }}>
                          <Typography variant="body2">
                            {line.feedSiloName
                              ? getFeedSiloDisplayLabel(line.feedSiloName, line.feedSiloCode)
                              : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ minWidth: 120 }}>
                          <Typography variant="body2">{line.lotNumber || '-'}</Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ minWidth: 140 }}>
                          <Typography variant="body2">
                            {formatIssueTransactionQuantity(line)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Box sx={getStockDialogSectionBoxSx(theme)}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
              รายละเอียดอ้างอิง
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {meta.referenceNote || '-'}
            </Typography>
          </Box>
          <Box sx={getStockDialogSectionBoxSx(theme)}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
              หมายเหตุ
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {meta.plainRemarks || '-'}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600}>
        {value}
      </Typography>
    </Box>
  );
}

function getUniqueWarehouseName(lines: Array<{ fromWarehouseName?: string | null }>) {
  const warehouses = Array.from(
    new Set(
      lines
        .map((line) => line.fromWarehouseName?.trim())
        .filter((warehouseName): warehouseName is string => Boolean(warehouseName)),
    ),
  );

  if (warehouses.length === 0) {
    return '-';
  }

  if (warehouses.length === 1) {
    return warehouses[0];
  }

  return 'หลายคลัง';
}

function formatIssueTransactionQuantity(line: {
  quantity: number;
  isBagDisplay?: boolean;
  displayQuantity?: number;
  displayUomName?: string;
  uomName?: string;
}) {
  if (!line.isBagDisplay) {
    return `${formatNumber(line.quantity)} ${line.uomName || 'กก.'}`;
  }

  return `${formatNumber(Number(line.displayQuantity ?? 0))} ${line.displayUomName || 'กระสอบ'} (${formatNumber(line.quantity)} กก.)`;
}
