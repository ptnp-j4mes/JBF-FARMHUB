'use client';

import {
  Add,
  Check,
  ChevronRight,
  Close,
  FilterList,
  RestartAlt,
  Search,
  Settings,
  UnfoldLess,
  UnfoldMore,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Collapse,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import PermissionStatsSummary from './PermissionStatsSummary';

export type PermissionMatrixFilterOption = {
  value: string;
  label: string;
};

export type PermissionMatrixRow = {
  code: string;
  action: string;
  actionLabel: string;
  description: string;
  isReady: boolean;
  checked: boolean;
  baselineChecked: boolean;
  disabled: boolean;
};

export type PermissionMatrixModule = {
  moduleSlug: string;
  moduleLabel: string;
  readyCount: number;
  totalCount: number;
  selectedCount: number;
  addedCount: number;
  removedCount: number;
  rows: PermissionMatrixRow[];
};

export type PermissionMatrixSection = {
  sectionKey: string;
  sectionLabel: string;
  modules: PermissionMatrixModule[];
};

type PermissionMatrixEditorProps = {
  topActionLabel?: string;
  showTopBar?: boolean;
  showLegend?: boolean;
  title: string;
  subtitle: string;
  stats?: {
    base: number;
    added: number;
    removed: number;
    effective: number;
  };
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterValue: string;
  onFilterChange: (value: string) => void;
  filterOptions: PermissionMatrixFilterOption[];
  onResetFilters: () => void;
  resetDisabled?: boolean;
  allModulesExpanded: boolean;
  onToggleAllModules: () => void;
  sections: PermissionMatrixSection[];
  expandedModuleSlugs: string[];
  onToggleModule: (moduleSlug: string) => void;
  onToggleRow: (row: PermissionMatrixRow) => void;
  emptyText?: string;
  maxHeight?: number;
};

function rowStatusText(row: PermissionMatrixRow): string {
  if (!row.isReady) {
    return 'ยังไม่พร้อมใช้';
  }
  if (row.baselineChecked && !row.checked) {
    return 'ลดแล้ว';
  }
  if (!row.baselineChecked && row.checked) {
    return 'เพิ่มแล้ว';
  }
  if (row.checked) {
    return 'เลือกแล้ว';
  }
  return 'ใช้ได้';
}

export default function PermissionMatrixEditor({
  topActionLabel = 'กำหนดสิทธิ์พื้นฐาน',
  showTopBar = true,
  showLegend = true,
  title,
  subtitle,
  stats,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'ค้นหาชื่อ หรือ permission...',
  filterValue,
  onFilterChange,
  filterOptions,
  onResetFilters,
  resetDisabled = false,
  allModulesExpanded,
  onToggleAllModules,
  sections,
  expandedModuleSlugs,
  onToggleModule,
  onToggleRow,
  emptyText = 'ไม่พบสิทธิ์ที่ค้นหา',
  maxHeight = 420,
}: PermissionMatrixEditorProps) {
  const theme = useTheme();
  const textPrimary = theme.palette.text.primary;
  const textSecondary = alpha(theme.palette.text.secondary, 0.9);
  const [filterAnchorEl, setFilterAnchorEl] = useState<HTMLElement | null>(null);

  return (
    <Box sx={{ display: 'grid', gap: 1.35 }}>
      {showTopBar && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            alignItems: { xs: 'flex-start', lg: 'center' },
            justifyContent: 'space-between',
            gap: 1.25,
          }}
        >
          <Button
            size="small"
            variant="contained"
            startIcon={<Settings fontSize="small" />}
            sx={{
              textTransform: 'none',
              borderRadius: 10,
              px: 2,
              py: 0.7,
              bgcolor: alpha(theme.palette.primary.dark, 0.96),
              border: `1px solid ${alpha(theme.palette.common.black, 0.4)}`,
              color: alpha(theme.palette.common.white, 0.96),
              boxShadow: 'none',
              '&:hover': {
                bgcolor: theme.palette.primary.dark,
                boxShadow: 'none',
              },
            }}
          >
            {topActionLabel}
          </Button>

          {stats && (
            <PermissionStatsSummary
              base={stats.base}
              added={stats.added}
              removed={stats.removed}
              effective={stats.effective}
            />
          )}
        </Box>
      )}

      <Paper
        variant="outlined"
        sx={{
          p: { xs: 1.5, md: 2 },
          borderRadius: 10,
          borderColor: alpha(theme.palette.divider, 0.48),
          bgcolor: alpha(theme.palette.background.default, 0.52),
          boxShadow: `inset 0 1px 0 ${alpha(textPrimary, 0.03)}`,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: alpha(textPrimary, 0.9) }}>
          {title}
        </Typography>
        <Typography
          variant="body2"
          sx={{
            color: alpha(textPrimary, 0.62),
            display: 'block',
            mt: 0.9,
            mb: 1.6,
          }}
        >
          {subtitle}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 1.2,
            mb: 0.95,
            width: '100%',
            pr: '8px',
          }}
        >
          <TextField
            size="small"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search
                    sx={{
                      fontSize: 20,
                      color: alpha(textPrimary, 0.66),
                    }}
                  />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={(event) => setFilterAnchorEl(event.currentTarget)}
                    sx={{
                      mr: 0.25,
                      color: filterValue !== 'all' ? theme.palette.primary.main : textSecondary,
                      bgcolor:
                        filterValue !== 'all' ? alpha(theme.palette.primary.main, 0.14) : 'transparent',
                    }}
                  >
                    <FilterList fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              width: '100%',
              '& .MuiInputBase-root': {
                minHeight: 40,
                borderRadius: 10,
                bgcolor: alpha(theme.palette.background.paper, 0.9),
                pr: 0.75,
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.divider, 0.9),
                  borderWidth: '1px',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: alpha(theme.palette.divider, 0.7),
                },
              },
              '& .MuiInputBase-input': {
                fontSize: '0.92rem',
                color: alpha(textPrimary, 0.88),
                lineHeight: 1.3,
                '&::placeholder': {
                  color: alpha(textPrimary, 0.45),
                  opacity: 1,
                },
              },
            }}
          />

          <Menu
            anchorEl={filterAnchorEl}
            open={Boolean(filterAnchorEl)}
            onClose={() => setFilterAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            PaperProps={{
              sx: {
                mt: 1,
                borderRadius: 10,
                minWidth: 220,
                border: 1,
                borderColor: 'divider',
                backgroundImage: 'none',
              },
            }}
          >
            {filterOptions.map((option) => (
              <MenuItem
                key={`permission-filter-menu-${option.value}`}
                selected={filterValue === option.value}
                onClick={() => {
                  onFilterChange(option.value);
                  setFilterAnchorEl(null);
                }}
              >
                {option.label}
              </MenuItem>
            ))}
          </Menu>

          <Box
            sx={{
              display: 'flex',
              gap: 1,
              width: { xs: '100%', sm: 'auto' },
              flexWrap: { xs: 'wrap', sm: 'nowrap' },
              alignItems: 'center',
              flexShrink: 0,
            }}
          >
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={allModulesExpanded ? <UnfoldLess sx={{ fontSize: 18 }} /> : <UnfoldMore sx={{ fontSize: 18 }} />}
              onClick={onToggleAllModules}
              disabled={sections.length === 0}
              sx={{
                borderColor: alpha(theme.palette.divider, 0.5),
                bgcolor: alpha(theme.palette.background.paper, 0.9),
                '&:hover': { bgcolor: alpha(theme.palette.background.paper, 0.8) },
                textTransform: 'none',
                height: 40,
                borderRadius: 10,
                px: 1.3,
                width: { xs: '100%', sm: 132 },
                whiteSpace: 'nowrap',
              }}
            >
              {allModulesExpanded ? 'ยุบทั้งหมด' : 'กางทั้งหมด'}
            </Button>

            <Button
              variant="outlined"
              color="inherit"
              size="small"
              startIcon={<RestartAlt sx={{ fontSize: 18 }} />}
              onClick={onResetFilters}
              disabled={resetDisabled}
              sx={{
                borderColor: alpha(theme.palette.divider, 0.5),
                bgcolor: resetDisabled
                  ? alpha(theme.palette.action.disabledBackground, 0.35)
                  : alpha(theme.palette.background.paper, 0.9),
                '&:hover': { bgcolor: alpha(theme.palette.background.paper, 0.8) },
                textTransform: 'none',
                height: 40,
                borderRadius: 10,
                px: 1.3,
                width: { xs: '100%', sm: 168 },
                whiteSpace: 'nowrap',
              }}
            >
              รีเซ็ตเป็นค่าเริ่มต้น
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            mt: 1.45,
            p: 1.15,
            borderRadius: 10,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.33),
          }}
        >
          <Box
            sx={{
              maxHeight,
              overflowY: 'auto',
              pr: 0.4,
              scrollbarGutter: 'stable',
              scrollbarWidth: 'thin',
              scrollbarColor: `${alpha(theme.palette.primary.main, 0.5)} transparent`,
              '&::-webkit-scrollbar': { width: 8 },
              '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
              '&::-webkit-scrollbar-thumb': {
                borderRadius: 10,
                backgroundColor: alpha(theme.palette.primary.main, 0.4),
              },
            }}
          >
            {sections.map((section) => (
              <Box key={`permission-section-${section.sectionKey}`} sx={{ mb: 1.4 }}>
                <Typography
                  sx={{
                    px: 1,
                    pt: 0.6,
                    pb: 0.9,
                    fontSize: '0.76rem',
                    fontWeight: 800,
                    color: alpha(textPrimary, 0.68),
                  }}
                >
                  {section.sectionLabel}
                </Typography>

                <Box sx={{ display: 'grid', gap: 1 }}>
                  {section.modules.map((module) => {
                    const moduleExpanded = expandedModuleSlugs.includes(module.moduleSlug);
                    return (
                      <Box
                        key={`permission-module-${module.moduleSlug}`}
                        sx={{
                          borderRadius: 10,
                          border: `1px solid ${alpha(theme.palette.divider, 0.42)}`,
                          bgcolor: alpha(theme.palette.background.paper, 0.28),
                          overflow: 'hidden',
                        }}
                      >
                        <Box
                          component="button"
                          type="button"
                          onClick={() => onToggleModule(module.moduleSlug)}
                          sx={{
                            width: '100%',
                            px: 1.25,
                            py: 1,
                            border: 'none',
                            background: 'transparent',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.85 }}>
                            <ChevronRight
                              sx={{
                                fontSize: 20,
                                color: textSecondary,
                                transform: moduleExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                transition: 'transform 0.2s',
                              }}
                            />
                            <Typography sx={{ fontSize: '0.99rem', fontWeight: 700, color: alpha(textPrimary, 0.92) }}>
                              {module.moduleLabel}{' '}
                              <Box component="span" sx={{ color: alpha(textPrimary, 0.62), fontWeight: 500 }}>
                                ({module.moduleSlug})
                              </Box>
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.7 }}>
                            <Typography
                              sx={{ fontSize: '0.76rem', color: alpha(textPrimary, 0.72), fontWeight: 700 }}
                            >
                              ใช้ได้ {module.readyCount}/{module.totalCount}
                            </Typography>
                            {module.addedCount > 0 && (
                              <Box
                                sx={{
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: 10,
                                  border: `1px solid ${alpha(theme.palette.success.main, 0.45)}`,
                                  bgcolor: alpha(theme.palette.success.main, 0.12),
                                  color: alpha(theme.palette.success.dark, 0.95),
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  lineHeight: 1.2,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                เพิ่ม +{module.addedCount}
                              </Box>
                            )}
                            {module.removedCount > 0 && (
                              <Box
                                sx={{
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: 10,
                                  border: `1px solid ${alpha(theme.palette.error.main, 0.45)}`,
                                  bgcolor: alpha(theme.palette.error.main, 0.12),
                                  color: alpha(theme.palette.error.dark, 0.95),
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  lineHeight: 1.2,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                ลด -{module.removedCount}
                              </Box>
                            )}
                            {module.selectedCount > 0 && module.addedCount === 0 && module.removedCount === 0 && (
                              <Box
                                sx={{
                                  px: 1,
                                  py: 0.25,
                                  borderRadius: 10,
                                  border: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
                                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                                  color: alpha(theme.palette.primary.dark, 0.95),
                                  fontSize: '0.72rem',
                                  fontWeight: 700,
                                  lineHeight: 1.2,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                เลือก {module.selectedCount}
                              </Box>
                            )}
                          </Box>
                        </Box>

                        <Collapse in={moduleExpanded} timeout="auto" unmountOnExit>
                          <Box
                            sx={{
                              p: 1.5,
                              pt: 0,
                              display: 'grid',
                              gridTemplateColumns: {
                                xs: 'repeat(1, 1fr)',
                                sm: 'repeat(2, 1fr)',
                                md: 'repeat(3, 1fr)',
                                lg: 'repeat(4, 1fr)',
                              },
                              gap: 1,
                              borderTop: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
                              bgcolor: alpha(theme.palette.background.paper, 0.1),
                              mt: 0.5,
                            }}
                          >
                            {module.rows.map((row) => {
                              const isReduced = row.baselineChecked && !row.checked;
                              const isAdded = !row.baselineChecked && row.checked;
                              const isSelectedNotReady = row.checked && !row.isReady;
                              const isFromBaseline = row.baselineChecked && row.checked;

                              return (
                                <Box
                                  key={`permission-row-${row.code}`}
                                  onClick={() => {
                                    if (row.disabled) {
                                      return;
                                    }
                                    onToggleRow(row);
                                  }}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.75,
                                    width: '100%',
                                    minHeight: 58,
                                    px: 1,
                                    py: 0.75,
                                    borderRadius: 10,
                                    bgcolor: isReduced
                                      ? alpha(theme.palette.error.main, 0.14)
                                      : isAdded
                                        ? alpha(theme.palette.success.main, 0.12)
                                        : isSelectedNotReady
                                          ? alpha(theme.palette.warning.main, 0.14)
                                          : isFromBaseline
                                            ? theme.palette.mode === 'dark'
                                              ? alpha(textPrimary, 0.2)
                                              : alpha(theme.palette.grey[600], 0.26)
                                            : row.disabled
                                              ? alpha(theme.palette.grey[500], 0.22)
                                              : theme.palette.mode === 'dark'
                                                ? alpha(theme.palette.common.white, 0.06)
                                                : alpha(theme.palette.grey[300], 0.5),
                                    borderWidth: 1,
                                    borderStyle: 'solid',
                                    borderColor: isReduced
                                      ? alpha(theme.palette.error.main, 0.42)
                                      : isAdded
                                        ? alpha(theme.palette.success.main, 0.42)
                                        : isSelectedNotReady
                                          ? alpha(theme.palette.warning.main, 0.48)
                                          : isFromBaseline
                                            ? theme.palette.mode === 'dark'
                                              ? alpha(textPrimary, 0.32)
                                              : alpha(theme.palette.grey[700], 0.38)
                                            : row.disabled
                                              ? alpha(theme.palette.grey[600], 0.38)
                                              : theme.palette.mode === 'dark'
                                                ? alpha(theme.palette.common.white, 0.22)
                                                : alpha(theme.palette.grey[700], 0.42),
                                    color: isReduced
                                      ? theme.palette.mode === 'dark'
                                        ? theme.palette.error.light
                                        : theme.palette.error.dark
                                      : isAdded
                                        ? theme.palette.mode === 'dark'
                                          ? alpha(theme.palette.success.light, 0.9)
                                          : theme.palette.success.dark
                                        : isSelectedNotReady
                                          ? theme.palette.mode === 'dark'
                                            ? alpha(theme.palette.warning.light, 0.9)
                                            : theme.palette.warning.dark
                                          : isFromBaseline
                                            ? theme.palette.mode === 'dark'
                                              ? alpha(theme.palette.common.white, 0.86)
                                              : alpha(textPrimary, 0.9)
                                            : row.disabled
                                              ? alpha(textPrimary, 0.5)
                                              : theme.palette.mode === 'dark'
                                                ? alpha(theme.palette.common.white, 0.82)
                                                : alpha(textPrimary, 0.9),
                                    cursor: row.disabled ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      bgcolor: isReduced
                                        ? alpha(theme.palette.error.main, 0.22)
                                        : isAdded
                                          ? alpha(theme.palette.success.main, 0.18)
                                          : isSelectedNotReady
                                            ? alpha(theme.palette.warning.main, 0.2)
                                            : isFromBaseline
                                              ? theme.palette.mode === 'dark'
                                                ? alpha(textPrimary, 0.26)
                                                : alpha(theme.palette.grey[700], 0.32)
                                              : row.disabled
                                                ? alpha(theme.palette.grey[500], 0.22)
                                                : theme.palette.mode === 'dark'
                                                  ? alpha(theme.palette.common.white, 0.1)
                                                  : alpha(theme.palette.grey[300], 0.66),
                                    },
                                  }}
                                >
                                  <Box sx={{ width: 16, display: 'inline-flex', alignItems: 'center' }}>
                                    {isReduced ? (
                                      <Close sx={{ fontSize: 14 }} />
                                    ) : isAdded ? (
                                      <Add sx={{ fontSize: 14 }} />
                                    ) : row.checked ? (
                                      <Check sx={{ fontSize: 14 }} />
                                    ) : null}
                                  </Box>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700 }}>
                                      {row.actionLabel}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      sx={{
                                        fontSize: '0.65rem',
                                        opacity: 0.74,
                                        whiteSpace: 'nowrap',
                                      }}
                                    >
                                      {rowStatusText(row)}
                                    </Typography>
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>
                        </Collapse>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            ))}

            {sections.length === 0 && (
              <Typography sx={{ px: 1, py: 1.5, fontSize: '0.8rem', color: alpha(textPrimary, 0.65) }}>
                {emptyText}
              </Typography>
            )}
          </Box>
        </Box>

        {showLegend && (
          <Box
            sx={{
              mt: 1.45,
              pt: 1.25,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
              color: alpha(textPrimary, 0.55),
              fontSize: '0.75rem',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: 10,
                  bgcolor: alpha(textPrimary, 0.2),
                }}
              />
              <Typography variant="caption" sx={{ color: 'inherit' }}>
                สิทธิจากฐานบทบาท
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: 10,
                  bgcolor: alpha(theme.palette.success.main, 0.2),
                  border: `1px solid ${alpha(theme.palette.success.main, 0.4)}`,
                }}
              />
              <Typography variant="caption" sx={{ color: 'inherit' }}>
                เพิ่มสิทธิ
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: 10,
                  bgcolor: alpha(theme.palette.error.main, 0.2),
                  border: `1px solid ${alpha(theme.palette.error.main, 0.4)}`,
                }}
              />
              <Typography variant="caption" sx={{ color: 'inherit' }}>
                ลดสิทธิ
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: 10,
                  bgcolor: alpha(theme.palette.grey[500], 0.2),
                  border: `1px solid ${alpha(theme.palette.grey[500], 0.42)}`,
                }}
              />
              <Typography variant="caption" sx={{ color: 'inherit' }}>
                ยังไม่พร้อมใช้ (เลือกไม่ได้)
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
