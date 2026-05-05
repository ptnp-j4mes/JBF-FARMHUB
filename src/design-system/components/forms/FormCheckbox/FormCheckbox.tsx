/**
 * FormCheckbox Component
 * 
 * Reusable checkbox with label
 */

import { FormControlLabel, Checkbox, FormHelperText, Box } from '@mui/material';

interface FormCheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
  disabled?: boolean;
}

export default function FormCheckbox({
  label,
  checked,
  onChange,
  error,
  disabled,
}: FormCheckboxProps) {
  return (
    <Box>
      <FormControlLabel
        control={
          <Checkbox
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
          />
        }
        label={label}
      />
      {error && <FormHelperText error>{error}</FormHelperText>}
    </Box>
  );
}
