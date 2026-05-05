/**
 * FormDatePicker Component
 * 
 * Reusable date picker with label and error handling
 */

import { TextField, TextFieldProps } from '@mui/material';

interface FormDatePickerProps extends Omit<TextFieldProps, 'type' | 'error' | 'helperText'> {
  label: string;
  error?: string;
  required?: boolean;
}

export default function FormDatePicker({ label, error, required, ...props }: FormDatePickerProps) {
  return (
    <TextField
      fullWidth
      type="date"
      label={label}
      required={required}
      error={Boolean(error)}
      helperText={error}
      InputLabelProps={{
        shrink: true,
      }}
      {...props}
    />
  );
}
