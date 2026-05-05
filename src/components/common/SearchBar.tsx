/**
 * SearchBar Component
 * 
 * Reusable search input with icon
 */

import { TextField, InputAdornment } from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
}

export default function SearchBar({ 
  value, 
  onChange, 
  placeholder = 'ค้นหา...', 
  fullWidth = true 
}: SearchBarProps) {
  const theme = useTheme();
  return (
    <TextField
      fullWidth={fullWidth}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: alpha(theme.palette.text.secondary, 0.9), fontSize: 18 }} />
          </InputAdornment>
        ),
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          bgcolor:
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.82)
              : alpha(theme.palette.background.paper, 0.96),
        },
      }}
    />
  );
}
