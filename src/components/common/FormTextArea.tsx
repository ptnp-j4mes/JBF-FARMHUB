/**
 * FormTextArea Component
 * 
 * Reusable multi-line text area
 */

import { TextField, TextFieldProps } from '@mui/material';

interface FormTextAreaProps extends Omit<TextFieldProps, 'error' | 'helperText' | 'multiline'> {
  label: string;
  error?: string;
  required?: boolean;
  rows?: number;
}

export default function FormTextArea({
  label,
  error,
  required,
  rows = 4,
  ...props
}: FormTextAreaProps) {
  return (
    <TextField
      fullWidth
      multiline
      rows={rows}
      label={label}
      required={required}
      error={Boolean(error)}
      helperText={error}
      {...props}
    />
  );
}
