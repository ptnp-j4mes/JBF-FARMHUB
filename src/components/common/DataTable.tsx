'use client';

/**
 * DataTable Component
 *
 * Generic reusable table with sorting, pagination, and actions
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  CircularProgress,
  Typography,
  TableSortLabel,
  Box,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  DeleteOutline,
  EditOutlined,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import type { SxProps, Theme } from '@mui/material/styles';
import { translateText } from '@/lib/text';

const TABLE_HEADER_FONT_SIZE = '13px';
const TABLE_BODY_FONT_SIZE = '12px';
const TABLE_HEADER_LINE_HEIGHT = 1.4;
const TABLE_BODY_LINE_HEIGHT = 1.45;
const TABLE_HEADER_MIN_HEIGHT = 48;
const TABLE_BODY_MIN_HEIGHT = 56;
const TABLE_BODY_CONTENT_MIN_HEIGHT = 40;
const EXTERNAL_SCROLLBAR_WIDTH = 12;
const EXTERNAL_SCROLLBAR_VISUAL_INSET = 2;
const EXTERNAL_SCROLLBAR_VISUAL_WIDTH = 6;
const EXTERNAL_SCROLLBAR_MIN_THUMB_HEIGHT = 28;
const SCROLL_OVERFLOW_EPSILON = 1;
const ENTITY_ID_COLUMN_ID = 'id';
const ENTITY_CODE_COLUMN_ID = 'code';
const ENTITY_STATUS_COLUMN_ID = 'status';
const ENTITY_MANAGE_COLUMN_ID = 'manage';
const DEFAULT_ID_COLUMN_WIDTH = 48;
const DEFAULT_CODE_COLUMN_WIDTH = 88;
const DEFAULT_STATUS_COLUMN_WIDTH = 74;
const DEFAULT_MANAGE_COLUMN_WIDTH = 92;
const ID_COLUMN_LABEL = 'ID';
const CODE_COLUMN_LABEL = 'รหัส';
const STATUS_COLUMN_LABEL = 'สถานะ';
const MANAGE_COLUMN_LABEL = 'จัดการ';
const TABLE_HEADER_BACKGROUND = (theme: Theme) =>
  theme.palette.mode === 'dark'
    ? alpha(theme.palette.primary.main, 0.12)
    : alpha(theme.palette.primary.main, 0.06);
const HIDDEN_NATIVE_SCROLLBAR_SX: SxProps<Theme> = {
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': {
    width: 0,
    height: 0,
  },
};

function resolveCellJustifyContent(
  align: 'left' | 'center' | 'right' | undefined,
): 'flex-start' | 'center' | 'flex-end' {
  if (align === 'right') return 'flex-end';
  if (align === 'center') return 'center';
  return 'flex-start';
}

export interface Column<T> {
  id: keyof T | string;
  label: string;
  align?: 'left' | 'center' | 'right';
  minWidth?: number;
  width?: number;
  format?: (
    value: unknown,
    row: T,
    meta?: {
      rowIndex: number;
      page: number;
      rowsPerPage: number;
    },
  ) => React.ReactNode;
  sortable?: boolean;
  sortAccessor?: (row: T) => unknown;
}

interface CellRenderMeta {
  rowIndex: number;
  page: number;
  rowsPerPage: number;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rowsPerPage: number) => void;
  onRowClick?: (row: T) => void;
  onRowDoubleClick?: (row: T) => void;
  sortable?: boolean;
  rowHeight?: number;
  stickyHeader?: boolean;
  detachedHeader?: boolean;
  paperSx?: SxProps<Theme>;
  tableContainerSx?: SxProps<Theme>;
  tableSx?: SxProps<Theme>;
  headerCellSx?: Record<string, unknown>;
  rowsPerPageOptions?: number[];
  footerSummaryText?: string;
  enforceEntityColumns?: boolean;
  lockEntityColumns?: boolean;
  includeCodeColumn?: boolean;
  includeStatusColumn?: boolean;
  includeManagementColumn?: boolean;
  idColumnWidth?: number;
  codeColumnWidth?: number;
  statusColumnWidth?: number;
  manageColumnWidth?: number;
  renderManageActions?: (row: T, meta: CellRenderMeta) => React.ReactNode;
  onEditRow?: (row: T) => void;
  onDeleteRow?: (row: T) => void;
  onToggleRowStatus?: (row: T) => void;
  isRowActive?: (row: T) => boolean;
}

export default function DataTable<T extends { id?: number | string }>({
  columns,
  data,
  loading = false,
  emptyMessage,
  page = 0,
  rowsPerPage = 10,
  totalCount,
  onPageChange,
  onRowsPerPageChange,
  onRowClick,
  onRowDoubleClick,
  sortable = true,
  rowHeight,
  stickyHeader = false,
  detachedHeader = false,
  paperSx,
  tableContainerSx,
  tableSx,
  headerCellSx,
  rowsPerPageOptions = [25, 50, 100],
  footerSummaryText,
  enforceEntityColumns = true,
  lockEntityColumns = false,
  includeCodeColumn = false,
  includeStatusColumn = false,
  includeManagementColumn = true,
  idColumnWidth = DEFAULT_ID_COLUMN_WIDTH,
  codeColumnWidth = DEFAULT_CODE_COLUMN_WIDTH,
  statusColumnWidth = DEFAULT_STATUS_COLUMN_WIDTH,
  manageColumnWidth = DEFAULT_MANAGE_COLUMN_WIDTH,
  renderManageActions,
  onEditRow,
  onDeleteRow,
  onToggleRowStatus,
  isRowActive = (row) => {
    const isActiveValue = (row as Record<string, unknown>)?.isActive;
    if (typeof isActiveValue === 'boolean') {
      return isActiveValue;
    }
    const statusValue = (row as Record<string, unknown>)?.status;
    return statusValue === 'Active' || statusValue === 'ใช้งาน';
  },
}: DataTableProps<T>) {
  const theme = useTheme();
  const t = translateText;
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollMetrics, setScrollMetrics] = useState({
    scrollHeight: 0,
    clientHeight: 0,
    scrollTop: 0,
  });

  const normalizeColumnId = useCallback((id: keyof T | string): string => String(id).trim().toLowerCase(), []);

  const isIdColumn = useCallback(
    (column: Column<T>): boolean => normalizeColumnId(column.id) === ENTITY_ID_COLUMN_ID,
    [normalizeColumnId],
  );

  const isCodeColumn = useCallback(
    (column: Column<T>): boolean => {
      const normalized = normalizeColumnId(column.id);
      if (normalized === ENTITY_CODE_COLUMN_ID) {
        return true;
      }
      return column.label.trim().toLowerCase() === CODE_COLUMN_LABEL;
    },
    [normalizeColumnId],
  );

  const isStatusColumn = useCallback(
    (column: Column<T>): boolean => {
      const normalized = normalizeColumnId(column.id);
      if (normalized === ENTITY_STATUS_COLUMN_ID || normalized === 'isactive') {
        return true;
      }
      return column.label.trim().toLowerCase() === STATUS_COLUMN_LABEL;
    },
    [normalizeColumnId],
  );

  const isManagementColumn = useCallback(
    (column: Column<T>): boolean => {
      const normalized = normalizeColumnId(column.id);
      if (
        normalized === ENTITY_MANAGE_COLUMN_ID ||
        normalized === 'action' ||
        normalized === 'actions'
      ) {
        return true;
      }

      return column.label.trim().toLowerCase() === MANAGE_COLUMN_LABEL;
    },
    [normalizeColumnId],
  );

  const toStyleObject = (style: SxProps<Theme> | undefined): Record<string, unknown> => {
    if (!style || Array.isArray(style) || typeof style === 'function') {
      return {};
    }
    return style as Record<string, unknown>;
  };

  const withOptionalSx = (...styles: Array<SxProps<Theme> | undefined>): SxProps<Theme> => {
    return styles.reduce<Record<string, unknown>>((acc, style) => {
      return { ...acc, ...toStyleObject(style) };
    }, {});
  };

  const updateScrollMetrics = useCallback((container?: HTMLDivElement | null) => {
    const target = container ?? scrollContainerRef.current;
    if (!target) {
      setScrollMetrics({ scrollHeight: 0, clientHeight: 0, scrollTop: 0 });
      return;
    }

    setScrollMetrics((prev) => {
      const next = {
        scrollHeight: target.scrollHeight,
        clientHeight: target.clientHeight,
        scrollTop: target.scrollTop,
      };
      if (
        prev.scrollHeight === next.scrollHeight &&
        prev.clientHeight === next.clientHeight &&
        prev.scrollTop === next.scrollTop
      ) {
        return prev;
      }
      return next;
    });
  }, []);

  const setScrollContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      scrollContainerRef.current = node;
      if (!node) {
        setScrollMetrics({ scrollHeight: 0, clientHeight: 0, scrollTop: 0 });
        return;
      }

      updateScrollMetrics(node);
    },
    [updateScrollMetrics],
  );

  const handleTableContainerScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      updateScrollMetrics(event.currentTarget);
    },
    [updateScrollMetrics],
  );

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      updateScrollMetrics();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [
    updateScrollMetrics,
    data.length,
    rowsPerPage,
    page,
    loading,
    rowHeight,
    detachedHeader,
  ]);

  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer || typeof ResizeObserver === 'undefined') {
      return;
    }

    const observer = new ResizeObserver(() => {
      updateScrollMetrics(scrollContainer);
    });
    observer.observe(scrollContainer);

    const tableElement = scrollContainer.querySelector('table');
    if (tableElement) {
      observer.observe(tableElement);
    }

    return () => observer.disconnect();
  }, [updateScrollMetrics, detachedHeader, data.length]);

  const hasVerticalOverflow =
    scrollMetrics.scrollHeight - scrollMetrics.clientHeight > SCROLL_OVERFLOW_EPSILON;
  const externalScrollbarColumnWidth = EXTERNAL_SCROLLBAR_WIDTH;
  const externalScrollbarThumb = useMemo(() => {
    const visualTrackHeight = Math.max(
      scrollMetrics.clientHeight - EXTERNAL_SCROLLBAR_VISUAL_INSET * 2,
      0,
    );
    if (visualTrackHeight <= 0) {
      return { height: 0, top: 0 };
    }

    if (!hasVerticalOverflow) {
      return { height: visualTrackHeight, top: 0 };
    }

    const thumbHeight = Math.max(
      (scrollMetrics.clientHeight / scrollMetrics.scrollHeight) * visualTrackHeight,
      EXTERNAL_SCROLLBAR_MIN_THUMB_HEIGHT,
    );
    const clampedThumbHeight = Math.min(thumbHeight, visualTrackHeight);

    const maxScrollTop = Math.max(scrollMetrics.scrollHeight - scrollMetrics.clientHeight, 0);
    const maxThumbTop = Math.max(visualTrackHeight - clampedThumbHeight, 0);
    const ratio = maxScrollTop > 0 ? scrollMetrics.scrollTop / maxScrollTop : 0;

    return {
      height: clampedThumbHeight,
      top: Math.min(Math.max(ratio, 0), 1) * maxThumbTop,
    };
  }, [
    hasVerticalOverflow,
    scrollMetrics.clientHeight,
    scrollMetrics.scrollHeight,
    scrollMetrics.scrollTop,
  ]);

  const externalScrollbarSx: SxProps<Theme> = useMemo(
    () => ({
      width: `${EXTERNAL_SCROLLBAR_WIDTH}px`,
      minWidth: `${EXTERNAL_SCROLLBAR_WIDTH}px`,
      borderLeft: '1px solid',
      borderColor: 'divider',
      position: 'relative',
      backgroundColor: theme.palette.background.paper,
    }),
    [theme.palette.background.paper],
  );

  const handleExternalScrollbarTrackClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!hasVerticalOverflow) {
        return;
      }

      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) {
        return;
      }

      const trackRect = event.currentTarget.getBoundingClientRect();
      const visualTrackHeight = Math.max(
        trackRect.height - EXTERNAL_SCROLLBAR_VISUAL_INSET * 2,
        0,
      );
      if (visualTrackHeight <= 0) {
        return;
      }

      const offsetY =
        event.clientY - trackRect.top - EXTERNAL_SCROLLBAR_VISUAL_INSET;
      const thumbHeight = externalScrollbarThumb.height;
      const maxThumbTop = Math.max(visualTrackHeight - thumbHeight, 0);
      const nextThumbTop = Math.min(
        Math.max(offsetY - thumbHeight / 2, 0),
        maxThumbTop,
      );
      const maxScrollTop = Math.max(
        scrollMetrics.scrollHeight - scrollMetrics.clientHeight,
        0,
      );
      const ratio = maxThumbTop > 0 ? nextThumbTop / maxThumbTop : 0;

      scrollContainer.scrollTop = ratio * maxScrollTop;
      updateScrollMetrics(scrollContainer);
    },
    [
      externalScrollbarThumb.height,
      hasVerticalOverflow,
      scrollMetrics.clientHeight,
      scrollMetrics.scrollHeight,
      updateScrollMetrics,
    ],
  );

  const renderExternalScrollbar = () => (
    <Box sx={externalScrollbarSx}>
      <Box
        role="presentation"
        onMouseDown={hasVerticalOverflow ? handleExternalScrollbarTrackClick : undefined}
        sx={{
          position: 'absolute',
          inset: `${EXTERNAL_SCROLLBAR_VISUAL_INSET}px`,
          display: 'flex',
          justifyContent: 'center',
          cursor: hasVerticalOverflow ? 'pointer' : 'default',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: `${EXTERNAL_SCROLLBAR_VISUAL_WIDTH}px`,
            height: '100%',
            borderRadius: 999,
            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.18 : 0.12),
          }}
        >
          {hasVerticalOverflow ? (
            <Box
              sx={{
                position: 'absolute',
                left: 0,
                width: '100%',
                height: `${externalScrollbarThumb.height}px`,
                transform: `translateY(${externalScrollbarThumb.top}px)`,
                borderRadius: 999,
                bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.72 : 0.55),
                transition: 'transform 0.08s linear',
              }}
            />
          ) : null}
        </Box>
      </Box>
    </Box>
  );

  const handleChangePage = (_event: unknown, newPage: number) => {
    onPageChange?.(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    onRowsPerPageChange?.(parseInt(event.target.value, 10));
    onPageChange?.(0);
  };

  const resolvedColumns = useMemo<Column<T>[]>(() => {
    let nextColumns = [...columns];

    if (enforceEntityColumns && lockEntityColumns) {
      nextColumns = nextColumns.filter((column) => {
        if (isIdColumn(column) || isManagementColumn(column)) {
          return false;
        }
        if (includeCodeColumn && isCodeColumn(column)) {
          return false;
        }
        if (includeStatusColumn && isStatusColumn(column)) {
          return false;
        }
        return true;
      });

      const leftColumns: Column<T>[] = [
        {
          id: ENTITY_ID_COLUMN_ID,
          label: ID_COLUMN_LABEL,
          align: 'center',
          sortable: false,
          minWidth: idColumnWidth,
          width: idColumnWidth,
          format: (_value, row, meta) => {
            const rowId = row.id;
            if (rowId !== undefined && rowId !== null && rowId !== '') {
              return rowId;
            }
            if (!meta) return '-';
            return meta.page * meta.rowsPerPage + meta.rowIndex + 1;
          },
        },
      ];

      if (includeCodeColumn) {
        leftColumns.push({
          id: ENTITY_CODE_COLUMN_ID,
          label: CODE_COLUMN_LABEL,
          align: 'center',
          sortable: false,
          minWidth: codeColumnWidth,
          width: codeColumnWidth,
        });
      }

      const rightColumns: Column<T>[] = [];

      if (includeStatusColumn) {
        rightColumns.push({
          id: ENTITY_STATUS_COLUMN_ID,
          label: STATUS_COLUMN_LABEL,
          align: 'center',
          sortable: false,
          minWidth: statusColumnWidth,
          width: statusColumnWidth,
        });
      }

      if (includeManagementColumn) {
        rightColumns.push({
          id: ENTITY_MANAGE_COLUMN_ID,
          label: MANAGE_COLUMN_LABEL,
          align: 'center',
          sortable: false,
          minWidth: manageColumnWidth,
          width: manageColumnWidth,
        });
      }

      nextColumns = [...leftColumns, ...nextColumns, ...rightColumns];
    } else {
      if (enforceEntityColumns) {
        const hasIdColumn = nextColumns.some((column) => isIdColumn(column));
        if (!hasIdColumn) {
          nextColumns = [
            {
              id: ENTITY_ID_COLUMN_ID,
              label: ID_COLUMN_LABEL,
              align: 'center',
              sortable: false,
              minWidth: idColumnWidth,
              width: idColumnWidth,
              format: (_value, row, meta) => {
                const rowId = row.id;
                if (rowId !== undefined && rowId !== null && rowId !== '') {
                  return rowId;
                }
                if (!meta) return '-';
                return meta.page * meta.rowsPerPage + meta.rowIndex + 1;
              },
            },
            ...nextColumns,
          ];
        }
      }

      if (enforceEntityColumns && includeManagementColumn) {
        const hasManagementColumn = nextColumns.some((column) => isManagementColumn(column));
        if (!hasManagementColumn) {
          nextColumns = [
            ...nextColumns,
            {
              id: ENTITY_MANAGE_COLUMN_ID,
              label: MANAGE_COLUMN_LABEL,
              align: 'center',
              sortable: false,
              minWidth: manageColumnWidth,
              width: manageColumnWidth,
            },
          ];
        }
      }
    }

    return nextColumns.map((column) => {
      if (isIdColumn(column)) {
        return {
          ...column,
          align: 'center',
          sortable: false,
          minWidth: idColumnWidth,
          width: idColumnWidth,
        };
      }

      if (isCodeColumn(column)) {
        return {
          ...column,
          align: 'center',
          sortable: false,
          minWidth: codeColumnWidth,
          width: codeColumnWidth,
        };
      }

      if (isStatusColumn(column)) {
        return {
          ...column,
          align: 'center',
          sortable: false,
          minWidth: statusColumnWidth,
          width: statusColumnWidth,
        };
      }

      if (isManagementColumn(column)) {
        return {
          ...column,
          align: 'center',
          sortable: false,
          minWidth: manageColumnWidth,
          width: manageColumnWidth,
        };
      }

      return column;
    });
  }, [
    columns,
    codeColumnWidth,
    enforceEntityColumns,
    idColumnWidth,
    includeCodeColumn,
    includeStatusColumn,
    includeManagementColumn,
    isCodeColumn,
    isIdColumn,
    isManagementColumn,
    isStatusColumn,
    lockEntityColumns,
    manageColumnWidth,
    statusColumnWidth,
  ]);

  const resolveColumnWidthSx = useCallback((column: Column<T>): Record<string, unknown> => {
    if (column.width) {
      return {
        width: `${column.width}px`,
        minWidth: `${column.width}px`,
        maxWidth: `${column.width}px`,
      };
    }

    if (column.minWidth) {
      return { minWidth: `${column.minWidth}px` };
    }

    return {};
  }, []);

  const getColumnValue = useCallback((row: T, column: Column<T>): unknown => {
    if (column.sortAccessor) return column.sortAccessor(row);
    return column.id in row ? (row as Record<string, unknown>)[String(column.id)] : null;
  }, []);

  const compareValues = (left: unknown, right: unknown): number => {
    if (left === right) return 0;
    if (left === null || left === undefined) return -1;
    if (right === null || right === undefined) return 1;

    if (typeof left === 'number' && typeof right === 'number') {
      return left - right;
    }

    if (typeof left === 'string' && typeof right === 'string') {
      const leftDate = Date.parse(left);
      const rightDate = Date.parse(right);
      if (Number.isFinite(leftDate) && Number.isFinite(rightDate)) {
        return leftDate - rightDate;
      }
    }

    return String(left).localeCompare(String(right), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  };

  const sortedData = useMemo(() => {
    if (!sortBy) return data;
    const column = resolvedColumns.find((item) => String(item.id) === sortBy);
    if (!column) return data;

    return [...data].sort((a, b) => {
      const left = getColumnValue(a, column);
      const right = getColumnValue(b, column);
      const compared = compareValues(left, right);
      return sortDirection === 'asc' ? compared : -compared;
    });
  }, [data, getColumnValue, resolvedColumns, sortBy, sortDirection]);

  const showLoadingPlaceholder = loading && sortedData.length === 0;
  const showLoadingOverlay = loading && sortedData.length > 0;

  const handleSort = (column: Column<T>) => {
    if (!sortable || column.sortable === false) return;
    const id = String(column.id);
    if (sortBy === id) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortBy(id);
    setSortDirection('asc');
  };

  const renderCellContent = useCallback(
    (column: Column<T>, row: T, rowIndex: number): React.ReactNode => {
      const value = column.id in row ? (row as Record<string, unknown>)[String(column.id)] : null;
      const renderMeta: CellRenderMeta = {
        rowIndex,
        page,
        rowsPerPage,
      };

      if (column.format) {
        return column.format(value, row, renderMeta);
      }

      if (isStatusColumn(column)) {
        const active = isRowActive(row);
        const statusColor = active ? theme.palette.success.main : theme.palette.warning.main;
        const statusBg = active
          ? alpha(theme.palette.success.main, theme.palette.mode === 'dark' ? 0.16 : 0.12)
          : alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.16 : 0.12);
        return (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Chip
              size="small"
              variant="filled"
              label={active ? 'ใช้งาน' : 'ระงับ'}
              sx={{
                height: 24,
                fontSize: '11px',
                fontWeight: 600,
                borderRadius: 999,
                minWidth: 68,
                bgcolor: statusBg,
                color: statusColor,
                border: `1px solid ${alpha(statusColor, 0.2)}`,
                '& .MuiChip-label': { px: 1 },
              }}
            />
          </Box>
        );
      }

      if (isManagementColumn(column)) {
        const hasManageHandlers =
          Boolean(onToggleRowStatus) || Boolean(onEditRow) || Boolean(onDeleteRow);
        const showStatusAction = Boolean(onToggleRowStatus);

        return (
          renderManageActions?.(row, renderMeta) ?? (
            hasManageHandlers ? (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.25 }}>
                {showStatusAction ? (
                  <Tooltip title={isRowActive(row) ? 'ระงับ' : 'ใช้งาน'}>
                    <IconButton
                      size="small"
                      onClick={() => onToggleRowStatus?.(row)}
                      sx={{
                        color: isRowActive(row) ? theme.palette.text.secondary : theme.palette.primary.main,
                        p: 0.5,
                      }}
                    >
                      {isRowActive(row) ? (
                        <VisibilityOutlined fontSize="inherit" />
                      ) : (
                        <VisibilityOffOutlined fontSize="inherit" />
                      )}
                    </IconButton>
                  </Tooltip>
                ) : null}
                {onEditRow ? (
                  <Tooltip title="แก้ไข">
                    <IconButton
                      size="small"
                      onClick={() => onEditRow(row)}
                      sx={{ color: theme.palette.primary.main, p: 0.5 }}
                    >
                      <EditOutlined fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                ) : null}
                {onDeleteRow ? (
                  <Tooltip title="ลบ">
                    <IconButton
                      size="small"
                      onClick={() => onDeleteRow(row)}
                      sx={{ color: theme.palette.error.main, p: 0.5 }}
                    >
                      <DeleteOutline fontSize="inherit" />
                    </IconButton>
                  </Tooltip>
                ) : null}
              </Box>
            ) : (
              <Typography variant="caption" color="text.disabled">
                -
              </Typography>
            )
          )
        );
      }

      return value as React.ReactNode;
    },
    [
      isManagementColumn,
      isRowActive,
      isStatusColumn,
      includeStatusColumn,
      onDeleteRow,
      onEditRow,
      onToggleRowStatus,
      page,
      renderManageActions,
      rowsPerPage,
    ],
  );

  const renderHeader = () => (
    <TableHead>
      <TableRow>
        {resolvedColumns.map((column) => {
          const widthSx: Record<string, unknown> = resolveColumnWidthSx(column);
          const cellSx: SxProps<Theme> = {
            fontWeight: 700,
            bgcolor: TABLE_HEADER_BACKGROUND,
            fontSize: TABLE_HEADER_FONT_SIZE,
            minHeight: TABLE_HEADER_MIN_HEIGHT,
            height: TABLE_HEADER_MIN_HEIGHT,
            py: 0,
            textAlign: 'center',
            verticalAlign: 'middle',
            lineHeight: TABLE_HEADER_LINE_HEIGHT,
            ...widthSx,
            ...(headerCellSx ?? {}),
          };

          return (
            <TableCell
              key={String(column.id)}
              align="center"
              sx={cellSx}
            >
              {sortable && column.sortable !== false ? (
                <TableSortLabel
                  active={sortBy === String(column.id)}
                  direction={sortBy === String(column.id) ? sortDirection : 'asc'}
                  onClick={() => handleSort(column)}
                  sx={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    '& .MuiTableSortLabel-icon': {
                      ml: 0.5,
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: `${TABLE_HEADER_MIN_HEIGHT - 16}px`,
                      textAlign: 'center',
                      whiteSpace: 'normal',
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word',
                      lineHeight: TABLE_HEADER_LINE_HEIGHT,
                    }}
                  >
                    {column.label}
                  </Box>
                </TableSortLabel>
              ) : (
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: `${TABLE_HEADER_MIN_HEIGHT - 16}px`,
                    textAlign: 'center',
                    whiteSpace: 'normal',
                    overflowWrap: 'anywhere',
                    wordBreak: 'break-word',
                    lineHeight: TABLE_HEADER_LINE_HEIGHT,
                  }}
                >
                  {column.label}
                </Box>
              )}
            </TableCell>
          );
        })}
      </TableRow>
    </TableHead>
  );

  const renderLoadingOverlay = () => (
    <Box
      sx={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 3,
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.62),
        backdropFilter: 'blur(1px)',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <CircularProgress size={28} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
          {t('common.labels.loading')}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Paper
      sx={withOptionalSx(
        {
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 'none',
          backgroundColor: 'background.paper',
        },
        paperSx,
      )}
    >
      {detachedHeader ? (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `minmax(0, 1fr) ${externalScrollbarColumnWidth}px`,
            }}
          >
            <TableContainer>
              <Table
                sx={withOptionalSx(
                  {
                    '& .MuiTableHead-root .MuiTableCell-root': {
                      fontSize: TABLE_HEADER_FONT_SIZE,
                    },
                    '& .MuiTableBody-root .MuiTableCell-root': {
                      verticalAlign: 'middle',
                      fontSize: TABLE_BODY_FONT_SIZE,
                      minHeight: TABLE_BODY_MIN_HEIGHT,
                      py: 1,
                      lineHeight: TABLE_BODY_LINE_HEIGHT,
                    },
                    '& .MuiTableRow-root:hover': {
                      backgroundColor: alpha(
                        theme.palette.primary.main,
                        theme.palette.mode === 'dark' ? 0.06 : 0.04,
                      ),
                    },
                  },
                  tableSx,
                )}
              >
                {renderHeader()}
              </Table>
            </TableContainer>
            <Box
              sx={{
                width: `${EXTERNAL_SCROLLBAR_WIDTH}px`,
                minWidth: `${EXTERNAL_SCROLLBAR_WIDTH}px`,
                borderLeft: '1px solid',
                borderColor: 'divider',
                bgcolor: TABLE_HEADER_BACKGROUND,
              }}
            />
          </Box>
          <Box
            sx={{
              flex: 1,
              minHeight: 0,
              display: 'grid',
              gridTemplateColumns: `minmax(0, 1fr) ${externalScrollbarColumnWidth}px`,
              position: 'relative',
            }}
          >
            <TableContainer
              ref={setScrollContainerRef}
              onScroll={handleTableContainerScroll}
              sx={withOptionalSx(
                {
                  flex: 1,
                  minHeight: 0,
                },
                tableContainerSx,
                HIDDEN_NATIVE_SCROLLBAR_SX,
              )}
            >
              <Table sx={tableSx}>
                <TableBody>
                  {showLoadingPlaceholder ? (
                    <TableRow>
                      <TableCell colSpan={resolvedColumns.length} align="center" sx={{ py: 8 }}>
                        <CircularProgress />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                          {t('common.labels.loading')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : sortedData.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={resolvedColumns.length} align="center" sx={{ py: 8 }}>
                        <Typography variant="body1" color="text.secondary">
                          {emptyMessage || t('common.labels.noData')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedData.map((row, index) => (
                      <TableRow
                        key={row.id || index}
                        hover
                        onClick={() => onRowClick?.(row)}
                        onDoubleClick={() => onRowDoubleClick?.(row)}
                        sx={{
                          cursor: onRowClick || onRowDoubleClick ? 'pointer' : 'default',
                          ...(rowHeight
                            ? {
                                height: rowHeight,
                                '& .MuiTableCell-root': {
                                  height: rowHeight,
                                  py: 0,
                                },
                              }
                            : {}),
                        }}
                      >
                        {resolvedColumns.map((column) => {
                          const align = column.align || 'left';
                          const renderedContent = renderCellContent(column, row, index);
                          return (
                            <TableCell
                              key={String(column.id)}
                              align={align}
                              sx={resolveColumnWidthSx(column)}
                            >
                              <Box
                                sx={{
                                  width: '100%',
                                  minHeight: rowHeight
                                    ? undefined
                                    : `${TABLE_BODY_CONTENT_MIN_HEIGHT}px`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: resolveCellJustifyContent(align),
                                  textAlign: align,
                                  whiteSpace: 'normal',
                                  overflowWrap: 'anywhere',
                                  wordBreak: 'break-word',
                                  lineHeight: TABLE_BODY_LINE_HEIGHT,
                                }}
                              >
                                {renderedContent}
                              </Box>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            {showLoadingOverlay ? renderLoadingOverlay() : null}
            {renderExternalScrollbar()}
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            minHeight: 0,
            display: 'grid',
            gridTemplateColumns: `minmax(0, 1fr) ${externalScrollbarColumnWidth}px`,
            position: 'relative',
          }}
        >
          <TableContainer
            ref={setScrollContainerRef}
            onScroll={handleTableContainerScroll}
            sx={withOptionalSx(tableContainerSx, HIDDEN_NATIVE_SCROLLBAR_SX)}
          >
            <Table
              stickyHeader={stickyHeader}
              sx={withOptionalSx(
                {
                  '& .MuiTableHead-root .MuiTableCell-root': {
                    fontSize: TABLE_HEADER_FONT_SIZE,
                  },
                  '& .MuiTableCell-stickyHeader': {
                    zIndex: 2,
                    backgroundColor: TABLE_HEADER_BACKGROUND,
                    backgroundImage: 'none',
                  },
                  '& .MuiTableBody-root .MuiTableCell-root': {
                    verticalAlign: 'middle',
                    fontSize: TABLE_BODY_FONT_SIZE,
                    minHeight: TABLE_BODY_MIN_HEIGHT,
                    py: 1,
                    lineHeight: TABLE_BODY_LINE_HEIGHT,
                  },
                  '& .MuiTableRow-root:hover': {
                    backgroundColor: alpha(
                      theme.palette.primary.main,
                      theme.palette.mode === 'dark' ? 0.06 : 0.04,
                    ),
                  },
                },
                tableSx,
              )}
            >
              {renderHeader()}
              <TableBody>
                {showLoadingPlaceholder ? (
                  <TableRow>
                    <TableCell colSpan={resolvedColumns.length} align="center" sx={{ py: 8 }}>
                      <CircularProgress />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        {t('common.labels.loading')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : sortedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={resolvedColumns.length} align="center" sx={{ py: 8 }}>
                      <Typography variant="body1" color="text.secondary">
                        {emptyMessage || t('common.labels.noData')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedData.map((row, index) => (
                    <TableRow
                      key={row.id || index}
                      hover
                      onClick={() => onRowClick?.(row)}
                      onDoubleClick={() => onRowDoubleClick?.(row)}
                      sx={{
                        cursor: onRowClick || onRowDoubleClick ? 'pointer' : 'default',
                        ...(rowHeight
                          ? {
                              height: rowHeight,
                              '& .MuiTableCell-root': {
                                height: rowHeight,
                                py: 0,
                              },
                            }
                          : {}),
                      }}
                    >
                      {resolvedColumns.map((column) => {
                        const align = column.align || 'left';
                        const renderedContent = renderCellContent(column, row, index);
                        return (
                          <TableCell
                            key={String(column.id)}
                            align={align}
                            sx={resolveColumnWidthSx(column)}
                          >
                            <Box
                              sx={{
                                width: '100%',
                                minHeight: rowHeight
                                  ? undefined
                                  : `${TABLE_BODY_CONTENT_MIN_HEIGHT}px`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: resolveCellJustifyContent(align),
                                textAlign: align,
                                whiteSpace: 'normal',
                                overflowWrap: 'anywhere',
                                wordBreak: 'break-word',
                                lineHeight: TABLE_BODY_LINE_HEIGHT,
                              }}
                            >
                              {renderedContent}
                            </Box>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          {showLoadingOverlay ? renderLoadingOverlay() : null}
          {renderExternalScrollbar()}
        </Box>
      )}

      {totalCount !== undefined && (
        <Box
          sx={{
            borderTop: '1px solid',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            px: 2,
            gap: 1,
            flexWrap: { xs: 'wrap', md: 'nowrap' },
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ whiteSpace: 'nowrap', py: 1 }}
          >
            {footerSummaryText || '\u00A0'}
          </Typography>

          <TablePagination
            rowsPerPageOptions={rowsPerPageOptions}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage={`${t('common.labels.rowsPerPage')}:`}
            labelDisplayedRows={({ from, to, count }) =>
              t('common.labels.displayedRows', { from, to, count })
            }
            sx={{
              borderTop: 'none',
              ml: 'auto',
              '& .MuiTablePagination-toolbar': {
                minHeight: 48,
                pl: 0,
                pr: 0,
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                fontSize: '0.825rem',
              },
            }}
          />
        </Box>
      )}
    </Paper>
  );
}
