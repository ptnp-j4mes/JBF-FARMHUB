'use client';

import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Box,
  CircularProgress
} from '@mui/material';

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'checkbox';
  options?: { label: string; value: any; disabled?: boolean }[]; // Used for select type
  getOptions?: (formData: Record<string, any>) => { label: string; value: any; disabled?: boolean }[];
  required?: boolean;
  allowEmpty?: boolean; // for optional number fields
  placeholder?: string;
}

export interface MasterCrudDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  title: string;
  fields: FieldConfig[];
  initialData?: any; // null if creating, object if editing
}

export function MasterCrudDialog({
  open,
  onClose,
  onSave,
  title,
  fields,
  initialData,
}: MasterCrudDialogProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      if (initialData) {
        const normalized = { ...initialData };
        fields.forEach((field) => {
          if (field.type !== 'number' || !field.allowEmpty) {
            return;
          }
          const value = normalized[field.name];
          if (value === 0 || value === null || value === undefined) {
            normalized[field.name] = '';
          }
        });
        setFormData(normalized);
      } else {
        // Init with empty / defaults
        const defaults: Record<string, any> = {};
        fields.forEach(f => {
          if (f.type === 'checkbox') defaults[f.name] = false;
          else if (f.type === 'number') defaults[f.name] = '';
          else defaults[f.name] = '';
        });
        setFormData(defaults);
      }
      setErrors({});
    }
  }, [open, initialData, fields]);

  const handleChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const sanitizeNumberInput = (value: string) => {
    // Keep only digits and one decimal separator.
    const cleaned = value.replace(/[^\d.]/g, '');
    const [firstPart, ...restParts] = cleaned.split('.');
    if (restParts.length === 0) {
      return cleaned;
    }
    return `${firstPart}.${restParts.join('')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: Record<string, string> = {};
    const payload: Record<string, any> = { ...formData };

    fields.forEach((field) => {
      if (field.type !== 'number') {
        return;
      }

      const raw = payload[field.name];
      const normalizedRaw = typeof raw === 'string' ? raw.trim() : raw;
      const isEmpty = normalizedRaw === '' || normalizedRaw === null || normalizedRaw === undefined;

      if (isEmpty) {
        if (field.required) {
          nextErrors[field.name] = `กรุณากรอก${field.label}`;
          return;
        }
        payload[field.name] = field.allowEmpty ? null : 0;
        return;
      }

      const parsed = Number(normalizedRaw);
      if (!Number.isFinite(parsed)) {
        nextErrors[field.name] = `${field.label}ต้องเป็นตัวเลขเท่านั้น`;
        return;
      }
      payload[field.name] = parsed;
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      console.error("Failed to save", err);

      const validationErrors = err?.response?.data?.errors;
      const flattenedValidationMessage =
        validationErrors && typeof validationErrors === 'object'
          ? Object.values(validationErrors)
              .flatMap((value) => (Array.isArray(value) ? value : [value]))
              .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
              .join('\n')
          : '';

      const apiMessage =
        flattenedValidationMessage ||
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        (typeof err?.response?.data === 'string' ? err.response.data : '') ||
        err?.message ||
        'บันทึกข้อมูลไม่สำเร็จ';

      alert(apiMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2} pt={1}>
            {fields.map((field) => {
              if (field.type === 'checkbox') {
                return (
                  <FormControlLabel
                    key={field.name}
                    control={
                      <Checkbox
                        checked={!!formData[field.name]}
                        onChange={(e) => handleChange(field.name, e.target.checked)}
                      />
                    }
                    label={field.label}
                  />
                );
              }

              if (field.type === 'select') {
                const options = field.getOptions ? field.getOptions(formData) : field.options ?? [];
                return (
                  <TextField
                    key={field.name}
                    select
                    fullWidth
                    label={field.label}
                    value={formData[field.name] ?? ''}
                    required={field.required}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                  >
                    {options.map((option) => (
                      <MenuItem key={option.value} value={option.value} disabled={Boolean(option.disabled)}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                );
              }

              return (
                <TextField
                  key={field.name}
                  fullWidth
                  label={field.label}
                  type="text"
                  value={formData[field.name] ?? ''}
                  placeholder={field.placeholder ?? `กรอก${field.label}`}
                  required={field.required}
                  onChange={(e) => {
                    if (field.type === 'number') {
                      handleChange(field.name, sanitizeNumberInput(e.target.value));
                      return;
                    }
                    handleChange(field.name, e.target.value);
                  }}
                  inputProps={field.type === 'number' ? { inputMode: 'decimal', pattern: '[0-9]*[.]?[0-9]*' } : {}}
                  error={Boolean(errors[field.name])}
                  helperText={errors[field.name]}
                />
              );
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            ยกเลิก
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            บันทึก
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
