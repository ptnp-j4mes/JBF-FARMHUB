'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Save, Send } from '@mui/icons-material';
import { AxiosError } from 'axios';
import { httpClient } from '@/core/api/http-client';
import { toThaiWorkflowStatus } from '@/lib/utils/status.util';

type FacilityOption = {
  id: number;
  code: string;
  name: string;
};

type ZoneOption = {
  facilityId: number;
  zone: string;
};

type OptionsResponse = {
  facilities: FacilityOption[];
  zones: ZoneOption[];
};

type BatchClosingResponse = {
  id: number;
  documentNumber: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | string;
  facilityId: number;
  zone: string;
};

type FormState = {
  facilityId: number;
  zone: string;
  receivedDate: string;
  closeDate: string;
  sourceReference: string;
  receivedPigCount: number;
  receivedAvgWeightKg: number;
  soldPigCount: number;
  soldAvgWeightKg: number;
  deadPigCount: number;
  culledPigCount: number;
  incomeTotalBaht: number;
  incomeDeadCullingBaht: number;
  costPigletBaht: number;
  costFeedBaht: number;
  costMedicineVaccineBaht: number;
  costLaborBaht: number;
  costElectricityBaht: number;
  costDepreciationBaht: number;
  costFuelBaht: number;
  costFarmRentBaht: number;
  costAnimalTransportBaht: number;
  costAnalysisBaht: number;
  costConsumablesBaht: number;
  costOtherBaht: number;
  costMiddlemanBaht: number;
  costIncentiveBaht: number;
  remarks: string;
};

const initialForm: FormState = {
  facilityId: 0,
  zone: '',
  receivedDate: '',
  closeDate: '',
  sourceReference: '',
  receivedPigCount: 0,
  receivedAvgWeightKg: 0,
  soldPigCount: 0,
  soldAvgWeightKg: 0,
  deadPigCount: 0,
  culledPigCount: 0,
  incomeTotalBaht: 0,
  incomeDeadCullingBaht: 0,
  costPigletBaht: 0,
  costFeedBaht: 0,
  costMedicineVaccineBaht: 0,
  costLaborBaht: 0,
  costElectricityBaht: 0,
  costDepreciationBaht: 0,
  costFuelBaht: 0,
  costFarmRentBaht: 0,
  costAnimalTransportBaht: 0,
  costAnalysisBaht: 0,
  costConsumablesBaht: 0,
  costOtherBaht: 0,
  costMiddlemanBaht: 0,
  costIncentiveBaht: 0,
  remarks: '',
};

const expenseFields: Array<{ key: keyof FormState; label: string }> = [
  { key: 'costPigletBaht', label: 'ต้นทุนลูกสุกร (บาท)' },
  { key: 'costFeedBaht', label: 'ค่าอาหาร (รวมขนส่ง) (บาท)' },
  { key: 'costMedicineVaccineBaht', label: 'ค่ายา/วัคซีน (บาท)' },
  { key: 'costLaborBaht', label: 'ค่าแรง (บาท)' },
  { key: 'costElectricityBaht', label: 'ค่าไฟฟ้า (บาท)' },
  { key: 'costDepreciationBaht', label: 'ค่าเสื่อมราคา (บาท)' },
  { key: 'costFuelBaht', label: 'ค่าน้ำมันเชื้อเพลิง (บาท)' },
  { key: 'costFarmRentBaht', label: 'ค่าเช่าฟาร์ม (บาท)' },
  { key: 'costAnimalTransportBaht', label: 'ค่าย้ายสัตว์ (บาท)' },
  { key: 'costAnalysisBaht', label: 'ค่าวิเคราะห์สัตว์ (บาท)' },
  { key: 'costConsumablesBaht', label: 'ค่าวัสดุสิ้นเปลือง (บาท)' },
  { key: 'costOtherBaht', label: 'ค่าใช้จ่ายอื่น (บาท)' },
  { key: 'costMiddlemanBaht', label: 'ค่าใช้จ่ายส่วนกลาง (บาท)' },
  { key: 'costIncentiveBaht', label: 'ค่า Incentive (บาท)' },
];

const stepLabels = ['สร้างร่าง', 'กรอกข้อมูล', 'ส่งอนุมัติ', 'ผู้จัดการตรวจสอบ', 'อนุมัติ'];

const UI = {
  panel: '#f6f7f6',
  border: '#dde2de',
  text: '#2f3a37',
  accent: 'rgb(22, 90, 80)',
  shadow: '0 8px 18px rgba(22, 35, 31, 0.10), 0 1px 4px rgba(22, 35, 31, 0.06)',
};

export function BatchClosingApprovalPage() {
  const [options, setOptions] = useState<OptionsResponse>({ facilities: [], zones: [] });
  const [form, setForm] = useState<FormState>(initialForm);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordId, setRecordId] = useState<number | null>(null);
  const [documentNumber, setDocumentNumber] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Draft');

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const response = await httpClient.get<OptionsResponse>('/api/BatchClosingReports/options');
        if (!mounted) return;
        setOptions(response.data);
      } catch (err) {
        if (!mounted) return;
        const axiosError = err as AxiosError<{ message?: string }>;
        setError(axiosError.response?.data?.message ?? 'ไม่สามารถโหลดข้อมูลตัวเลือกได้');
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const zoneOptions = useMemo(() => {
    if (!form.facilityId) return [];
    return options.zones.filter((zone) => zone.facilityId === form.facilityId);
  }, [form.facilityId, options.zones]);

  const isReadOnly = status === 'Submitted' || status === 'Approved';

  const setNumberField = (key: keyof FormState) => (value: string) => {
    setForm((prev) => ({ ...prev, [key]: Number(value || 0) }));
  };

  const buildPayload = () => ({
    ...form,
    sourceReference: form.sourceReference || null,
    remarks: form.remarks || null,
  });

  const saveDraft = async (): Promise<BatchClosingResponse | null> => {
    if (isReadOnly) return null;
    try {
      setSaving(true);
      setError(null);
      if (recordId) {
        const response = await httpClient.put<BatchClosingResponse>(
          `/api/BatchClosingReports/${recordId}`,
          buildPayload(),
        );
        setStatus(response.data.status);
        return response.data;
      }

      const response = await httpClient.post<BatchClosingResponse>('/api/BatchClosingReports', buildPayload());
      setRecordId(response.data.id);
      setDocumentNumber(response.data.documentNumber);
      setStatus(response.data.status);
      return response.data;
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? 'ไม่สามารถบันทึกรายงานได้');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitApproval = async () => {
    try {
      setSubmitting(true);
      const saved = await saveDraft();
      const targetId = saved?.id ?? recordId;
      if (!targetId) return;
      const response = await httpClient.post<BatchClosingResponse>(`/api/BatchClosingReports/${targetId}/submit`);
      setStatus(response.data.status);
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>;
      setError(axiosError.response?.data?.message ?? 'ไม่สามารถส่งอนุมัติได้');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: UI.bg }}>
      <Box
        sx={{
          bgcolor: UI.accent,
          color: '#fff',
          borderRadius: 2,
          boxShadow: UI.shadow,
          px: 2.5,
          py: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 2,
        }}
      >
        <Typography sx={{ fontSize: '2rem', fontWeight: 700, lineHeight: 1 }}>
          ปิดรุ่นการเลี้ยง (Report Approval)
        </Typography>
      </Box>
      <Box sx={{ borderRadius: 2.5, border: `1px solid ${UI.border}`, bgcolor: UI.panel, boxShadow: UI.shadow, p: { xs: 1.5, md: 2 } }}>
        <Box sx={{ borderRadius: 2, border: `1px solid ${UI.border}`, bgcolor: '#fbfcfb', p: 1.5, mb: 2 }}>
          <Typography sx={{ fontSize: 13, color: '#7d8783', fontWeight: 700, mb: 1 }}>
            {documentNumber ? `${documentNumber} (${toThaiWorkflowStatus(status)})` : 'สร้างร่างรายงาน'}
          </Typography>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={1.5}
            justifyContent="space-between"
            alignItems={{ xs: 'stretch', md: 'center' }}
          >
            <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
              {stepLabels.map((label, index) => (
                <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '999px',
                      bgcolor: index <= (status === 'Draft' ? 1 : status === 'Submitted' ? 2 : 4) ? '#22c55e' : '#e5e7eb',
                      color: index <= (status === 'Draft' ? 1 : status === 'Submitted' ? 2 : 4) ? '#fff' : '#6b7280',
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {index + 1}
                  </Box>
                  <Typography variant="caption">{label}</Typography>
                </Box>
              ))}
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<Save />}
                onClick={() => void saveDraft()}
                disabled={saving || submitting || isReadOnly}
                sx={{ borderColor: '#b8c5bf', color: UI.text, '&:hover': { borderColor: UI.accent } }}
              >
                บันทึกร่าง
              </Button>
              <Button
                variant="contained"
                startIcon={<Send />}
                onClick={() => void handleSubmitApproval()}
                disabled={saving || submitting || isReadOnly}
                sx={{ bgcolor: UI.accent, '&:hover': { bgcolor: '#10473f' } }}
              >
                ส่งอนุมัติ
              </Button>
            </Stack>
          </Stack>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', xl: '1fr 1fr' } }}>
          <Box sx={{ borderRadius: 2, border: `1px solid ${UI.border}`, bgcolor: '#fbfcfb', p: 1.5 }}>
            <Typography sx={{ fontSize: 13, color: '#7d8783', fontWeight: 700, mb: 1 }}>ข้อมูลพื้นฐาน</Typography>
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              <TextField
                select
                label="ฟาร์ม"
                value={form.facilityId || ''}
                onChange={(event) => setForm((prev) => ({
                  ...prev,
                  facilityId: Number(event.target.value),
                  zone: '',
                }))}
                disabled={isReadOnly}
                size="small"
              >
                {options.facilities.map((facility) => (
                  <MenuItem key={facility.id} value={facility.id}>
                    {facility.code} - {facility.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="โซน"
                value={form.zone}
                onChange={(event) => setForm((prev) => ({ ...prev, zone: event.target.value }))}
                disabled={isReadOnly || !form.facilityId}
                size="small"
              >
                {zoneOptions.map((zone) => (
                  <MenuItem key={`${zone.facilityId}-${zone.zone}`} value={zone.zone}>
                    {zone.zone}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                type="date"
                label="วันที่รับเข้า"
                value={form.receivedDate}
                onChange={(event) => setForm((prev) => ({ ...prev, receivedDate: event.target.value }))}
                disabled={isReadOnly}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
              <TextField
                type="date"
                label="วันที่ปิดรุ่น"
                value={form.closeDate}
                onChange={(event) => setForm((prev) => ({ ...prev, closeDate: event.target.value }))}
                disabled={isReadOnly}
                InputLabelProps={{ shrink: true }}
                size="small"
              />
            </Box>

            <TextField
              label="แหล่งสุกร"
              value={form.sourceReference}
              onChange={(event) => setForm((prev) => ({ ...prev, sourceReference: event.target.value }))}
              disabled={isReadOnly}
              size="small"
              fullWidth
              sx={{ mt: 1.5 }}
            />

            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>ข้อมูลสุกร</Typography>
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              <TextField label="จำนวนรับเข้า (ตัว)" type="number" value={form.receivedPigCount} onChange={(e) => setNumberField('receivedPigCount')(e.target.value)} disabled={isReadOnly} size="small" />
              <TextField label="น้ำหนักรับเข้ารวม (กก.)" type="number" value={form.receivedAvgWeightKg} onChange={(e) => setNumberField('receivedAvgWeightKg')(e.target.value)} disabled={isReadOnly} size="small" />
              <TextField label="จำนวนขายขุน (ตัว)" type="number" value={form.soldPigCount} onChange={(e) => setNumberField('soldPigCount')(e.target.value)} disabled={isReadOnly} size="small" />
              <TextField label="น้ำหนักทีมขาย (กก.)" type="number" value={form.soldAvgWeightKg} onChange={(e) => setNumberField('soldAvgWeightKg')(e.target.value)} disabled={isReadOnly} size="small" />
              <TextField label="สุกรตาย (ตัว)" type="number" value={form.deadPigCount} onChange={(e) => setNumberField('deadPigCount')(e.target.value)} disabled={isReadOnly} size="small" />
              <TextField label="สุกรคัดทิ้ง (ตัว)" type="number" value={form.culledPigCount} onChange={(e) => setNumberField('culledPigCount')(e.target.value)} disabled={isReadOnly} size="small" />
            </Box>
          </Box>

          <Box sx={{ borderRadius: 2, border: `1px solid ${UI.border}`, bgcolor: '#fbfcfb', p: 1.5 }}>
            <Typography sx={{ fontSize: 13, color: '#7d8783', fontWeight: 700, mb: 1 }}>รายรับ-รายจ่าย</Typography>
            <Typography variant="subtitle2" color="success.main" sx={{ mb: 1 }}>รายรับ</Typography>
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              <TextField label="รายได้ขายสุกรขุน (บาท)" type="number" value={form.incomeTotalBaht} onChange={(e) => setNumberField('incomeTotalBaht')(e.target.value)} disabled={isReadOnly} size="small" />
              <TextField label="รายได้ขายตาย-คัดทิ้ง (บาท)" type="number" value={form.incomeDeadCullingBaht} onChange={(e) => setNumberField('incomeDeadCullingBaht')(e.target.value)} disabled={isReadOnly} size="small" />
            </Box>

            <Typography variant="subtitle2" color="error.main" sx={{ mt: 2, mb: 1 }}>ค่าใช้จ่าย</Typography>
            <Box sx={{ display: 'grid', gap: 1.5, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
              {expenseFields.map((field) => (
                <TextField
                  key={String(field.key)}
                  label={field.label}
                  type="number"
                  value={form[field.key] as number}
                  onChange={(event) => setNumberField(field.key)(event.target.value)}
                  disabled={isReadOnly}
                  size="small"
                />
              ))}
            </Box>

            <TextField
              label="หมายเหตุ"
              value={form.remarks}
              onChange={(event) => setForm((prev) => ({ ...prev, remarks: event.target.value }))}
              disabled={isReadOnly}
              size="small"
              fullWidth
              multiline
              minRows={3}
              sx={{ mt: 1.5 }}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
