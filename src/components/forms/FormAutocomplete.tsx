/**
 * FormAutocomplete Component
 * 
 * Reusable autocomplete field with label and error handling
 */

import { Autocomplete, TextField, AutocompleteProps } from '@mui/material';

interface Option {
  value: string | number;
  label: string;
}

interface FormAutocompleteProps
  extends Omit<
    AutocompleteProps<Option, boolean, boolean, boolean>,
    'renderInput' | 'options'
  > {
  label: string;
  options: Option[];
  error?: string;
  required?: boolean;
  placeholder?: string;
}

export default function FormAutocomplete({
  label,
  options,
  error,
  required,
  placeholder,
  ...props
}: FormAutocompleteProps) {
  return (
    <Autocomplete
      options={options}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
      isOptionEqualToValue={(option, value) => option.value === value.value}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={Boolean(error)}
          helperText={error}
          placeholder={placeholder}
        />
      )}
      {...props}
    />
  );
}
