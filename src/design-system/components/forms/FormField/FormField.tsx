/**
 * FormField Component
 * 
 * Reusable text field with label and error handling
 */

import { TextField, TextFieldProps } from '@mui/material';

interface FormFieldProps extends Omit<TextFieldProps, 'error' | 'helperText'> {
  label: string;
  error?: string;
  required?: boolean;
}

export default function FormField({ label, error, required, ...props }: FormFieldProps) {
  return (
    <TextField
      fullWidth
      label={label}
      required={required}
      error={Boolean(error)}
      helperText={error}
      {...props}
    />
  );
}
