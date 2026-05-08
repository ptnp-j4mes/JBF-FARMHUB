'use client';

import { TextField, InputAdornment, type TextFieldProps } from '@mui/material';
import { Search } from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

interface SearchFieldProps extends Omit<TextFieldProps, 'variant'> {
  placeholder: string;
}

export default function SearchField({
  placeholder,
  InputProps: externalInputProps,
  sx,
  ...props
}: SearchFieldProps) {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const borderColor = alpha(theme.palette.divider, isDarkMode ? 0.82 : 0.68);
  const backgroundColor = alpha(theme.palette.background.paper, isDarkMode ? 0.82 : 0.98);

  return (
    <TextField
      {...props}
      placeholder={placeholder}
      variant="outlined"
      size="small"
      InputProps={{
        ...externalInputProps,
        startAdornment: externalInputProps?.startAdornment ?? (
          <InputAdornment position="start">
            <Search sx={{ fontSize: 18, color: alpha(theme.palette.text.secondary, 0.9) }} />
          </InputAdornment>
        ),
      }}
      sx={[
        {
          minWidth: { xs: 0, sm: 220 },
          width: '100%',
          '& .MuiOutlinedInput-root': {
            minHeight: 40,
            borderRadius: 10,
            bgcolor: backgroundColor,
            color: 'text.primary',
            transition: theme.transitions.create(
              ['box-shadow', 'border-color', 'background-color'],
              { duration: theme.transitions.duration.shorter },
            ),
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: alpha(theme.palette.primary.main, isDarkMode ? 0.65 : 0.6),
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
              borderWidth: 1.5,
            },
            '&.Mui-focused': {
              boxShadow: `0 0 0 4px ${alpha(
                theme.palette.primary.main,
                isDarkMode ? 0.22 : 0.14,
              )}`,
            },
          },
          '& .MuiInputBase-input::placeholder': {
            color: alpha(theme.palette.text.secondary, 0.9),
            opacity: 1,
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    />
  );
}
