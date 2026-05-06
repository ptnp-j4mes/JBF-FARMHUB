'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogActions,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  Button,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DialogTitleWithClose } from '@/components/common';
import { formatDateTime } from '@/lib/utils/date.util';
import { formatNumber } from '@/lib/utils/format.util';
import { getWorkflowStatusChipSx, toThaiWorkflowStatus } from '@/lib/utils/status.util';
import type { StockAdjustmentRequestResponse } from '@/features/production/stock/types';
import {
  getStockDialogPaperSx,
  getStockDialogSectionBoxSx,
  getStockDialogTableSx,
} from '@/features/production/stock/components/stock-dialog.constants';

type Props = {
  open: boolean;
  request: StockAdjustmentRequestResponse | null;
  onClose: () => void;
  canTakeApprovalAction?: boolean;
  actionLoading?: boolean;
  onApprove?: (requestId: number, comment: string) => Promise<void> | void;
  onReject?: (requestId: number, reason: string) => Promise<void> | void;
};

export function StockAdjustmentRequestDetailsDialog({
  open,
  request,
  onClose,
  canTakeApprovalAction = false,
  actionLoading = false,
  onApprove,
  onReject,
}: Props) {
  const theme = useTheme();
  const [comment, setComment] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);

  const canAct = canTakeApprovalAction && request?.status === 'Pending';

  const handleApprove = async () => {
    if (!request || !onApprove) return;
    setActionError(null);
    await onApprove(request.id, comment.trim());
    setComment('');
  };

  const handleReject = async () => {
    if (!request || !onReject) return;
    if (comment.trim().length < 5) {
      setActionError('กรุณาใส่เหตุผลอย่างน้อย 5 ตัวอักษร');
      return;
    }

    setActionError(null);
    await onReject(request.id, comment.trim());
    setComment('');
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" PaperProps={{ sx: getStockDialogPaperSx(theme) }}>
      <DialogTitleWithClose onClose={onClose}>
        {request?.documentNumber ?? 'รายละเอียดคำขอปรับสต๊อก'}
      </DialogTitleWithClose>
      <DialogContent dividers sx={{ bgcolor: theme.palette.background.paper }}>
        {!request ? null : (
          <Stack spacing={2}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="h6" fontWeight={900}>
                  {request.documentNumber}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {request.facilityName}
                </Typography>
              </Box>
              <Chip label={toThaiWorkflowStatus(request.status)} sx={getWorkflowStatusChipSx(request.status)} />
            </Box>

            <Box
              sx={{
                display: 'grid',
                gap: 1.2,
                gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
              }}
            >
              <InfoCard label="วันที่ขอ" value={formatDateTime(request.requestDate)} />
              <InfoCard label="ผู้ขอ" value={request.requesterName || '-'} />
              <InfoCard label="ผู้อนุมัติ" value={request.approvedByName || '-'} />
              <InfoCard label="วันที่อนุมัติ" value={request.approvedDate ? formatDateTime(request.approvedDate) : '-'} />
              <InfoCard label="เลขที่ transaction" value={request.stockTransactionNumber || '-'} />
              <InfoCard label="มูลค่า Diff รวม" value={formatNumber(request.totalDeltaValue ?? 0, 2)} />
            </Box>

            {request.remarks ? (
              <Paper variant="outlined" sx={getStockDialogSectionBoxSx(theme)}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>
                  หมายเหตุ
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {request.remarks}
                </Typography>
              </Paper>
            ) : null}

            {request.rejectionReason ? (
              <Paper variant="outlined" sx={getStockDialogSectionBoxSx(theme)}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>
                  เหตุผลไม่อนุมัติ
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {request.rejectionReason}
                </Typography>
              </Paper>
            ) : null}

            {canAct ? (
              <Paper variant="outlined" sx={getStockDialogSectionBoxSx(theme)}>
                <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 0.5 }}>
                  หมายเหตุการอนุมัติ
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={2}
                  label="Comment (จำเป็นสำหรับไม่อนุมัติ)"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                />
                {actionError ? (
                  <Alert severity="warning" sx={{ mt: 1.25 }}>
                    {actionError}
                  </Alert>
                ) : null}
              </Paper>
            ) : null}

            <TableContainer component={Paper} sx={{ ...getStockDialogTableSx(theme), boxShadow: 'none' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>คลัง</TableCell>
                    <TableCell>สินค้า</TableCell>
                    <TableCell>Lot</TableCell>
                    <TableCell>หน่วย</TableCell>
                    <TableCell align="right">ก่อน</TableCell>
                    <TableCell align="right">ขอใหม่</TableCell>
                    <TableCell align="right">Delta</TableCell>
                    <TableCell align="right">Unit Cost</TableCell>
                    <TableCell align="right">Delta Value</TableCell>
                    <TableCell>เหตุผล</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {request.lines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                        ไม่พบรายการ
                      </TableCell>
                    </TableRow>
                  ) : (
                    request.lines.map((line) => (
                      <TableRow key={line.id}>
                        <TableCell>{line.warehouseName || '-'}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>
                            {line.itemName || '-'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {line.itemCode || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>{line.lotNumber || '-'}</TableCell>
                        <TableCell>{line.uomName || '-'}</TableCell>
                        <TableCell align="right">{formatNumber(line.oldQuantitySnapshot ?? 0, 4)}</TableCell>
                        <TableCell align="right">{formatNumber(line.newQuantityRequested ?? 0, 4)}</TableCell>
                        <TableCell align="right">{formatNumber(line.deltaQuantitySnapshot ?? 0, 4)}</TableCell>
                        <TableCell align="right">{formatNumber(line.unitCostSnapshot ?? 0, 2)}</TableCell>
                        <TableCell align="right">{formatNumber(line.deltaValueSnapshot ?? 0, 2)}</TableCell>
                        <TableCell>{line.reason || '-'}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>ปิด</Button>
        {canAct ? (
          <>
            <Button variant="contained" onClick={() => void handleApprove()} disabled={actionLoading}>
              อนุมัติ
            </Button>
            <Button variant="outlined" color="error" onClick={() => void handleReject()} disabled={actionLoading}>
              ไม่อนุมัติ
            </Button>
          </>
        ) : null}
      </DialogActions>
    </Dialog>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <Paper variant="outlined" sx={getStockDialogSectionBoxSx(theme)}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700} sx={{ mt: 0.25, wordBreak: 'break-word' }}>
        {value}
      </Typography>
    </Paper>
  );
}
