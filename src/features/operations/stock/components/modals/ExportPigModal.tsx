import { useState, useEffect } from 'react';
import {
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { MASTER_DIALOG_FORM_SX, MASTER_DIALOG_TITLE_SX } from '@/core/ui-patterns/pr-ui.constants';
import { DialogTitleWithClose } from '@/components/common';
import { AxiosError } from 'axios';
import { pigTransactionsService } from '../../services/pig-transactions.service';
import type { PigBatchRow } from '../../types';
import { StockActionButton } from '@/features/production/stock/components/StockActionButton';

interface ExportPigModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pigBatch: PigBatchRow | null;
}

export function ExportPigModal({ open, onClose, onSuccess, pigBatch }: ExportPigModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quantity, setQuantity] = useState<number | ''>('');
  const [destination, setDestination] = useState('');
  const [remarks, setRemarks] = useState('');

  // Reset form
  useEffect(() => {
    if (open && pigBatch) {
      setLoading(false);
      setError(null);
      // Default to entire batch quantity if it's an export
      setQuantity(pigBatch.currentQuantity ?? '');
      setDestination('');
      setRemarks('');
    }
  }, [open, pigBatch]);

  const handleSubmit = async () => {
    if (!pigBatch || !quantity || !destination) return;

    if (Number(quantity) <= 0 || Number(quantity) > (pigBatch.currentQuantity ?? 0)) {
      setError('จำนวนส่งออกไม่ถูกต้อง (ต้องมากกว่า 0 และไม่เกินจำนวนคงเหลือ)');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await pigTransactionsService.export({
        pigBatchId: pigBatch.id,
        quantity: Number(quantity),
        destination: destination.trim(),
        remarks: remarks.trim() || undefined,
      });
      onSuccess();
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || 'เกิดข้อผิดพลาดในการส่งออกสุกร');
    } finally {
      setLoading(false);
    }
  };

  if (!pigBatch) return null;

  return (
    <Dialog open={open} onClose={!loading ? onClose : undefined} fullWidth maxWidth="sm">
      <DialogTitleWithClose onClose={onClose} disabled={loading} sx={{ ...MASTER_DIALOG_TITLE_SX, bgcolor: '#1b5e20' }}>
        ส่งออกสุกร (จำหน่าย)
      </DialogTitleWithClose>
      <DialogContent dividers sx={MASTER_DIALOG_FORM_SX}>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Alert severity="info" icon={false}>
            <Typography variant="body2"><strong>รุ่น:</strong> {pigBatch.batchNo}</Typography>
            <Typography variant="body2"><strong>คงเหลือทั้งหมด:</strong> {pigBatch.currentQuantity} ตัว</Typography>
            <Typography variant="body2" color="text.secondary">
              ฟาร์ม {pigBatch.facilityName} {pigBatch.warehouseName ? `- ${pigBatch.warehouseName}` : ''}
            </Typography>
          </Alert>

          <TextField
            label="ปลายทาง (ชื่อสถานที่/ลูกค้า/โรงฆ่า)"
            size="small"
            required
            fullWidth
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />

          <TextField
            label="จำนวนที่ส่งออก (ตัว)"
            type="number"
            size="small"
            required
            fullWidth
            value={quantity}
            onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
            inputProps={{ min: 1, max: pigBatch.currentQuantity }}
            helperText={
              quantity === pigBatch.currentQuantity 
                ? 'ระบบจะทำการส่งออกหมูทั้งรุ่นและทำการ "ปิดรุ่น (Closed)" อัตโนมัติ' 
                : 'ระบุจำนวนที่ต้องการส่งออก (สามารถทะยอยขายทีละส่วนได้)'
            }
          />

          <TextField
            label="หมายเหตุเพิ่มเติม"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <StockActionButton tone="neutral" onClick={onClose} disabled={loading}>
          ยกเลิก
        </StockActionButton>
        <StockActionButton
          tone="success"
          onClick={() => void handleSubmit()}
          disabled={loading || !quantity || quantity <= 0 || !destination}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          ยืนยันการส่งออก
        </StockActionButton>
      </DialogActions>
    </Dialog>
  );
}
