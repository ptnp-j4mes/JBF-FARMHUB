'use client';

import {
  Box,
  Dialog,
  DialogContent,
  Divider,
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import type { StockTransactionRow } from '../types';
import { formatNumber } from '@/lib/utils/format.util';
import {
  buildReceiveRoundMetaMap,
  getReceiptPlainRemarks,
  getReceiptReceiverLabel,
} from '../utils/receive-history.util';
import { DialogTitleWithClose } from '@/components/common';
import { getFeedSiloDisplayLabel } from '../utils/location-display.util';
import {
  STOCK_DIALOG_FIELDSET_SX,
  STOCK_DIALOG_FORM_SX,
  STOCK_DIALOG_LEGEND_SX,
  STOCK_DIALOG_PAPER_SX,
  STOCK_DIALOG_SECTION_BOX_SX,
  STOCK_DIALOG_TITLE_SX,
} from './stock-dialog.constants';

type ReceiveTransactionDetailsDialogProps = {
  open: boolean;
  transaction: StockTransactionRow | null;
  transactions: StockTransactionRow[];
  onClose: () => void;
};

export function ReceiveTransactionDetailsDialog({
  open,
  transaction,
  transactions,
  onClose,
}: ReceiveTransactionDetailsDialogProps) {
  if (!transaction) return null;

  const roundMeta = buildReceiveRoundMetaMap(transactions).get(transaction.id);
  const receiverName = getReceiptReceiverLabel(transaction);
  const plainRemarks = getReceiptPlainRemarks(transaction);
  const roundLabel = roundMeta?.isReturned
    ? 'ตีกลับ'
    : roundMeta?.roundLabel ?? 'รับของครั้งที่ 1';
  const completionLabel = roundMeta?.isCompletionRound ? 'ครบใบ PR' : null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: STOCK_DIALOG_PAPER_SX }}>
      <DialogTitleWithClose onClose={onClose} sx={STOCK_DIALOG_TITLE_SX}>
        รายละเอียดประวัติการรับสินค้า
      </DialogTitleWithClose>
      <DialogContent dividers sx={STOCK_DIALOG_FORM_SX}>
        <Stack spacing={2}>
          <Box component="fieldset" sx={STOCK_DIALOG_FIELDSET_SX}>
            <Typography component="legend" sx={STOCK_DIALOG_LEGEND_SX}>
              ข้อมูลเอกสาร
            </Typography>
            <Stack spacing={1.5}>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1.5}
                justifyContent="space-between"
                alignItems={{ xs: 'flex-start', md: 'center' }}
              >
                <div>
                  <Typography variant="caption" color="text.secondary">เลขที่ GR</Typography>
                  <Typography variant="h6" fontWeight={800}>{transaction.documentNumber}</Typography>
                </div>
                <Stack direction="row" spacing={1}>
                  <Typography variant="body2" fontWeight={700}>
                    {roundLabel}
                  </Typography>
                  {completionLabel ? (
                    <Typography variant="body2" color="success.main" fontWeight={700}>
                      {completionLabel}
                    </Typography>
                  ) : null}
                </Stack>
              </Stack>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="caption" color="text.secondary">อ้างอิง PR</Typography>
                  <Typography variant="body1" fontWeight={700}>
                    {transaction.sourceDocumentNumber ?? '-'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">วันที่รับ</Typography>
                  <Typography variant="body1">
                    {new Date(transaction.transactionDate).toLocaleString('th-TH')}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">ผู้รับ</Typography>
                  <Typography variant="body1">{receiverName}</Typography>
                </Grid>
                <Grid size={{ xs: 12, md: 3 }}>
                  <Typography variant="caption" color="text.secondary">ค่าขนส่ง</Typography>
                  <Typography variant="body1">
                    {transaction.freightCost != null ? `${formatNumber(transaction.freightCost)} บาท` : '-'}
                  </Typography>
                </Grid>
              </Grid>
            </Stack>
          </Box>

          <Divider />

          <Stack spacing={1.2}>
            <Typography variant="subtitle1" fontWeight={800}>รายการสินค้า</Typography>
            <Box component="fieldset" sx={{ ...STOCK_DIALOG_FIELDSET_SX, p: 0, overflow: 'hidden' }}>
              <Typography component="legend" sx={{ ...STOCK_DIALOG_LEGEND_SX, ml: 1 }}>
                รายการสินค้า
              </Typography>
              <Stack divider={<Divider flexItem />}>
                {transaction.lines.map((line) => (
                  (() => {
                    const isPigLine = (transaction.requestType ?? '').toLowerCase() === 'pig';
                    const displayName = isPigLine ? (line.pigItemName || line.itemName) : line.itemName;
                    const displayCode = isPigLine ? (line.pigItemCode || line.itemCode) : line.itemCode;

                    return (
                  <Grid
                    key={line.id}
                    container
                    spacing={1.5}
                    sx={{ ...STOCK_DIALOG_SECTION_BOX_SX, px: 2, py: 1.5, border: 'none', borderRadius: 0, bgcolor: 'transparent' }}
                  >
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Typography variant="body2" fontWeight={700}>
                        {displayName || '-'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {displayCode || '-'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                      <Typography variant="caption" color="text.secondary">จำนวนรับ</Typography>
                      <Typography variant="body2">
                        {formatNumber(line.quantity)} {line.uomName}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                      <Typography variant="caption" color="text.secondary">ราคาต่อหน่วย</Typography>
                      <Typography variant="body2">
                        {formatNumber(line.unitCost)} บาท
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                      <Typography variant="caption" color="text.secondary">มูลค่ารวม</Typography>
                      <Typography variant="body2">
                        {formatNumber(line.quantity * line.unitCost)} บาท
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 1 }}>
                      <Typography variant="caption" color="text.secondary">Lot</Typography>
                      <Typography variant="body2">{line.lotNumber || '-'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                      <Typography variant="caption" color="text.secondary">วันหมดอายุ</Typography>
                      {line.expiryAllocations && line.expiryAllocations.length > 0 ? (
                        <Stack spacing={0.5}>
                          {line.expiryAllocations.map((expiry) => (
                            <Typography key={expiry.id} variant="body2">
                              {new Date(expiry.expiryDate).toLocaleDateString('th-TH')} • {formatNumber(expiry.quantity)} {line.uomName}
                            </Typography>
                          ))}
                        </Stack>
                      ) : (
                        <Typography variant="body2">
                          {line.expiryDate
                            ? new Date(line.expiryDate).toLocaleDateString('th-TH')
                            : '-'}
                        </Typography>
                      )}
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Typography variant="caption" color="text.secondary">ไซโล</Typography>
                      <Typography variant="body2">
                        {line.feedSiloName ? getFeedSiloDisplayLabel(line.feedSiloName, line.feedSiloCode) : '-'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Typography variant="caption" color="text.secondary">คลังปลายทาง</Typography>
                      <Typography variant="body2">{line.toWarehouseName}</Typography>
                    </Grid>
                  </Grid>
                    );
                  })()
                ))}
              </Stack>
            </Box>
          </Stack>

          <Divider />

          <Box sx={STOCK_DIALOG_SECTION_BOX_SX}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
              หมายเหตุ
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {plainRemarks || '-'}
            </Typography>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
