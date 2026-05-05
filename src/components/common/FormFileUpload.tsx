/**
 * FormFileUpload Component
 * 
 * File upload component with preview
 */

import { useRef, ChangeEvent } from 'react';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Paper,
  FormHelperText,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Close as CloseIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';

interface FormFileUploadProps {
  label: string;
  accept?: string;
  maxSize?: number; // in MB
  value?: File | null;
  onChange: (file: File | null) => void;
  error?: string;
  required?: boolean;
}

export default function FormFileUpload({
  label,
  accept,
  maxSize = 10,
  value,
  onChange,
  error,
  required,
}: FormFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        alert(`ไฟล์มีขนาดใหญ่เกิน ${maxSize} MB`);
        return;
      }
      onChange(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {label} {required && <span style={{ color: 'red' }}>*</span>}
      </Typography>

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {value ? (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            bgcolor: 'background.default',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FileIcon color="primary" />
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {value.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {(value.size / 1024).toFixed(2)} KB
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={handleRemove}>
            <CloseIcon />
          </IconButton>
        </Paper>
      ) : (
        <Button
          variant="outlined"
          startIcon={<UploadIcon />}
          onClick={handleClick}
          fullWidth
          sx={{ py: 2, borderStyle: 'dashed' }}
        >
          เลือกไฟล์
        </Button>
      )}

      {error && (
        <FormHelperText error sx={{ mt: 0.5 }}>
          {error}
        </FormHelperText>
      )}

      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        ขนาดไฟล์สูงสุด: {maxSize} MB
      </Typography>
    </Box>
  );
}
