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
import { DialogTitleWithClose } from '@/components/common';
import { formatNumber } from '@/lib/utils/format.util';
import type { StockTransactionRow } from '../types';
import {
  STOCK_DIALOG_FIELDSET_SX,
  STOCK_DIALOG_FORM_SX,
  STOCK_DIALOG_LEGEND_SX,
  STOCK_DIALOG_PAPER_SX,
  STOCK_DIALOG_SECTION_BOX_SX,
  STOCK_DIALOG_TITLE_SX,
} from './stock-dialog.constants';

type TransferTransactionDetailsDialogProps = {
  open: boolean;
  transaction: StockTransactionRow | null;
  onClose: () => void;
};

export function TransferTransactionDetailsDialog({
  open,
  transaction,
  onClose,
}: TransferTransactionDetailsDialogProps) {
  if (!transaction) return null;

  const firstLine = transaction.lines[0];
  const documentRemarks = transaction.remarks?.trim() || '';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" PaperProps={{ sx: STOCK_DIALOG_PAPER_SX }}>
      <DialogTitleWithClose onClose={onClose} sx={STOCK_DIALOG_TITLE_SX}>
        รายละเอียดใบโอนสินค้า
      </DialogTitleWithClose>
      <DialogContent dividers sx={STOCK_DIALOG_FORM_SX}>
        <Stack spacing={2}>
          <Box component="fieldset" sx={STOCK_DIALOG_FIELDSET_SX}>
            <Typography component="legend" sx={STOCK_DIALOG_LEGEND_SX}>
              ข้อมูลเอกสาร
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="text.secondary">เลขที่เอกสาร</Typography>
                <Typography variant="h6" fontWeight={800}>{transaction.documentNumber}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="text.secondary">วันที่ทำรายการ</Typography>
                <Typography variant="body1">{new Date(transaction.transactionDate).toLocaleString('th-TH')}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" color="text.secondary">ผู้ทำรายการ</Typography>
                <Typography variant="body1">{transaction.createdByUsername}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">จากคลัง</Typography>
                <Typography variant="body1">{firstLine?.fromWarehouseName ?? '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="caption" color="text.secondary">ไปคลัง</Typography>
                <Typography variant="body1">{firstLine?.toWarehouseName ?? '-'}</Typography>
              </Grid>
            </Grid>
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
                  <Grid key={line.id} container spacing={1.5} sx={{ ...STOCK_DIALOG_SECTION_BOX_SX, px: 2, py: 1.5, border: 'none', borderRadius: 0, bgcolor: 'transparent' }}>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <Typography variant="body2" fontWeight={700}>{line.itemName}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                      <Typography variant="caption" color="text.secondary">จำนวน</Typography>
                      <Typography variant="body2">{formatNumber(line.quantity)} {line.uomName}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, md: 2 }}>
                      <Typography variant="caption" color="text.secondary">Lot</Typography>
                      <Typography variant="body2">{line.lotNumber || '-'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Typography variant="caption" color="text.secondary">จากคลัง</Typography>
                      <Typography variant="body2">{line.fromWarehouseName || '-'}</Typography>
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Typography variant="caption" color="text.secondary">ไปคลัง</Typography>
                      <Typography variant="body2">{line.toWarehouseName || '-'}</Typography>
                    </Grid>
                  </Grid>
                ))}
              </Stack>
            </Box>
          </Stack>

          {documentRemarks ? (
            <>
              <Divider />
              <Box sx={STOCK_DIALOG_SECTION_BOX_SX}>
                <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
                  หมายเหตุเอกสาร
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {documentRemarks}
                </Typography>
              </Box>
            </>
          ) : null}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
