/**
 * DocumentForm Component
 * 
 * Form for creating/editing documents
 */

'use client';

import { useState, FormEvent } from 'react';
import { Box, Button, Grid } from '@mui/material';
import { FormField, FormSelect, FormTextArea, FormFileUpload } from '@/components/forms';
import { DocumentType, DocumentUploadRequest } from '../types';

interface DocumentFormProps {
  onSubmit: (data: DocumentUploadRequest) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export function DocumentForm({ onSubmit, onCancel, loading }: DocumentFormProps) {
  const [formData, setFormData] = useState<Partial<DocumentUploadRequest>>({
    title: '',
    description: '',
    documentType: DocumentType.Other,
    category: '',
    tags: [],
  });
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, string> = {};
    if (!formData.title) newErrors.title = 'กรุณาระบุชื่อเอกสาร';
    if (!formData.category) newErrors.category = 'กรุณาระบุหมวดหมู่';
    if (!file) newErrors.file = 'กรุณาเลือกไฟล์';
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    await onSubmit({
      ...formData,
      file: file!,
    } as DocumentUploadRequest);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <Grid container spacing={2}>
        <Grid size={12}>
          <FormField
            label="ชื่อเอกสาร"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            error={errors.title}
            required
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FormSelect
            label="ประเภทเอกสาร"
            value={formData.documentType || ''}
            onChange={(e) => setFormData({ ...formData, documentType: e.target.value as DocumentType })}
            options={Object.values(DocumentType).map((type) => ({
              value: type,
              label: type,
            }))}
            required
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <FormField
            label="หมวดหมู่"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            error={errors.category}
            required
          />
        </Grid>

        <Grid size={12}>
          <FormTextArea
            label="คำอธิบาย"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />
        </Grid>

        <Grid size={12}>
          <FormFileUpload
            label="ไฟล์เอกสาร"
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            value={file}
            onChange={setFile}
            error={errors.file}
            required
          />
        </Grid>

        <Grid size={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={onCancel} disabled={loading}>
              ยกเลิก
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'กำลังบันทึก...' : 'บันทึก'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
