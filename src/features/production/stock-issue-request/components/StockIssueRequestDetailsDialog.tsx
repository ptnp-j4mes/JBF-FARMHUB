'use client';

import {
  Box,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableContainer,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { DialogTitleWithClose } from '@/components/common';
import { StockActionButton } from '@/features/production/stock/components/StockActionButton';
import { formatDateTime } from '@/lib/utils/date.util';
import { formatNumber } from '@/lib/utils/format.util';
import type { StockIssueRequestResponse } from '../types/stock-issue-request.types';
import { getFeedSiloDisplayLabel } from '@/features/production/stock/utils/location-display.util';
import { useTheme } from '@mui/material/styles';

type Props = {
  open: boolean;
  mode: 'view' | 'approval' | 'confirm';
  data: StockIssueRequestResponse | null;
  loading?: boolean;
  actionLoading?: boolean;
  onClose: () => void;
  onApprove?: (comment: string) => Promise<void>;
  onReject?: (comment: string) => Promise<void>;
  onConfirm?: () => Promise<void>;
};

export function StockIssueRequestDetailsDialog({
  open,
  mode,
  data,
  loading = false,
  actionLoading = false,
  onClose,
  onApprove,
  onReject,
  onConfirm,
}: Props) {
  const theme = useTheme();
  const [comment, setComment] = useState('');

  const title = useMemo(() => {
    if (mode === 'approval') return 'รายละเอียดใบขอตัดสต๊อก';
    if (mode === 'confirm') return 'รายละเอียดรอยืนยันตัดสต๊อก';
    return 'รายละเอียดใบขอตัดสต๊อก';
  }, [mode]);

  const canApprove = mode === 'approval' && data?.status === 'Pending';
  const canConfirm = mode === 'confirm' && data?.status === 'Approved';

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg">
      <DialogTitleWithClose
        onClose={onClose}
        variant="master"
      >
        {title}
      </DialogTitleWithClose>
      <DialogContent dividers sx={{ p: 3 }}>
        {!data ? (
          <Typography color="text.secondary">{loading ? 'กำลังโหลด...' : 'ไม่พบข้อมูลเอกสาร'}</Typography>
        ) : (
          <Stack spacing={3}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
                gap: 2,
              }}
            >
              <Info label="เลขที่เอกสาร" value={data.documentNumber} />
              <Info label="วันที่ขอ" value={formatDateTime(data.requestDate)} />
              <Info label="สถานะ" value={data.status} />
              <Info label="ผู้ขอ" value={data.requestorName} />
              <Info label="คลังต้นทาง" value={data.facilityName} />
              <Info label="ประเภทปลายทาง" value={data.usageTargetType || '-'} />
              <Info label="ฟาร์มปลายทาง" value={data.usageZone || '-'} />
              <Info label="โรงเรือน" value={data.usageHouseName || '-'} />
              <Info label="วัตถุประสงค์การใช้" value={data.issuePurpose || '-'} />
              <Info
                label="PR ต้นทาง"
                value={data.sourcePurchaseRequestNumber || '-'}
              />
              <Info label="รายละเอียดอ้างอิง" value={data.referenceDetail || '-'} />
              <Info label="หมายเหตุ" value={data.remarks || '-'} />
              <Info label="เหตุผลไม่อนุมัติ" value={data.rejectionReason || '-'} />
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 1 }}>
                รายการสินค้า
              </Typography>
              <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, overflow: 'hidden' }}>
                <Table
                  size="small"
                  stickyHeader
                  sx={{
                    '& .MuiTableCell-head': {
                      bgcolor: theme.palette.primary.main,
                      color: '#fff',
                      fontWeight: 700,
                      borderBottom: 'none',
                    },
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell>สินค้า</TableCell>
                      <TableCell>คลังต้นทาง</TableCell>
                      <TableCell>ไซโล</TableCell>
                      <TableCell>Lot</TableCell>
                      <TableCell align="right">จำนวนที่ขอ</TableCell>
                      <TableCell align="right">คงเหลือใช้ได้</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.lines.map((line) => (
                      <TableRow key={line.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={700}>
                            {line.itemName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {line.itemCode}
                          </Typography>
                        </TableCell>
                        <TableCell>{line.warehouseName}</TableCell>
                        <TableCell>
                          {line.feedSiloName
                            ? getFeedSiloDisplayLabel(line.feedSiloName, line.feedSiloCode)
                            : '-'}
                        </TableCell>
                        <TableCell>{line.lotNumber || '-'}</TableCell>
                        <TableCell align="right">
                          {formatIssueLineQuantity(line.requestedQuantity, line, 'requested')}
                        </TableCell>
                        <TableCell align="right">
                          {formatIssueLineQuantity(line.availableQuantity, line, 'available')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {(canApprove || canConfirm) && (
              <TextField
                label={canApprove ? 'หมายเหตุการอนุมัติ/ไม่อนุมัติ' : 'หมายเหตุเพิ่มเติม'}
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                minRows={3}
                multiline
                fullWidth
              />
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <StockActionButton tone="neutral" onClick={onClose} disabled={actionLoading}>
          ปิด
        </StockActionButton>
        {canApprove && onReject && (
          <StockActionButton tone="danger" size="small" onClick={() => void onReject(comment)} disabled={actionLoading || loading}>
            ไม่อนุมัติ
          </StockActionButton>
        )}
        {canApprove && onApprove && (
          <StockActionButton tone="success" size="small" onClick={() => void onApprove(comment)} disabled={actionLoading || loading}>
            อนุมัติ
          </StockActionButton>
        )}
        {canConfirm && onReject && (
          <StockActionButton tone="danger" size="small" onClick={() => void onReject(comment)} disabled={actionLoading || loading}>
            ไม่ยืนยัน
          </StockActionButton>
        )}
        {canConfirm && onConfirm && (
          <StockActionButton tone="warning" onClick={() => void onConfirm()} disabled={actionLoading || loading}>
            ยืนยันตัดสต๊อก
          </StockActionButton>
        )}
      </DialogActions>
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

function formatIssueLineQuantity(
  quantity: number,
  line: {
    isBagDisplay?: boolean;
    uomName?: string;
    displayRequestedQuantity?: number;
    displayAvailableQuantity?: number;
    displayUomName?: string;
  },
  mode: 'requested' | 'available',
) {
  const unitName = line.uomName ?? '';
  if (!line.isBagDisplay) {
    return unitName ? `${formatNumber(quantity)} ${unitName}` : formatNumber(quantity);
  }

  const displayQty = mode === 'requested'
    ? Number(line.displayRequestedQuantity ?? 0)
    : Number(line.displayAvailableQuantity ?? 0);
  const displayUnitName = line.displayUomName ?? '';
  const baseQuantityText = unitName ? `${formatNumber(quantity)} ${unitName}` : formatNumber(quantity);
  return displayUnitName
    ? `${formatNumber(displayQty)} ${displayUnitName} (${baseQuantityText})`
    : baseQuantityText;
}
