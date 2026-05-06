'use client';

import { DialogTitleWithClose } from '@/components/common';
import { FormField, FormSelect } from '@/components/forms';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
  alpha,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useEffect, useState } from 'react';

type FilterKey = 'filter1' | 'filter2' | 'filter3';

export interface MasterRecordDialogFilterDefinition {
  key: FilterKey;
  label: string;
  options: string[];
}

type MasterRecordStatus = 'ใช้งาน' | 'ไม่ใช้งาน';

export interface MasterRecordDialogDraft {
  id?: number;
  code: string;
  name: string;
  status: MasterRecordStatus;
  description: string;
  note: string;
  isPinned: boolean;
  filters: Record<FilterKey, string>;
}

interface MasterRecordDialogProps {
  open: boolean;
  contentTitle: string;
  filterDefinitions: MasterRecordDialogFilterDefinition[];
  initialDraft?: Partial<MasterRecordDialogDraft> | null;
  onClose: () => void;
  onSave: (draft: MasterRecordDialogDraft) => void;
}

interface FieldErrors {
  code?: string;
  name?: string;
}

const EMPTY_FILTERS: Record<FilterKey, string> = {
  filter1: 'all',
  filter2: 'all',
  filter3: 'all',
};

function createDefaultFilters(
  filterDefinitions: MasterRecordDialogFilterDefinition[],
  initialFilters?: Partial<Record<FilterKey, string>>,
): Record<FilterKey, string> {
  return filterDefinitions.reduce<Record<FilterKey, string>>(
    (result, filter) => {
      const nextValue = initialFilters?.[filter.key];
      result[filter.key] = nextValue && nextValue.length > 0 ? nextValue : 'all';
      return result;
    },
    { ...EMPTY_FILTERS },
  );
}

export function MasterRecordDialog({
  open,
  contentTitle,
  filterDefinitions,
  initialDraft,
  onClose,
  onSave,
}: MasterRecordDialogProps) {
  const theme = useTheme();
  const [formState, setFormState] = useState<MasterRecordDialogDraft>({
    code: '',
    name: '',
    status: 'ใช้งาน',
    description: '',
    note: '',
    isPinned: false,
    filters: { ...EMPTY_FILTERS },
  });
  const [errors, setErrors] = useState<FieldErrors>({});

  const pageBg = theme.palette.background.default;
  const surface = theme.palette.background.paper;
  const surfaceMuted = alpha(surface, theme.palette.mode === 'dark' ? 0.74 : 0.96);
  const borderStrong = alpha(theme.palette.divider, 0.92);
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const primary = theme.palette.primary.main;
  const primaryHover = theme.palette.primary.dark;
  const modalPaperBg = alpha(surface, theme.palette.mode === 'dark' ? 0.98 : 1);
  const modalHeaderBg = alpha(surfaceMuted, theme.palette.mode === 'dark' ? 0.6 : 0.96);
  const modalInputBg = alpha(pageBg, theme.palette.mode === 'dark' ? 0.78 : 0.9);

  const fieldSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: modalInputBg,
      color: textPrimary,
      borderRadius: 1.6,
      '& fieldset': { borderColor: borderStrong },
      '&:hover fieldset': { borderColor: alpha(primary, 0.7) },
      '&.Mui-focused fieldset': { borderColor: primary },
    },
    '& .MuiInputLabel-root': { color: textSecondary },
    '& .MuiInputLabel-root.Mui-focused': { color: primary },
    '& .MuiSvgIcon-root': { color: textSecondary },
    '& .MuiFormHelperText-root': { color: alpha(textSecondary, 0.9) },
  } as const;

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormState({
      id: initialDraft?.id,
      code: initialDraft?.code ?? '',
      name: initialDraft?.name ?? '',
      status: initialDraft?.status ?? 'ใช้งาน',
      description: initialDraft?.description ?? '',
      note: initialDraft?.note ?? '',
      isPinned: initialDraft?.isPinned ?? false,
      filters: createDefaultFilters(filterDefinitions, initialDraft?.filters),
    });
    setErrors({});
  }, [filterDefinitions, initialDraft, open]);

  const setField = <K extends keyof MasterRecordDialogDraft>(key: K, value: MasterRecordDialogDraft[K]) => {
    setFormState((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleFilterChange = (key: FilterKey, value: string) => {
    setFormState((previous) => ({
      ...previous,
      filters: {
        ...previous.filters,
        [key]: value,
      },
    }));
  };

  const handleSubmit = () => {
    const nextErrors: FieldErrors = {};
    if (formState.code.trim().length === 0) {
      nextErrors.code = 'กรุณากรอกรหัสรายการ';
    }
    if (formState.name.trim().length === 0) {
      nextErrors.name = 'กรุณากรอกชื่อรายการ';
    }
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    onSave({
      ...formState,
      code: formState.code.trim(),
      name: formState.name.trim(),
      description: formState.description.trim(),
      note: formState.note.trim(),
    });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      keepMounted
      PaperProps={{
        sx: {
          borderRadius: 2,
          bgcolor: modalPaperBg,
          border: `1px solid ${borderStrong}`,
          color: textPrimary,
        },
      }}
    >
      <DialogTitleWithClose onClose={onClose} component="div" sx={{ pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: textPrimary }}>
          {formState.id ? `แก้ไข${contentTitle}` : `เพิ่ม${contentTitle}`}
        </Typography>
      </DialogTitleWithClose>

      <Divider sx={{ borderColor: borderStrong }} />

      <DialogContent
        sx={{
          pt: 2.5,
          pb: 2.75,
          bgcolor: modalPaperBg,
          scrollbarWidth: 'thin',
          scrollbarColor: `${alpha(theme.palette.primary.main, 0.56)} ${alpha(theme.palette.background.default, 0.5)}`,
          '&::-webkit-scrollbar': { width: 10 },
          '&::-webkit-scrollbar-track': {
            background: alpha(theme.palette.background.default, 0.5),
            borderRadius: 10,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(theme.palette.primary.main, 0.56),
            borderRadius: 10,
            border: `2px solid ${alpha(theme.palette.background.default, 0.5)}`,
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.74),
          },
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>
              1. ข้อมูลรายการ
            </Typography>
            <Typography sx={{ fontSize: '11px', color: textSecondary, mt: 0.35, mb: 1.1 }}>
              ระบุรหัส ชื่อรายการ และสถานะการใช้งานของข้อมูลหลัก
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 1.1,
                gridTemplateColumns: { xs: '1fr', md: '1fr 1.6fr 1fr' },
              }}
            >
              <FormField
                size="small"
                label="รหัสรายการ"
                placeholder="เช่น BR-0001"
                value={formState.code}
                onChange={(event) => setField('code', event.target.value)}
                error={Boolean(errors.code)}
                helperText={errors.code}
                sx={fieldSx}
              />
              <FormField
                size="small"
                label="ชื่อรายการ"
                placeholder={`กรอกชื่อ${contentTitle}`}
                value={formState.name}
                onChange={(event) => setField('name', event.target.value)}
                error={Boolean(errors.name)}
                helperText={errors.name}
                sx={fieldSx}
              />
              <FormSelect
                size="small"
                label="สถานะ"
                value={formState.status}
                onChange={(event) => setField('status', event.target.value as MasterRecordStatus)}
                sx={fieldSx}
                options={[
                  { value: 'ใช้งาน', label: 'ใช้งาน' },
                  { value: 'ไม่ใช้งาน', label: 'ไม่ใช้งาน' },
                ]}
              />
            </Box>
          </Box>

          <Box>
            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>
              2. การจัดหมวดข้อมูล
            </Typography>
            <Typography sx={{ fontSize: '11px', color: textSecondary, mt: 0.35, mb: 1.1 }}>
              ผูกข้อมูลรายการกับเงื่อนไขกรองของแท็บ เพื่อให้ค้นหาและจัดการได้สะดวกขึ้น
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gap: 1.1,
                gridTemplateColumns: {
                  xs: '1fr',
                  md: 'repeat(2, minmax(0, 1fr))',
                  lg: 'repeat(3, minmax(0, 1fr))',
                },
              }}
            >
              {filterDefinitions.map((filter) => (
                <FormSelect
                  key={filter.key}
                  size="small"
                  label={filter.label}
                  value={formState.filters[filter.key]}
                  onChange={(event) => handleFilterChange(filter.key, event.target.value)}
                  sx={fieldSx}
                  options={[
                    { value: 'all', label: 'ทั้งหมด' },
                    ...filter.options.map((option) => ({ value: option, label: option })),
                  ]}
                />
              ))}
            </Box>
          </Box>

          <Box>
            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: textPrimary }}>
              3. รายละเอียดเพิ่มเติม
            </Typography>
            <Typography sx={{ fontSize: '11px', color: textSecondary, mt: 0.35, mb: 1.1 }}>
              ข้อมูลส่วนนี้ใช้สำหรับคำอธิบายการใช้งานในอนาคตและหมายเหตุภายในทีม
            </Typography>
            <Stack spacing={1.1}>
              <FormField
                size="small"
                label="คำอธิบาย"
                value={formState.description}
                onChange={(event) => setField('description', event.target.value)}
                multiline
                minRows={2}
                sx={fieldSx}
              />
              <FormField
                size="small"
                label="หมายเหตุภายใน"
                value={formState.note}
                onChange={(event) => setField('note', event.target.value)}
                multiline
                minRows={2}
                sx={fieldSx}
              />
              <FormControlLabel
                control={(
                  <Switch
                    checked={formState.isPinned}
                    onChange={(event) => setField('isPinned', event.target.checked)}
                  />
                )}
                label="ปักหมุดรายการนี้ในมุมมองรายการโปรด"
                sx={{ ml: 0.2, color: textSecondary }}
              />
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          gap: 1,
          borderTop: `1px solid ${borderStrong}`,
          bgcolor: modalHeaderBg,
        }}
      >
        <Button onClick={onClose} sx={{ textTransform: 'none', color: textSecondary }}>
          ยกเลิก
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          sx={{
            textTransform: 'none',
            boxShadow: 'none',
            bgcolor: primary,
            '&:hover': {
              bgcolor: primaryHover,
              boxShadow: 'none',
            },
          }}
        >
          {formState.id ? 'บันทึกการแก้ไข' : `บันทึก${contentTitle}`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
