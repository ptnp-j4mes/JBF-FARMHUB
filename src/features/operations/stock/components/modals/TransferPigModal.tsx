import { useState, useEffect } from 'react';
import {
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { MASTER_DIALOG_FORM_SX, MASTER_DIALOG_TITLE_SX } from '@/core/ui-patterns/pr-ui.constants';
import { DialogTitleWithClose } from '@/components/common';
import { AxiosError } from 'axios';
import axiosInstance from '@/lib/axios';
import { StockActionButton } from '@/features/production/stock/components/StockActionButton';
import { pigTransactionsService } from '../../services/pig-transactions.service';
import type { PigBatchRow } from '../../types';

interface TransferPigModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  pigBatch: PigBatchRow | null;
}

type FacilityApiItem = { id: number; name: string };
type WarehouseApiItem = { id: number; name: string };

export function TransferPigModal({ open, onClose, onSuccess, pigBatch }: TransferPigModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [facilities, setFacilities] = useState<{ id: number; name: string }[]>([]);
  const [houses, setHouses] = useState<{ id: number; name: string }[]>([]);
  
  const [selectedFacilityId, setSelectedFacilityId] = useState<number | ''>('');
  const [selectedHouseId, setSelectedHouseId] = useState<number | ''>('');
  const [reason, setReason] = useState('');

  // Reset form when opened with a new batch
  useEffect(() => {
    if (open && pigBatch) {
      setLoading(false);
      setError(null);
      setSelectedFacilityId(pigBatch.facilityNodeId);
      setSelectedHouseId('');
      setReason('');
      void fetchFacilities();
    }
  }, [open, pigBatch]);

  // Fetch houses when facility changes
  useEffect(() => {
    if (selectedFacilityId) {
      void fetchHouses(selectedFacilityId);
    } else {
      setHouses([]);
    }
  }, [selectedFacilityId]);

  const fetchFacilities = async () => {
    try {
      const response = await axiosInstance.get<FacilityApiItem[]>('/api/Facilities?type=farm');
      if (response.data && Array.isArray(response.data)) {
        setFacilities(response.data.map((f) => ({ id: f.id, name: f.name })));
      }
    } catch (err: unknown) {
      console.error('Failed to fetch facilities', err);
    }
  };

  const fetchHouses = async (facilityId: number) => {
    try {
      // Fetch warehouses (คลัง) for the selected facility
      const response = await axiosInstance.get<WarehouseApiItem[]>(`/api/Warehouses?facilityId=${facilityId}`);
      if (response.data && Array.isArray(response.data)) {
         setHouses(response.data.map((h) => ({ id: h.id, name: h.name })));
      }
    } catch (err: unknown) {
      console.error('Failed to fetch houses', err);
    }
  };

  const handleSubmit = async () => {
    if (!pigBatch || !selectedHouseId) return;

    setLoading(true);
    setError(null);
    try {
      await pigTransactionsService.transfer({
        pigBatchId: pigBatch.id,
        toFacilityId: selectedFacilityId as number,
        toHouseId: selectedHouseId as number,
        reason: reason.trim(),
      });
      onSuccess();
    } catch (err: unknown) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message || 'เกิดข้อผิดพลาดในการย้ายหมู');
    } finally {
      setLoading(false);
    }
  };

  if (!pigBatch) return null;

  return (
    <Dialog open={open} onClose={!loading ? onClose : undefined} fullWidth maxWidth="sm">
      <DialogTitleWithClose onClose={onClose} disabled={loading} sx={{ ...MASTER_DIALOG_TITLE_SX, bgcolor: '#FFB300' }}>
        ย้ายรุ่นสุกร
      </DialogTitleWithClose>
      <DialogContent dividers sx={MASTER_DIALOG_FORM_SX}>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <Alert severity="info" icon={false}>
            <Typography variant="body2"><strong>รุ่น:</strong> {pigBatch.batchNo}</Typography>
            <Typography variant="body2"><strong>คงเหลือ:</strong> {pigBatch.currentQuantity} ตัว</Typography>
            <Typography variant="body2" color="text.secondary">
              จากฟาร์ม {pigBatch.facilityName} {pigBatch.warehouseName ? `- ${pigBatch.warehouseName}` : ''}
            </Typography>
          </Alert>

          <FormControl fullWidth size="small" required>
            <InputLabel>เลือกฟาร์มปลายทาง</InputLabel>
            <Select
              value={selectedFacilityId}
              label="เลือกฟาร์มปลายทาง"
              onChange={(e) => {
                setSelectedFacilityId(e.target.value as number);
                setSelectedHouseId('');
              }}
            >
              {facilities.map((f) => (
                <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
              ))}
              {/* Fallback if current facility is not in the list for some reason */}
              {!facilities.some(f => f.id === pigBatch.facilityNodeId) && (
                <MenuItem value={pigBatch.facilityNodeId}>{pigBatch.facilityName}</MenuItem>
              )}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" required disabled={!selectedFacilityId}>
            <InputLabel>เลือกคลังปลายทาง</InputLabel>
            <Select
              value={selectedHouseId}
              label="เลือกคลังปลายทาง"
              onChange={(e) => setSelectedHouseId(e.target.value as number)}
            >
              {houses.length === 0 && (
                <MenuItem disabled value=""><em>ไม่พบข้อมูลคลัง</em></MenuItem>
              )}
              {houses.map((h) => (
                <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="เหตุผลการย้าย (ระบุหรือไม่ก็ได้)"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <StockActionButton tone="neutral" onClick={onClose} disabled={loading}>
          ยกเลิก
        </StockActionButton>
        <StockActionButton
          tone="warning"
          onClick={() => void handleSubmit()}
          disabled={loading || !selectedHouseId}
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          ยืนยันการย้าย
        </StockActionButton>
      </DialogActions>
    </Dialog>
  );
}
