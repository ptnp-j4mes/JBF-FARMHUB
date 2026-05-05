/**
 * FormSelect Component
 * 
 * Reusable select field with label and error handling
 */

import { useId } from 'react';
import { FormControl, InputLabel, Select, MenuItem, FormHelperText, SelectProps } from '@mui/material';

interface Option {
  value: string | number;
  label: string;
}

interface FormSelectProps extends Omit<SelectProps, 'error'> {
  label: string;
  options: Option[];
  error?: string;
  required?: boolean;
}

export default function FormSelect({ label, options, error, required, ...props }: FormSelectProps) {
  const selectId = useId();
  const labelId = `${selectId}-label`;

  return (
    <FormControl fullWidth error={Boolean(error)} required={required}>
      <InputLabel id={labelId}>{label}</InputLabel>
      <Select id={selectId} labelId={labelId} label={label} {...props}>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
}
