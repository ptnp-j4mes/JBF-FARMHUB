'use client';

import { useMemo, useRef, ReactNode } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  CircularProgress,
} from '@mui/material';

export interface JBFarmTableColumn<T> {
  id: string;
  label: ReactNode;
  width: number;
  align?: 'left' | 'center' | 'right';
  render: (row: T, index: number) => ReactNode;
  headerAlign?: 'left' | 'center' | 'right';
}

interface Props<T> {
  columns: JBFarmTableColumn<T>[];
  rows: T[];
  loading?: boolean;
  minWidth?: number;
  height?: number;
  page?: number;
  rowsPerPage?: number;
  totalCount?: number;
  selectedRowId?: string | number;
  getRowId: (row: T) => string | number;
  onPageChange?: (newPage: number) => void;
  onRowsPerPageChange?: (newRowsPerPage: number) => void;
  onRowDoubleClick?: (row: T, index: number) => void;
  emptyMessage?: string;
  paginationLabel?: string;
  showPagination?: boolean;
  footer?: ReactNode;
}

export default function JBFarmTable<T>({
  columns,
  rows,
  loading = false,
  minWidth = 925,
  height = 480,
  page = 0,
  rowsPerPage = 10,
  totalCount = 0,
  selectedRowId,
  getRowId,
  onPageChange,
  onRowsPerPageChange,
  onRowDoubleClick,
  emptyMessage = 'ไม่พบข้อมูล',
  paginationLabel = 'รวมทั้งหมด',
  showPagination = true,
  footer = null,
}: Props<T>) {
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Sync horizontal scroll between header and body
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerRef.current) {
      headerRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  return (
    <Box
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 10,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        {/* Header Section */}
        <Box
          ref={headerRef}
          sx={{
            overflow: 'hidden',
            bgcolor: '#1a5c50',
            borderBottom: '1px solid #1a5c50',
            pr: '8px', // Match scrollbar width
          }}
        >
          <Table size="small" sx={{ width: '100%', minWidth, tableLayout: 'fixed' }}>
            <TableHead sx={{ bgcolor: '#1a5c50 !important' }}>
              <TableRow sx={{ bgcolor: '#1a5c50 !important' }}>
                {columns.map((col) => (
                  <TableCell
                    key={col.id}
                    width={col.width}
                    align={col.headerAlign || col.align || 'left'}
                    sx={{
                      fontWeight: 900,
                      color: '#ffffff !important',
                      bgcolor: '#1a5c50 !important',
                      borderBottom: 'none',
                      whiteSpace: 'nowrap',
                      py: 1,
                    }}
                  >
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
          </Table>
        </Box>

        {/* Body Section */}
        <Box
          ref={bodyRef}
          onScroll={handleScroll}
          sx={{
            height,
            overflowY: 'scroll',
            overflowX: 'auto',
            '&::-webkit-scrollbar': { width: 8, height: 8 },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#2e7d32', borderRadius: 10},
            '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
          }}
        >
          <Table size="small" sx={{ width: '100%', minWidth, tableLayout: 'fixed' }}>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 10 }}>
                    <CircularProgress size={24} color="success" />
                    <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                      กำลังโหลดข้อมูล...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ py: 10, color: 'text.secondary' }}>
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => {
                  const id = getRowId(row);
                  return (
                    <TableRow
                      key={id}
                      hover
                      selected={selectedRowId === id}
                      onDoubleClick={() => onRowDoubleClick?.(row, index)}
                      sx={{ cursor: onRowDoubleClick ? 'pointer' : 'default' }}
                    >
                      {columns.map((col) => (
                        <TableCell
                          key={`${id}-${col.id}`}
                          width={col.width}
                          align={col.align || 'left'}
                          sx={{ borderColor: '#E5EEE8' }}
                        >
                          {col.render(row, index)}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Box>

        {/* Footer Section */}
        {footer && (
          <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
            {footer}
          </Box>
        )}
      </Box>

      {/* Pagination Section */}
      {showPagination && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid',
            borderColor: 'divider',
            bgcolor: '#fcfdfc',
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 800, color: 'text.secondary', pl: 2 }}>
            {paginationLabel} {totalCount.toLocaleString()} รายการ
          </Typography>
          <TablePagination
            component="div"
            count={totalCount}
            page={page}
            onPageChange={(_, newPage) => onPageChange?.(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => onRowsPerPageChange?.(parseInt(e.target.value, 10))}
            labelRowsPerPage="จำนวนรายการต่อหน้า:"
            sx={{
              borderTop: 'none',
              '& .MuiTablePagination-toolbar': {
                minHeight: 48,
              },
            }}
          />
        </Box>
      )}
    </Box>
  );
}
