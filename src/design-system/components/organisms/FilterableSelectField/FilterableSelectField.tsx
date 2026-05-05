'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckRounded, ExpandMoreRounded } from '@mui/icons-material';
import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme, type SxProps, type Theme } from '@mui/material/styles';
import SearchField from '@/design-system/components/atoms/SearchField/SearchField';

export type FilterableSelectValue = string | number;

export type FilterableSelectFieldOption = {
  value: FilterableSelectValue;
  label: string;
  caption?: string;
  meta?: Record<string, string>;
};

export type FilterableSelectFilter = {
  key: string;
  label: string;
  allLabel: string;
};

type FilterableSelectFieldProps = {
  label: string;
  value: FilterableSelectValue;
  options: FilterableSelectFieldOption[];
  onChange: (value: FilterableSelectValue) => void;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  placeholder?: string;
  searchPlaceholder?: string;
  noOptionsText?: string;
  filters?: FilterableSelectFilter[];
  sx?: SxProps<Theme>;
};

function isEqualValue(left: FilterableSelectValue, right: FilterableSelectValue) {
  return String(left) === String(right);
}

export default function FilterableSelectField({
  label,
  value,
  options,
  onChange,
  disabled = false,
  required = false,
  fullWidth = true,
  size = 'small',
  placeholder,
  searchPlaceholder,
  noOptionsText = 'No options found',
  filters = [],
  sx,
}: FilterableSelectFieldProps) {
  const theme = useTheme();
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [query, setQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const open = Boolean(anchorEl);
  const selectedOption = useMemo(
    () => options.find((option) => isEqualValue(option.value, value)),
    [options, value],
  );

  const filterValues = useMemo(() => {
    const next: Record<string, string[]> = {};
    filters.forEach((filter) => {
      const values = Array.from(
        new Set(
          options
            .map((option) => option.meta?.[filter.key])
            .filter((item): item is string => Boolean(item)),
        ),
      ).sort((left, right) => left.localeCompare(right));
      next[filter.key] = values;
    });
    return next;
  }, [filters, options]);
  const filterKeysSignature = useMemo(
    () => filters.map((filter) => filter.key).join('|'),
    [filters],
  );

  useEffect(() => {
    if (!open) {
      return;
    }
    setQuery('');
    const emptyFilters: Record<string, string> = {};
    filters.forEach((filter) => {
      emptyFilters[filter.key] = '';
    });
    setActiveFilters((previous) => {
      const previousKeys = Object.keys(previous);
      const nextKeys = Object.keys(emptyFilters);
      const isSameShape =
        previousKeys.length === nextKeys.length &&
        nextKeys.every((key) => previous[key] === '' && key in previous);

      return isSameShape ? previous : emptyFilters;
    });
  }, [open, filters, filterKeysSignature]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return options.filter((option) => {
      if (normalizedQuery) {
        const source = [
          option.label,
          option.caption ?? '',
          ...Object.values(option.meta ?? {}),
        ]
          .join(' ')
          .toLowerCase();
        if (!source.includes(normalizedQuery)) {
          return false;
        }
      }

      return filters.every((filter) => {
        const expected = activeFilters[filter.key];
        if (!expected) {
          return true;
        }
        return option.meta?.[filter.key] === expected;
      });
    });
  }, [activeFilters, filters, options, query]);

  const handleSelect = (nextValue: FilterableSelectValue) => {
    onChange(nextValue);
    setAnchorEl(null);
  };

  const border = alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.92 : 0.72);
  const borderSoft = alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.72 : 0.58);
  const panelBg = alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.98 : 1);
  const panelSectionBg = alpha(
    theme.palette.background.default,
    theme.palette.mode === 'dark' ? 0.58 : 0.42,
  );
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const primary = theme.palette.primary.main;
  const primarySoft = alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.2 : 0.14);

  return (
    <>
      <Box ref={anchorRef} sx={{ width: fullWidth ? '100%' : 'auto' }}>
        <TextField
          fullWidth={fullWidth}
          size={size}
          label={label}
          placeholder={placeholder ?? `Select ${label}`}
          value={selectedOption?.label ?? ''}
          required={required}
          disabled={disabled}
          onClick={(event) => {
            if (!disabled) {
              setAnchorEl(event.currentTarget);
            }
          }}
          onKeyDown={(event) => {
            if (disabled) return;
            if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
              event.preventDefault();
              setAnchorEl(event.currentTarget as HTMLElement);
            }
          }}
          InputLabelProps={{ shrink: open || Boolean(selectedOption) }}
          InputProps={{
            readOnly: true,
            endAdornment: (
              <ExpandMoreRounded
                sx={{
                  fontSize: 20,
                  color: textSecondary,
                  transform: open ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.2s',
                }}
              />
            ),
          }}
          sx={sx}
        />
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            width: anchorRef.current?.clientWidth
              ? `${anchorRef.current.clientWidth}px`
              : 420,
            maxWidth: 'calc(100vw - 24px)',
            mt: 0.5,
            overflow: 'hidden',
            borderRadius: 2,
            bgcolor: panelBg,
            border: `1px solid ${border}`,
            boxShadow: '0 18px 28px rgba(0, 0, 0, 0.35)',
          },
        }}
      >
        <Box sx={{ p: 1.5, borderBottom: `1px solid ${borderSoft}`, bgcolor: panelSectionBg }}>
          <SearchField
            autoFocus
            fullWidth
            placeholder={searchPlaceholder ?? `Search ${label}...`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => event.stopPropagation()}
            sx={{
              minWidth: 0,
              '& .MuiOutlinedInput-root': {
                bgcolor: alpha(theme.palette.background.default, theme.palette.mode === 'dark' ? 0.8 : 0.96),
                '& .MuiOutlinedInput-notchedOutline': { borderColor: border },
              },
            }}
          />

          {filters.length > 0 && (
            <Box
              sx={{
                mt: 1.25,
                display: 'grid',
                gridTemplateColumns: {
                  xs: '1fr',
                  sm: `repeat(${Math.min(filters.length, 3)}, minmax(0, 1fr))`,
                },
                gap: 1,
              }}
            >
              {filters.map((filter) => (
                <FormControl key={filter.key} size="small">
                  <InputLabel>{filter.label}</InputLabel>
                  <Select
                    value={activeFilters[filter.key] ?? ''}
                    label={filter.label}
                    onChange={(event) =>
                      setActiveFilters((previous) => ({
                        ...previous,
                        [filter.key]: event.target.value,
                      }))
                    }
                    onKeyDown={(event) => event.stopPropagation()}
                    sx={{
                      bgcolor: alpha(
                        theme.palette.background.default,
                        theme.palette.mode === 'dark' ? 0.8 : 0.96,
                      ),
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: border },
                    }}
                  >
                    <MenuItem value="">{filter.allLabel}</MenuItem>
                    {(filterValues[filter.key] ?? []).map((item) => (
                      <MenuItem key={`${filter.key}-${item}`} value={item}>
                        {item}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ))}
            </Box>
          )}
        </Box>

        <Box
          sx={{
            maxHeight: 320,
            overflowY: 'auto',
            bgcolor: panelBg,
            '&::-webkit-scrollbar': { width: 8 },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: alpha(theme.palette.divider, 0.9),
              borderRadius: 999,
            },
          }}
        >
          {filteredOptions.length ? (
            filteredOptions.map((option) => {
              const isSelected = isEqualValue(option.value, value);

              return (
                <Box
                  key={`${option.value}`}
                  onClick={() => handleSelect(option.value)}
                  sx={{
                    px: 1.5,
                    py: 1.1,
                    cursor: 'pointer',
                    borderBottom: `1px solid ${borderSoft}`,
                    bgcolor: isSelected ? primarySoft : 'transparent',
                    '&:hover': {
                      bgcolor: isSelected
                        ? alpha(primary, 0.22)
                        : alpha(theme.palette.text.primary, 0.06),
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: isSelected ? 600 : 500, color: isSelected ? primary : textPrimary }}
                    >
                      {option.label}
                    </Typography>
                    {isSelected ? <CheckRounded sx={{ fontSize: 16, color: primary }} /> : null}
                  </Box>
                  {option.caption ? (
                    <Typography
                      variant="caption"
                      sx={{ mt: 0.4, color: textSecondary, display: 'block', lineHeight: 1.35 }}
                    >
                      {option.caption}
                    </Typography>
                  ) : null}
                </Box>
              );
            })
          ) : (
            <Box sx={{ p: 2.5, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: textSecondary }}>
                {noOptionsText}
              </Typography>
            </Box>
          )}
        </Box>
      </Popover>
    </>
  );
}
