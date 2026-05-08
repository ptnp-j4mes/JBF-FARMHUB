/**
 * StockPage Component
 *
 * Main page for stock/warehouse management
 */

'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  FormControl,
  MenuItem,
  Grid,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Typography,
  TextField,
  useMediaQuery,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  CheckCircleOutlineOutlined,
  InputOutlined,
  Inventory2Outlined,
  LayersOutlined,
  RefreshOutlined,
  Search as SearchIcon,
  WarningAmberRounded,
} from '@mui/icons-material';
import {
  IssueTransactionDetailsDialog,
  IssueTransactionList,
  PendingReceiveRequestList,
  PendingIssueRequestList,
  ReceivablePurchaseRequestList,
  ReceiveTransactionDetailsDialog,
  ReceiveTransactionList,
  ReceivePurchaseRequestDialog,
  StockReceiveRequestDetailsDialog,
  StockTransactionDialog,
  TransferTransactionDetailsDialog,
  TransferTransactionList,
  StockActionButton,
} from './components';
import { stockService } from './services/stock.service';
import { stockAdjustmentRequestService } from './services/stock-adjustment-request.service';
import { stockIssueRequestService } from '@/features/production/stock-issue-request/services/stock-issue-request.service';
import { STOCK_ISSUE_REQUESTS_CHANGED_EVENT } from '@/features/production/stock-issue-request/stock-issue-request.events';
import type {
  StockAdjustmentRequestResponse,
  DashboardMetricResponse,
  ItemOption,
  CentralWarehouseItemOption,
  ReceivablePurchaseRequestRow,
  StockReceiveRequestResponse,
  StockBalanceResponse,
  StockBalancePagedRow,
  StockFacilityResponse,
  StockFilterParams,
  StockLotFilter,
  StockStatusFilter,
  StockTransactionRow,
  UomOption,
  WarehouseResponse,
  WarehouseTransactionMode,
} from './types';
import type { StockIssueRequestResponse } from '@/features/production/stock-issue-request/types/stock-issue-request.types';
import { StockIssueRequestDetailsDialog } from '@/features/production/stock-issue-request/components/StockIssueRequestDetailsDialog';
import { formatNumber } from '@/lib/utils/format.util';
import { useI18n } from '@/core/i18n';
import { formatDateShort } from '@/lib/utils/date.util';
import { getStockLevel } from './utils/stock.util';
import {
  createWarehouseScopeContext,
  isCentralWarehouse,
} from './utils/warehouse-scope.util';
import { PR_MAIN_TABLE_HEIGHT } from '@/core/ui-patterns/pr-ui.constants';
import {
  FACILITY_CHANGED_EVENT,
  getCurrentFacilityCode,
  getCurrentFacilityId,
} from '@/lib/facility-context';
import Swal from 'sweetalert2';
import axios from 'axios';
import axiosInstance from '@/lib/axios';
import { getFeedSiloDisplayLabel } from './utils/location-display.util';
import { resolveInventoryContext } from './utils/inventory-context.util';
import {
  canApproveWarehouseAdjustmentRequests,
  canManageWarehouseAdjustmentRequests,
  canManageWarehouseMaterialStock,
  canViewWarehouseMaterialStock,
} from '@/lib/access/modules/warehouse.guard';
import { QuickStatusButtonGroup, StatsCard } from '@/components/common';
import { StatusBadge, PageTabs, EmptyState, DialogTitleWithClose, WorkspaceHeader } from '@/design-system';

const ROWS_PER_PAGE = 10;
const TABLE_COLUMN_WIDTHS_DEFAULT = [
  '34%',
  '18%',
  '16%',
  '16%',
  '16%',
] as const;
const TABLE_COLUMN_WIDTHS_MOBILE = ['40%', '22%', '14%', '24%'] as const;

const panelSx = {
  borderRadius: 10,
  border: '1px solid',
  borderColor: 'divider',
  bgcolor: 'background.paper',
  boxShadow: 2,
};

type FacilityScopeResponse = {
  id: number;
  isCentralHub?: boolean;
};

type AdjustRequestQuickStatus = 'all' | 'draft' | 'pending' | 'completed';

type AdjustRequestDraftFilters = {
  documentNumber: string;
  requestDateFrom: string;
  requestDateTo: string;
};

const ADJUST_REQUEST_FILTER_DEFAULTS: AdjustRequestDraftFilters = {
  documentNumber: '',
  requestDateFrom: '',
  requestDateTo: '',
};

const ADJUST_REQUEST_STATUS_LABELS: Record<Exclude<AdjustRequestQuickStatus, 'all'>, string> = {
  draft: 'ฉบับร่าง',
  pending: 'รอดำเนินการ',
  completed: 'ดำเนินการเสร็จสิ้น',
};

const toAdjustRequestStatusGroup = (status: string | null | undefined): Exclude<AdjustRequestQuickStatus, 'all'> => {
  switch (String(status ?? '').trim().toUpperCase()) {
    case 'DRAFT':
      return 'draft';
    case 'APPROVED':
    case 'COMPLETED':
    case 'CLOSED':
    case 'CANCELLED':
    case 'CANCELED':
    case 'REJECTED':
      return 'completed';
    case 'PENDING':
    case 'SUBMITTED':
    case 'RETURNED':
    default:
      return 'pending';
  }
};

const toAdjustRequestStatusLabel = (status: string | null | undefined): string =>
  ADJUST_REQUEST_STATUS_LABELS[toAdjustRequestStatusGroup(status)];

function toStockBalanceRows(
  rows: StockBalancePagedRow[],
  itemThresholdMap?: Map<number, { minStockQty?: number | null; maxStockQty?: number | null }>,
): StockBalanceResponse[] {
  return rows.map((row) => {
    const reservedQuantity = row.reservedQuantity ?? 0;
    const quantity = row.quantity ?? 0;
    const effectiveQuantity = row.availableQuantity ?? Math.max(0, quantity - reservedQuantity);
    const threshold = row.itemId != null ? itemThresholdMap?.get(row.itemId) : undefined;
    const status = getStockLevel(
      effectiveQuantity,
      threshold?.minStockQty ?? null,
      threshold?.maxStockQty ?? null,
    );

    return {
      warehouseId: row.warehouseId,
      warehouseName: row.warehouseName,
      warehouseType: row.warehouseType,
      itemId: row.itemId,
      itemCode: row.itemCode,
      itemName: row.itemName,
      stockLotId: row.stockLotId,
      lotNumber: row.lotNumber,
      feedSiloId: row.feedSiloId,
      feedSiloCode: row.feedSiloCode,
      feedSiloName: row.feedSiloName,
      quantity,
      uomId: row.uomId,
      reservedQuantity,
      availableQuantity: row.availableQuantity ?? effectiveQuantity,
      uomName: row.uomName,
      requestType: row.requestType,
      status,
    };
  });
}

function normalizeStockFacilityStatus(status: string | null | undefined): Exclude<StockStatusFilter, 'all'> {
  switch (String(status ?? '').trim().toLowerCase()) {
    case 'low':
    case 'reserved':
      return 'low';
    case 'out':
      return 'out';
    default:
      return 'normal';
  }
}

type StockFacilityDetailRow = {
  key: string;
  lotNumber: string;
  expiryDate: string | null;
  feedSiloName?: string | null;
  feedSiloCode?: string | null;
  warehouseName: string;
  quantity: number;
  uomName: string;
};

type StockPageProps = {
  initialStockBalances?: StockBalanceResponse[];
  initialStockFacilities?: StockFacilityResponse[];
  initialReceivablePRs?: ReceivablePurchaseRequestRow[];
  initialDashboard?: DashboardMetricResponse | null;
  initialWarehouses?: WarehouseResponse[];
  initialItems?: ItemOption[];
  initialUoms?: UomOption[];
};

type StockWarehouseOption = {
  warehouseId: number;
  warehouseName: string;
};

type StockQuickStatus = {
  value: StockStatusFilter;
  label: string;
  count: number;
};

type StockFiltersProps = {
  filters: StockFilterParams;
  onChange: (filters: StockFilterParams) => void;
  warehouseOptions: StockWarehouseOption[];
  itemOptions: ItemOption[];
  quickStatuses: StockQuickStatus[];
  compactSummaryMode?: boolean;
};

function StockFilters({
  filters,
  onChange,
  warehouseOptions,
  itemOptions,
  quickStatuses,
  compactSummaryMode = false,
}: StockFiltersProps) {
  const { t } = useI18n();
  const [pendingWarehouseId, setPendingWarehouseId] = useState<number | 'all'>(
    filters.warehouseId ?? 'all',
  );
  const [pendingStockStatus, setPendingStockStatus] =
    useState<StockStatusFilter>(filters.stockStatus);
  const [pendingLotFilter, setPendingLotFilter] = useState<StockLotFilter>(
    filters.lotFilter,
  );
  const [pendingSearch, setPendingSearch] = useState(filters.search || 'all');

  useEffect(() => {
    setPendingSearch(filters.search || 'all');
    setPendingWarehouseId(filters.warehouseId ?? 'all');
    setPendingStockStatus(filters.stockStatus);
    setPendingLotFilter(filters.lotFilter);
  }, [filters]);

  const applyFilters = () => {
    onChange({
      ...filters,
      search: pendingSearch === 'all' ? '' : pendingSearch,
      warehouseId:
        pendingWarehouseId === 'all' ? undefined : pendingWarehouseId,
      stockStatus: pendingStockStatus,
      lotFilter: pendingLotFilter,
    });
  };

  const resetFilters = () => {
    setPendingSearch('');
    setPendingWarehouseId('all');
    setPendingStockStatus('all');
    setPendingLotFilter('all');
    onChange({
      ...filters,
      search: '',
      warehouseId: undefined,
      stockStatus: 'all',
      lotFilter: 'all',
    });
  };

  return (
    <Stack spacing={1.5} sx={{ width: '100%', mb: 2.25 }}>
      <QuickStatusButtonGroup
        items={quickStatuses}
        selectedValue={pendingStockStatus}
        onChange={(value) => setPendingStockStatus(value as StockStatusFilter)}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: compactSummaryMode
            ? { xs: '1fr', md: '1.4fr 1fr repeat(2, minmax(132px, 1fr))' }
            : { xs: '1fr', md: '1.3fr 1fr 1fr 1fr repeat(2, minmax(132px, 1fr))' },
          gap: 1.2,
          alignItems: 'center',
        }}
      >
        <FormControl size="small" fullWidth>
          <Select
            value={pendingSearch}
            onChange={(event) => setPendingSearch(String(event.target.value))}
            sx={{
              height: 40,
              borderRadius: 10,
              bgcolor: 'background.paper',
              boxShadow: 1,
            }}
          >
            <MenuItem value="all">ตัวเลือกทั้งหมด</MenuItem>
            {itemOptions.map((item) => (
              <MenuItem key={item.id} value={item.code}>
                {item.code} - {item.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {!compactSummaryMode && (
          <FormControl size="small" fullWidth>
            <Select
              value={pendingWarehouseId}
              onChange={(event) => {
                const nextValue = event.target.value;
                setPendingWarehouseId(
                  nextValue === 'all' ? 'all' : Number(nextValue),
                );
              }}
              sx={{
                height: 40,
                borderRadius: 10,
                bgcolor: 'background.paper',
                boxShadow: 1,
              }}
            >
              <MenuItem value="all">
                {t('features.production.stock.filterPanel.allWarehouses')}
              </MenuItem>
              {warehouseOptions.map((option) => (
                <MenuItem key={option.warehouseId} value={option.warehouseId}>
                  {option.warehouseName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <FormControl size="small" fullWidth>
          <Select
            value={pendingStockStatus}
            onChange={(event) =>
              setPendingStockStatus(event.target.value as StockStatusFilter)
            }
            sx={{
              height: 40,
              borderRadius: 10,
              bgcolor: 'background.paper',
              boxShadow: 1,
            }}
          >
            <MenuItem value="all">
              {t('features.production.stock.filterPanel.allStatuses')}
            </MenuItem>
            <MenuItem value="normal">
              {t('features.production.stock.table.stockStatus.normal')}
            </MenuItem>
            <MenuItem value="low">
              {t('features.production.stock.table.stockStatus.low')}
            </MenuItem>
            <MenuItem value="out">
              {t('features.production.stock.table.stockStatus.out')}
            </MenuItem>
          </Select>
        </FormControl>

        {!compactSummaryMode && (
          <FormControl size="small" fullWidth>
            <Select
              value={pendingLotFilter}
              onChange={(event) =>
                setPendingLotFilter(event.target.value as StockLotFilter)
              }
              sx={{
                height: 40,
                borderRadius: 10,
                bgcolor: 'background.paper',
                boxShadow: 1,
              }}
            >
              <MenuItem value="all">
                {t('features.production.stock.filterPanel.allLotStatuses')}
              </MenuItem>
              <MenuItem value="withLot">
                {t('features.production.stock.filterPanel.withLot')}
              </MenuItem>
              <MenuItem value="withoutLot">
                {t('features.production.stock.filterPanel.withoutLot')}
              </MenuItem>
            </Select>
          </FormControl>
        )}

        <Box
          sx={{
            display: 'flex',
            justifyContent: { xs: 'stretch', md: 'flex-end' },
            gap: 1,
            flexWrap: 'wrap',
            gridColumn: { xs: '1', md: compactSummaryMode ? '3 / 5' : '5 / 7' },
          }}
        >
          <StockActionButton
            startIcon={<SearchIcon />}
            tone="primary"
            onClick={applyFilters}
          >
            ค้นหา
          </StockActionButton>

          <StockActionButton
            tone="neutral"
            onClick={resetFilters}
          >
            {t('features.production.stock.filterPanel.reset')}
          </StockActionButton>
        </Box>
      </Box>
    </Stack>
  );
}

type StockFacilityListProps = {
  data: StockFacilityResponse[];
  loading?: boolean;
  onViewDetails: (row: StockFacilityResponse) => void;
};

function StockFacilityList({
  data,
  loading = false,
  onViewDetails,
}: StockFacilityListProps) {
  return (
    <Paper
      sx={{
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        height: PR_MAIN_TABLE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <TableContainer
        sx={{ flex: 1, minHeight: 0, overflowX: 'auto', overflowY: 'auto' }}
      >
        <Table
          size="small"
          stickyHeader
          sx={{
            width: '100%',
            tableLayout: 'fixed',
            '& .MuiTableCell-root': {
              px: { xs: 0.85, sm: 1.6 },
              py: { xs: 1.2, sm: 1.45 },
              verticalAlign: 'middle',
            },
            '& .MuiTableCell-head': {
              bgcolor: 'background.paper',
              backgroundImage: (t) =>
                `linear-gradient(${alpha(t.palette.primary.main, 0.06)}, ${alpha(t.palette.primary.main, 0.06)})`,
              color: 'text.primary',
              fontWeight: 800,
              fontSize: '15px',
              textAlign: 'center',
              borderBottom: '1px solid',
              borderColor: 'divider',
            },
            '& .MuiTableBody-root .MuiTableCell-root': {
              borderBottom: '1px solid',
              borderColor: 'divider',
              color: 'text.primary',
            },
            '& .MuiTableBody-root .MuiTableRow-root:hover': {
              bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
              cursor: 'pointer',
            },
          }}
        >
          <colgroup>
            <col style={{ width: '44%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '16%' }} />
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell>สินค้า</TableCell>
              <TableCell align="center">คงเหลือ</TableCell>
              <TableCell align="center">จองไว้</TableCell>
              <TableCell align="center">สถานะ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                  กำลังโหลด...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                  ไม่พบข้อมูล
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const normalizedStatus = (row.status ?? '').toLowerCase();
                const label =
                  normalizedStatus === 'out'
                    ? 'หมด'
                    : normalizedStatus === 'low'
                      ? 'ต่ำ'
                      : 'ปกติ';
                const badgeType = normalizedStatus === 'out'
                  ? 'error' as const
                  : normalizedStatus === 'low'
                    ? 'warning' as const
                    : 'success' as const;

                return (
                  <TableRow
                    key={row.id}
                    hover
                    onDoubleClick={() => onViewDetails(row)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>
                        {row.itemName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.itemCode}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700}>
                        {formatNumber(row.onHandQuantity)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.stockUomName}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={700}>
                        {formatNumber(row.reservedQuantity)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.stockUomName}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <StatusBadge
                        label={label}
                        type={badgeType}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

type StockListProps = {
  data: StockBalanceResponse[];
  loading?: boolean;
  totalCount: number;
  page: number;
  rowsPerPage: number;
  onPageChange: (page: number) => void;
};

function StockList({
  data,
  loading = false,
  totalCount,
  page,
  rowsPerPage,
  onPageChange,
}: StockListProps) {
  const theme = useTheme();
  const compactTable = useMediaQuery(theme.breakpoints.down('sm'));
  const { t } = useI18n();
  const tableColumnWidths = compactTable
    ? TABLE_COLUMN_WIDTHS_MOBILE
    : TABLE_COLUMN_WIDTHS_DEFAULT;
  const columnCount = compactTable ? 4 : 5;

  const paginationSx = {
    '& .MuiTablePagination-toolbar': {
      px: { xs: 1, sm: 2 },
      minHeight: { xs: 48, sm: 52 },
      flexWrap: { xs: 'wrap', sm: 'nowrap' },
      rowGap: { xs: 0.6, sm: 0 },
      justifyContent: 'flex-end',
    },
    '& .MuiTablePagination-selectLabel, & .MuiTablePagination-input, & .MuiTablePagination-spacer':
    {
      display: 'none',
    },
    '& .MuiTablePagination-displayedRows': {
      m: 0,
    },
  } as const;

  return (
    <Paper
      sx={{
        borderRadius: 10,
        overflow: 'hidden',
        boxShadow: 2,
        border: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper',
        height: PR_MAIN_TABLE_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <TableContainer
        sx={{
          flex: 1,
          minHeight: 0,
          overflowX: 'auto',
          overflowY: 'auto',
          scrollbarGutter: 'stable',
        }}
      >
        <Table
          size="small"
          stickyHeader
          sx={{
            width: '100%',
            tableLayout: 'fixed',
            '& .MuiTableCell-root': {
              px: { xs: 0.85, sm: 1.6 },
              py: { xs: 1.2, sm: 1.45 },
              verticalAlign: 'middle',
            },
            '& .MuiTableCell-head': {
              bgcolor: 'background.paper',
              backgroundImage: (t) =>
                `linear-gradient(${alpha(t.palette.primary.main, 0.06)}, ${alpha(t.palette.primary.main, 0.06)})`,
              color: 'text.primary',
              fontWeight: 800,
              fontSize: '15px',
              textAlign: 'center',
              verticalAlign: 'middle',
              borderBottom: '1px solid',
              borderColor: 'divider',
              whiteSpace: 'nowrap',
              overflowWrap: 'normal',
              wordBreak: 'normal',
            },
            '& .MuiTableBody-root .MuiTableCell-root': {
              borderBottom: '1px solid',
              borderColor: 'divider',
              color: 'text.primary',
            },
            '& .MuiTableBody-root .MuiTableRow-root:hover': {
              bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
            },
            '& .MuiTableCell-root:first-of-type': {
              pl: { xs: 1.05, sm: 1.8 },
            },
            '& .MuiTableCell-root:last-of-type': {
              pr: { xs: 1.05, sm: 1.8 },
            },
          }}
        >
          <colgroup>
            {tableColumnWidths.map((width, index) => (
              <col key={`stock-col-${index}`} style={{ width }} />
            ))}
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell>
                {t('features.production.stock.table.columns.item')}
              </TableCell>
              <TableCell>
                {t('features.production.stock.table.columns.warehouse')}
              </TableCell>
              <TableCell>
                {t('features.production.stock.table.columns.lot')}
              </TableCell>
              {compactTable ? (
                <TableCell>
                  {t('features.production.stock.table.columns.stockCompact')}
                </TableCell>
              ) : (
                <>
                  <TableCell align="center">
                    {t('features.production.stock.table.columns.balance')}
                  </TableCell>
                  <TableCell align="center">
                    {t('features.production.stock.table.columns.stockStatus')}
                  </TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columnCount} align="center" sx={{ py: 6 }}>
                  {t('common.labels.loading')}
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} align="center" sx={{ py: 6 }}>
                  {t('features.production.stock.table.noData')}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, index) => {
                const stockLevel = getStockLevel(
                  row.availableQuantity ?? Math.max(0, row.quantity - (row.reservedQuantity ?? 0)),
                  row.itemId != null ? itemStockThresholdMap.get(row.itemId)?.minStockQty ?? null : null,
                  row.itemId != null ? itemStockThresholdMap.get(row.itemId)?.maxStockQty ?? null : null,
                );
                const stockLabel = t(
                  `features.production.stock.table.stockStatus.${stockLevel}`,
                );
                const badgeTypeForLevel = stockLevel === 'out'
                  ? 'error' as const
                  : stockLevel === 'low'
                    ? 'warning' as const
                    : 'success' as const;

                return (
                  <TableRow
                    key={row.id ?? `${row.itemId}-${row.warehouseId}-${index}`}
                    hover
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={700}
                        sx={{
                          overflowWrap: 'anywhere',
                          wordBreak: 'break-word',
                          lineHeight: 1.3,
                        }}
                      >
                        {row.itemName || '-'}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: 'block', lineHeight: 1.3 }}
                      >
                        {row.itemCode || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{
                          overflowWrap: 'anywhere',
                          wordBreak: 'break-word',
                          lineHeight: 1.25,
                        }}
                      >
                        {row.warehouseName || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          overflowWrap: 'anywhere',
                          wordBreak: 'break-word',
                          lineHeight: 1.25,
                        }}
                      >
                        {row.lotNumber || '-'}
                      </Typography>
                      {row.feedSiloName ? (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', lineHeight: 1.25 }}
                        >
                          {getFeedSiloDisplayLabel(
                            row.feedSiloName,
                            row.feedSiloCode,
                          )}
                        </Typography>
                      ) : null}
                    </TableCell>
                    {compactTable ? (
                      <TableCell>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 0.45,
                          }}
                        >
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            sx={{ lineHeight: 1.25, textAlign: 'left' }}
                          >
                            {formatNumber(row.quantity)} {row.uomName}
                          </Typography>
                          <StatusBadge
                            label={stockLabel}
                            type={badgeTypeForLevel}
                            size="small"
                          />
                        </Box>
                      </TableCell>
                    ) : (
                      <>
                        <TableCell align="right">
                          <Typography
                            variant="body2"
                            fontWeight={700}
                            textAlign="right"
                            color={
                              stockLevel === 'out'
                                ? 'error.main'
                                : stockLevel === 'low'
                                  ? 'warning.main'
                                  : 'text.primary'
                            }
                          >
                            {formatNumber(row.quantity)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {row.uomName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <StatusBadge
                            label={stockLabel}
                            type={badgeTypeForLevel}
                            size="small"
                          />
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, nextPage) => onPageChange(nextPage)}
        rowsPerPageOptions={[rowsPerPage]}
        labelRowsPerPage=""
        labelDisplayedRows={({ count }) =>
          t('features.production.stock.table.totalItems', {
            count: count === -1 ? 0 : count,
          })
        }
        sx={paginationSx}
      />
    </Paper>
  );
}

export function StockPage({
  initialStockBalances = [],
  initialStockFacilities = [],
  initialReceivablePRs = [],
  initialDashboard = null,
  initialWarehouses = [],
  initialItems = [],
  initialUoms = [],
}: StockPageProps) {
  const { t } = useI18n();
  const canViewInventory = canViewWarehouseMaterialStock();
  const canReceiveStock = canManageWarehouseMaterialStock();
  const canApproveStock = canApproveWarehouseAdjustmentRequests();
  const canRequestAdjustStock = canManageWarehouseAdjustmentRequests();
  const [stockBalances, setStockBalances] =
    useState<StockBalanceResponse[]>(initialStockBalances);
  const [stockFacilities, setStockFacilities] = useState<
    StockFacilityResponse[]
  >(initialStockFacilities);
  const [stockTotalCount, setStockTotalCount] = useState(
    initialStockBalances.length,
  );
  const [stockFacilitiesLoading, setStockFacilitiesLoading] = useState(
    initialStockFacilities.length === 0,
  );
  const [receivablePRs, setReceivablePRs] =
    useState<ReceivablePurchaseRequestRow[]>(initialReceivablePRs);
  const [pendingActivationPRs, setPendingActivationPRs] = useState<
    StockReceiveRequestResponse[]
  >([]);
  const [pendingIssueRequests, setPendingIssueRequests] = useState<
    StockIssueRequestResponse[]
  >([]);
  const [myAdjustmentRequests, setMyAdjustmentRequests] = useState<
    StockAdjustmentRequestResponse[]
  >([]);
  const [pendingAdjustmentApprovals, setPendingAdjustmentApprovals] = useState<
    StockAdjustmentRequestResponse[]
  >([]);
  const [receiveTransactions, setReceiveTransactions] = useState<
    StockTransactionRow[]
  >([]);
  const [issueTransactions, setIssueTransactions] = useState<
    StockTransactionRow[]
  >([]);
  const [transferTransactions, setTransferTransactions] = useState<
    StockTransactionRow[]
  >([]);
  const [dashboard, setDashboard] = useState<DashboardMetricResponse | null>(
    initialDashboard,
  );
  const [stockLoading, setStockLoading] = useState(
    initialStockBalances.length === 0,
  );
  const [receivingLoading, setReceivingLoading] = useState(false);
  const [pendingActivationLoading, setPendingActivationLoading] =
    useState(false);
  const [issueLoading, setIssueLoading] = useState(false);
  const [adjustmentLoading, setAdjustmentLoading] = useState(false);
  const [adjustmentActionLoading, setAdjustmentActionLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [masterLoading, setMasterLoading] = useState(false);
  const [mastersRequested, setMastersRequested] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warehouses, setWarehouses] =
    useState<WarehouseResponse[]>(initialWarehouses);
  const [items, setItems] = useState<ItemOption[]>(
    initialItems.filter((item) => item.isActive),
  );
  const [centralWarehouseItems, setCentralWarehouseItems] = useState<CentralWarehouseItemOption[]>([]);
  const [uoms, setUoms] = useState<UomOption[]>(
    initialUoms.filter((uom) => uom.isActive),
  );
  const [transactionMode, setTransactionMode] =
    useState<WarehouseTransactionMode | null>(null);
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false);
  const [selectedReceivablePR, setSelectedReceivablePR] =
    useState<ReceivablePurchaseRequestRow | null>(null);
  const [selectedPendingReceiveRequest, setSelectedPendingReceiveRequest] =
    useState<StockReceiveRequestResponse | null>(null);
  const [selectedReceiveTransaction, setSelectedReceiveTransaction] =
    useState<StockTransactionRow | null>(null);
  const [selectedIssueTransaction, setSelectedIssueTransaction] =
    useState<StockTransactionRow | null>(null);
  const [selectedPendingIssueRequest, setSelectedPendingIssueRequest] =
    useState<StockIssueRequestResponse | null>(null);
  const [selectedTransferTransaction, setSelectedTransferTransaction] =
    useState<StockTransactionRow | null>(null);
  const [selectedStockFacility, setSelectedStockFacility] =
    useState<StockFacilityResponse | null>(null);
  const [stockFacilityDetails, setStockFacilityDetails] = useState<
    StockBalanceResponse[]
  >([]);
  const [stockFacilityDialogOpen, setStockFacilityDialogOpen] = useState(false);
  const [stockFacilityDetailLoading, setStockFacilityDetailLoading] =
    useState(false);
  const [receiveDialogOpen, setReceiveDialogOpen] = useState(false);
  const [pendingReceiveRequestDialogOpen, setPendingReceiveRequestDialogOpen] =
    useState(false);
  const [receiveHistoryDialogOpen, setReceiveHistoryDialogOpen] =
    useState(false);
  const [issueHistoryDialogOpen, setIssueHistoryDialogOpen] = useState(false);
  const [pendingIssueRequestDialogOpen, setPendingIssueRequestDialogOpen] =
    useState(false);
  const [transferHistoryDialogOpen, setTransferHistoryDialogOpen] =
    useState(false);
  const [warehouseScope, setWarehouseScope] = useState<'farm' | 'central'>(
    'farm',
  );
  const [activeTab, setActiveTab] = useState<
    | 'farm-stock'
    | 'pending-activation'
    | 'receiving'
    | 'consumption'
    | 'transfer'
    | 'adjust-requests'
    | 'adjust-approvals'
  >('farm-stock');
  const [adjustRequestStatusFilter, setAdjustRequestStatusFilter] =
    useState<AdjustRequestQuickStatus>('all');
  const [adjustRequestDraftFilters, setAdjustRequestDraftFilters] =
    useState<AdjustRequestDraftFilters>(ADJUST_REQUEST_FILTER_DEFAULTS);
  const [adjustRequestAppliedFilters, setAdjustRequestAppliedFilters] =
    useState<AdjustRequestDraftFilters>(ADJUST_REQUEST_FILTER_DEFAULTS);
  const [filters, setFilters] = useState<StockFilterParams>({
    search: '',
    stockStatus: 'all',
    lotFilter: 'all',
    includeZero: true,
    sortBy: 'itemCode',
    sortDir: 'asc',
  });
  const [page, setPage] = useState(0);
  const [currentFacilityId, setCurrentFacilityId] = useState<number | null>(
    () => getCurrentFacilityId(),
  );
  const [currentFacilityCode, setCurrentFacilityCode] = useState<string | null>(
    () => getCurrentFacilityCode(),
  );
  const [currentFacilityIsCentralHub, setCurrentFacilityIsCentralHub] = useState(false);
  const receivingLoadedScopeRef = useRef<string>('');
  const pendingActivationLoadedScopeRef = useRef<string>('');
  const issueLoadedScopeRef = useRef<string>('');
  const adjustmentRequestLoadedScopeRef = useRef<string>('');
  const adjustmentApprovalLoadedScopeRef = useRef<string>('');
  const transferLoadedScopeRef = useRef<string>('');
  const latestViewScopeRef = useRef<string>('');
  const stockRevisionRef = useRef<number | null>(null);
  const stockRevisionInitializedRef = useRef(false);
  const stockRevisionPollInFlightRef = useRef(false);
  const adjustRequestDateFromInputRef = useRef<HTMLInputElement | null>(null);
  const adjustRequestDateToInputRef = useRef<HTMLInputElement | null>(null);
  const [issueRequestActionLoading, setIssueRequestActionLoading] =
    useState(false);
  const [pendingReceiveRequestActionLoading, setPendingReceiveRequestActionLoading] =
    useState(false);
  const stockFacilityDetailRows = useMemo<StockFacilityDetailRow[]>(() => {
    return stockFacilityDetails.flatMap((balance, balanceIndex) => {
      const layers = balance.layers && balance.layers.length > 0
        ? [...balance.layers].sort((left, right) => {
          const leftExpiry = left.expiryDate ? new Date(left.expiryDate).getTime() : Number.POSITIVE_INFINITY;
          const rightExpiry = right.expiryDate ? new Date(right.expiryDate).getTime() : Number.POSITIVE_INFINITY;
          if (leftExpiry !== rightExpiry) return leftExpiry - rightExpiry;

          const leftReceived = left.receivedAt ? new Date(left.receivedAt).getTime() : Number.POSITIVE_INFINITY;
          const rightReceived = right.receivedAt ? new Date(right.receivedAt).getTime() : Number.POSITIVE_INFINITY;
          if (leftReceived !== rightReceived) return leftReceived - rightReceived;

          return left.id - right.id;
        })
        : [];

      if (layers.length === 0) {
        return [{
          key: `balance-${balance.id ?? balanceIndex}-base-${balance.stockLotId ?? 'no-lot'}-${balance.feedSiloId ?? 'no-silo'}`,
          lotNumber: balance.lotNumber || '-',
          expiryDate: balance.expiryDate ?? null,
          feedSiloName: balance.feedSiloName ?? null,
          feedSiloCode: balance.feedSiloCode ?? null,
          warehouseName: balance.warehouseName || '-',
          quantity: Number(balance.quantity ?? 0),
          uomName: balance.uomName,
        }];
      }

      return layers.map((layer, layerIndex) => ({
        key: `balance-${balance.id ?? balanceIndex}-layer-${layer.id ?? layerIndex}-${balance.stockLotId ?? 'no-lot'}-${balance.feedSiloId ?? 'no-silo'}`,
        lotNumber: balance.lotNumber || '-',
        expiryDate: layer.expiryDate ?? balance.expiryDate ?? null,
        feedSiloName: balance.feedSiloName ?? null,
        feedSiloCode: balance.feedSiloCode ?? null,
        warehouseName: balance.warehouseName || '-',
        quantity: Number(layer.remainingQuantity ?? 0),
        uomName: balance.uomName,
      }));
    });
  }, [stockFacilityDetails]);
  const centralWarehouse = useMemo(
    () => warehouses.find((warehouse) => isCentralWarehouse(warehouse) && warehouse.isActive) ?? null,
    [warehouses],
  );
  const centralWarehouseId = centralWarehouse?.id;
  const centralWarehouseFacilityId = centralWarehouse?.facilityNodeId ?? undefined;
  const currentScopeLabel =
    warehouseScope === 'central' ? 'คลังกลาง' : 'คลังฟาร์ม';
  const facilityScopeKey =
    currentFacilityCode ??
    (currentFacilityId != null ? `id:${currentFacilityId}` : 'all');
  const viewScopeKey = `${warehouseScope}:${facilityScopeKey}`;

  useEffect(() => {
    latestViewScopeRef.current = viewScopeKey;
  }, [viewScopeKey]);

  const loadMasters = useCallback(async () => {
    if (!canViewInventory) {
      setMastersRequested(true);
      setWarehouses([]);
      setItems([]);
      setUoms([]);
      setCentralWarehouseItems([]);
      setMasterLoading(false);
      return;
    }

    try {
      setMastersRequested(true);
      setMasterLoading(true);
      const [warehouseList, itemList, uomList] = await Promise.all([
        stockService.getWarehouses(undefined, undefined, true),
        stockService.getItems(),
        stockService.getUoms(),
      ]);
      const centralList =
        warehouseScope === 'central'
          ? await stockService.getCentralWarehouseItems().catch(() => [])
          : [];
      setWarehouses(warehouseList);
      setItems(itemList.filter((item) => item.isActive));
      setCentralWarehouseItems(centralList);
      setUoms(uomList.filter((uom) => uom.isActive));
    } catch (err: unknown) {
      console.error('Failed to load stock master data:', err);
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setError(
          axiosError.response?.data?.message ||
          'ไม่สามารถโหลดข้อมูลต้นทางของระบบคลังสินค้าได้',
        );
      } else {
        setError('ไม่สามารถโหลดข้อมูลต้นทางของระบบคลังสินค้าได้');
      }
    } finally {
      setMasterLoading(false);
    }
  }, [canViewInventory, warehouseScope]);

  const ensureMastersLoaded = useCallback(async () => {
    if (masterLoading) {
      return;
    }

    const needsWarehouses = warehouses.length === 0;
    const needsItems = items.length === 0;
    const needsUoms = uoms.length === 0;
    const needsCentralItems = warehouseScope === 'central' && centralWarehouseItems.length === 0;

    if (!needsWarehouses && !needsItems && !needsUoms && !needsCentralItems) {
      return;
    }

    await loadMasters();
  }, [
    centralWarehouseItems.length,
    items.length,
    loadMasters,
    masterLoading,
    uoms.length,
    warehouses.length,
    warehouseScope,
  ]);

  const itemStockThresholdMap = useMemo(() => {
    const map = new Map<number, { minStockQty?: number | null; maxStockQty?: number | null }>();
    for (const item of items) {
      map.set(item.id, {
        minStockQty: item.minStockQty ?? null,
        maxStockQty: item.maxStockQty ?? null,
      });
    }
    return map;
  }, [items]);

  const visibleItemOptions = useMemo(() => {
    if (warehouseScope !== 'central') {
      return items;
    }
    const centralItemIds = new Set(
      centralWarehouseItems
        .filter((row) => row.isCenterItem && row.isActive)
        .map((row) => row.itemId),
    );
    return items.filter((item) => centralItemIds.has(item.id));
  }, [centralWarehouseItems, items, warehouseScope]);

  const stockQuickStatuses = useMemo<StockQuickStatus[]>(() => {
    const counts = {
      normal: 0,
      low: 0,
      out: 0,
    };

    const rows = warehouseScope === 'central' ? stockBalances : stockFacilities;

    for (const row of rows) {
      const status =
        warehouseScope === 'central'
          ? getStockLevel(
            row.availableQuantity ?? Math.max(0, row.quantity - (row.reservedQuantity ?? 0)),
            row.itemId != null ? itemStockThresholdMap.get(row.itemId)?.minStockQty ?? null : null,
            row.itemId != null ? itemStockThresholdMap.get(row.itemId)?.maxStockQty ?? null : null,
          )
          : normalizeStockFacilityStatus(row.status);
      counts[status] += 1;
    }

    return [
      {
        value: 'all',
        label: t('features.production.stock.filterPanel.allStatuses'),
        count: rows.length,
      },
      {
        value: 'normal',
        label: t('features.production.stock.table.stockStatus.normal'),
        count: counts.normal,
      },
      {
        value: 'low',
        label: t('features.production.stock.table.stockStatus.low'),
        count: counts.low,
      },
      {
        value: 'out',
        label: t('features.production.stock.table.stockStatus.out'),
        count: counts.out,
      },
    ];
  }, [
    itemStockThresholdMap,
    stockBalances,
    stockFacilities,
    t,
    warehouseScope,
  ]);

  const loadStockBalances = useCallback(async () => {
    if (!canViewInventory) {
      setStockBalances([]);
      setStockTotalCount(0);
      setStockLoading(false);
      return;
    }

    try {
      setStockLoading(true);
      setError(null);
      if (warehouseScope === 'central' && !centralWarehouseId) {
        setStockBalances([]);
        setStockTotalCount(0);
        return;
      }

      const requestParams = {
        warehouseId:
          warehouseScope === 'central'
            ? centralWarehouseId
            : filters.warehouseId,
        facilityId:
          warehouseScope === 'farm'
            ? (currentFacilityId ?? undefined)
            : undefined,
        facilityCode:
          warehouseScope === 'farm'
            ? (currentFacilityCode ?? undefined)
            : undefined,
        keyword: filters.search.trim() || undefined,
        stockStatus: filters.stockStatus,
        lotFilter: filters.lotFilter,
        includeZero: filters.includeZero,
        includePig: true,
        sortBy: filters.sortBy,
        sortDir: filters.sortDir,
        page: page + 1,
        pageSize: ROWS_PER_PAGE,
      };
      const response = await stockService.getPagedBalances(
        requestParams,
        warehouseScope === 'central',
      );
      setStockBalances(toStockBalanceRows(response.data ?? [], itemStockThresholdMap));
      setStockTotalCount(response.totalCount ?? 0);
    } catch (err: unknown) {
      console.error('Failed to load stock balances:', err);
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as {
          response?: { data?: { message?: string } };
        };
        setError(
          axiosError.response?.data?.message ||
          t('features.production.stock.alerts.loadError'),
        );
      } else {
        setError(t('features.production.stock.alerts.loadError'));
      }
    } finally {
      setStockLoading(false);
    }
  }, [
    canViewInventory,
    centralWarehouseId,
    currentFacilityCode,
    currentFacilityId,
    filters,
    itemStockThresholdMap,
    page,
    t,
    warehouseScope,
  ]);

  const loadDashboard = useCallback(async () => {
    if (!canViewInventory) {
      setDashboard(null);
      return;
    }

    try {
      if (warehouseScope === 'central' && !centralWarehouseId) {
        setDashboard(null);
        return;
      }

      const result = await stockService.getDashboard(
        warehouseScope === 'central' ? centralWarehouseId : undefined,
        warehouseScope === 'farm'
          ? (currentFacilityCode ?? undefined)
          : undefined,
        warehouseScope === 'central',
      );
      setDashboard(result);
    } catch {
      setDashboard(null);
    }
  }, [
    canViewInventory,
    centralWarehouseId,
    currentFacilityCode,
    warehouseScope,
  ]);

  const loadStockFacilities = useCallback(async () => {
    if (!canViewInventory || warehouseScope !== 'farm') {
      setStockFacilities([]);
      return;
    }

    try {
      setStockFacilitiesLoading(true);
      const rows = await stockService.getStockFacilities(
        {
          facilityId: currentFacilityId ?? undefined,
          facilityCode: currentFacilityCode ?? undefined,
        },
        false,
      );

      const filtered = rows.filter((row) => {
        const matchesItem =
          !filters.search.trim() ||
          row.itemCode === filters.search.trim() ||
          row.itemName
            .toLowerCase()
            .includes(filters.search.trim().toLowerCase());
        const normalizedStatus = (row.status ?? '').toLowerCase();
        const matchesStatus =
          filters.stockStatus === 'all' ||
          (filters.stockStatus === 'normal' && normalizedStatus === 'normal') ||
          (filters.stockStatus === 'low' && normalizedStatus === 'low') ||
          (filters.stockStatus === 'out' && normalizedStatus === 'out');
        return matchesItem && matchesStatus;
      });

      setStockFacilities(filtered);
    } catch (err) {
      console.error('Failed to load stock facilities:', err);
      setStockFacilities([]);
    } finally {
      setStockFacilitiesLoading(false);
    }
  }, [
    canViewInventory,
    currentFacilityCode,
    currentFacilityId,
    filters.search,
    filters.stockStatus,
    warehouseScope,
  ]);

  const loadReceivablePRs = useCallback(async () => {
    if (!canViewInventory) {
      setReceivablePRs([]);
      return;
    }

    try {
      const requestScopeKey = viewScopeKey;

      if (warehouseScope === 'central' && !centralWarehouseId) {
        setReceivablePRs([]);
        return;
      }

      const response = await stockService.getReceivablePurchaseRequests(
        {
          warehouseId:
            warehouseScope === 'central' ? centralWarehouseId : undefined,
          facilityId:
            warehouseScope === 'farm'
              ? (currentFacilityId ?? undefined)
              : undefined,
          facilityCode:
            warehouseScope === 'farm'
              ? (currentFacilityCode ?? undefined)
              : undefined,
          page: 1,
          pageSize: 20,
        },
        warehouseScope === 'central',
      );
      if (latestViewScopeRef.current !== requestScopeKey) {
        return;
      }
      setReceivablePRs(response.data);
    } catch {
      if (latestViewScopeRef.current !== viewScopeKey) {
        return;
      }
      setReceivablePRs([]);
    }
  }, [
    canViewInventory,
    centralWarehouseId,
    currentFacilityCode,
    currentFacilityId,
    viewScopeKey,
    warehouseScope,
    warehouses,
  ]);

  const loadPendingActivationPRs = useCallback(async () => {
    if (!canViewInventory) {
      setPendingActivationPRs([]);
      return;
    }

    try {
      const requestScopeKey = viewScopeKey;

      if (warehouseScope === 'central' && !centralWarehouseId) {
        setPendingActivationPRs([]);
        return;
      }

      const params = {
        facilityId:
          warehouseScope === 'farm'
            ? (currentFacilityId ?? undefined)
            : undefined,
        facilityCode:
          warehouseScope === 'farm'
            ? (currentFacilityCode ?? undefined)
            : undefined,
      };
      const skipFacilityContext = warehouseScope === 'central';
      const [awaitingRows, pendingRows] = await Promise.all([
        stockService.getAwaitingCompletionStockReceiveRequests(
          params,
          skipFacilityContext,
        ),
        stockService.getPendingStockReceiveRequests(
          params,
          skipFacilityContext,
        ),
      ]);
      if (latestViewScopeRef.current !== requestScopeKey) {
        return;
      }
      const mergedRows = [...awaitingRows, ...pendingRows].reduce<
        StockReceiveRequestResponse[]
      >((acc, row) => {
        if (!acc.some((existing) => existing.id === row.id)) {
          acc.push(row);
        }
        return acc;
      }, []);
      setPendingActivationPRs(mergedRows);
    } catch {
      if (latestViewScopeRef.current !== viewScopeKey) {
        return;
      }
      setPendingActivationPRs([]);
    }
  }, [
    canViewInventory,
    centralWarehouseId,
    currentFacilityCode,
    currentFacilityId,
    viewScopeKey,
    warehouseScope,
    warehouses,
  ]);

  const loadPendingIssueRequests = useCallback(async () => {
    if (!canViewInventory) {
      setPendingIssueRequests([]);
      return;
    }

    try {
      const rows = await stockIssueRequestService.getReadyToConfirm(
        warehouseScope === 'farm'
          ? {
            facilityId: currentFacilityId ?? undefined,
            facilityCode: currentFacilityCode ?? undefined,
          }
          : undefined,
      );
      setPendingIssueRequests(rows);
    } catch (err) {
      console.error('Failed to load pending issue requests:', err);
      setPendingIssueRequests([]);
    }
  }, [
    canViewInventory,
    currentFacilityCode,
    currentFacilityId,
    warehouseScope,
    warehouses,
  ]);

  const loadIssueTransactions = useCallback(async () => {
    if (!canViewInventory) {
      setIssueTransactions([]);
      return;
    }

    try {
      const requestScopeKey = viewScopeKey;

      if (warehouseScope === 'central' && !centralWarehouseId) {
        setIssueTransactions([]);
        return;
      }

      const response = await stockService.getTransactions(
        {
          type: 'Issue',
          warehouseId:
            warehouseScope === 'central' ? centralWarehouseId : undefined,
          facilityId:
            warehouseScope === 'farm'
              ? (currentFacilityId ?? undefined)
              : undefined,
          facilityCode:
            warehouseScope === 'farm'
              ? (currentFacilityCode ?? undefined)
              : undefined,
          page: 1,
          pageSize: 10,
        },
        warehouseScope === 'central',
      );
      if (latestViewScopeRef.current !== requestScopeKey) {
        return;
      }
      setIssueTransactions(response.data);
    } catch {
      if (latestViewScopeRef.current !== viewScopeKey) {
        return;
      }
      setIssueTransactions([]);
    }
  }, [
    canViewInventory,
    centralWarehouseId,
    currentFacilityCode,
    currentFacilityId,
    viewScopeKey,
    warehouseScope,
  ]);

  const loadTransferTransactions = useCallback(async () => {
    if (!canViewInventory) {
      setTransferTransactions([]);
      return;
    }

    try {
      const requestScopeKey = viewScopeKey;

      if (warehouseScope === 'central' && !centralWarehouseId) {
        setTransferTransactions([]);
        return;
      }

      const response = await stockService.getTransactions(
        {
          type: 'Transfer',
          warehouseId:
            warehouseScope === 'central' ? centralWarehouseId : undefined,
          facilityId:
            warehouseScope === 'farm'
              ? (currentFacilityId ?? undefined)
              : undefined,
          facilityCode:
            warehouseScope === 'farm'
              ? (currentFacilityCode ?? undefined)
              : undefined,
          page: 1,
          pageSize: 10,
        },
        warehouseScope === 'central',
      );
      if (latestViewScopeRef.current !== requestScopeKey) {
        return;
      }
      setTransferTransactions(response.data);
    } catch {
      if (latestViewScopeRef.current !== viewScopeKey) {
        return;
      }
      setTransferTransactions([]);
    }
  }, [
    canViewInventory,
    centralWarehouseId,
    currentFacilityCode,
    currentFacilityId,
    viewScopeKey,
    warehouseScope,
  ]);

  const loadReceiveTransactions = useCallback(async () => {
    if (!canViewInventory) {
      setReceiveTransactions([]);
      return;
    }

    try {
      const requestScopeKey = viewScopeKey;

      if (warehouseScope === 'central' && !centralWarehouseId) {
        setReceiveTransactions([]);
        return;
      }

      const response = await stockService.getTransactions(
        {
          type: 'Receive',
          facilityId:
            warehouseScope === 'farm'
              ? (currentFacilityId ?? undefined)
              : undefined,
          facilityCode:
            warehouseScope === 'farm'
              ? (currentFacilityCode ?? undefined)
              : undefined,
          includePig: true,
          page: 1,
          pageSize: 10,
        },
        warehouseScope === 'central',
      );
      if (latestViewScopeRef.current !== requestScopeKey) {
        return;
      }
      setReceiveTransactions(
        warehouseScope === 'central'
          ? response.data
          : response.data.filter(
            (row) => row.sourceDocumentType === 'PurchaseRequest',
          ),
      );
    } catch {
      if (latestViewScopeRef.current !== viewScopeKey) {
        return;
      }
      setReceiveTransactions([]);
    }
  }, [
    canViewInventory,
    centralWarehouseId,
    currentFacilityCode,
    currentFacilityId,
    viewScopeKey,
    warehouseScope,
  ]);

  const loadReceivingData = useCallback(
    async (options?: { silent?: boolean; force?: boolean }) => {
      if (!canViewInventory) {
        setReceivablePRs([]);
        setReceiveTransactions([]);
        return;
      }

      if (warehouseScope === 'central' && !centralWarehouseId) {
        setReceivablePRs([]);
        setReceiveTransactions([]);
        return;
      }

      if (!options?.force && receivingLoadedScopeRef.current === viewScopeKey) {
        return;
      }

      try {
        if (!options?.silent) {
          setReceivingLoading(true);
        }
        await Promise.all([loadReceivablePRs(), loadReceiveTransactions()]);
        receivingLoadedScopeRef.current = viewScopeKey;
      } finally {
        if (!options?.silent) {
          setReceivingLoading(false);
        }
      }
    },
    [
      canViewInventory,
      centralWarehouseId,
      loadReceivablePRs,
      loadReceiveTransactions,
      viewScopeKey,
      warehouseScope,
    ],
  );

  const loadPendingActivationData = useCallback(
    async (options?: { silent?: boolean; force?: boolean }) => {
      if (!canViewInventory) {
        setPendingActivationPRs([]);
        return;
      }

      if (warehouseScope === 'central' && !centralWarehouseId) {
        setPendingActivationPRs([]);
        return;
      }

      if (
        !options?.force &&
        pendingActivationLoadedScopeRef.current === viewScopeKey
      ) {
        return;
      }

      try {
        if (!options?.silent) {
          setPendingActivationLoading(true);
        }
        await loadPendingActivationPRs();
        pendingActivationLoadedScopeRef.current = viewScopeKey;
      } finally {
        if (!options?.silent) {
          setPendingActivationLoading(false);
        }
      }
    },
    [
      canViewInventory,
      centralWarehouseId,
      loadPendingActivationPRs,
      viewScopeKey,
      warehouseScope,
    ],
  );

  const loadIssueData = useCallback(
    async (options?: { silent?: boolean; force?: boolean }) => {
      if (!canViewInventory) {
        setPendingIssueRequests([]);
        setIssueTransactions([]);
        return;
      }

      if (!options?.force && issueLoadedScopeRef.current === viewScopeKey) {
        return;
      }

      try {
        if (!options?.silent) {
          setIssueLoading(true);
        }
        await Promise.all([
          loadPendingIssueRequests(),
          loadIssueTransactions(),
        ]);
        issueLoadedScopeRef.current = viewScopeKey;
      } finally {
        if (!options?.silent) {
          setIssueLoading(false);
        }
      }
    },
    [
      canViewInventory,
      loadIssueTransactions,
      loadPendingIssueRequests,
      viewScopeKey,
    ],
  );

  const loadTransferData = useCallback(
    async (options?: { silent?: boolean; force?: boolean }) => {
      if (!canViewInventory) {
        setTransferTransactions([]);
        return;
      }

      if (!options?.force && transferLoadedScopeRef.current === viewScopeKey) {
        return;
      }

      try {
        if (!options?.silent) {
          setTransferLoading(true);
        }
        await loadTransferTransactions();
        transferLoadedScopeRef.current = viewScopeKey;
      } finally {
        if (!options?.silent) {
          setTransferLoading(false);
        }
      }
    },
    [canViewInventory, loadTransferTransactions, viewScopeKey],
  );

  const loadAdjustmentRequestData = useCallback(async (options?: { silent?: boolean; force?: boolean }) => {
    if (!canViewInventory || !canRequestAdjustStock) {
      setMyAdjustmentRequests([]);
      return;
    }

    if (!options?.force && adjustmentRequestLoadedScopeRef.current === viewScopeKey) {
      return;
    }

    try {
      if (!options?.silent) {
        setAdjustmentLoading(true);
      }
      const rows = await stockAdjustmentRequestService.getMy({
        facilityId:
          warehouseScope === 'central'
            ? centralWarehouseFacilityId
            : currentFacilityId ?? undefined,
        facilityCode: warehouseScope === 'farm' ? currentFacilityCode ?? undefined : undefined,
      });
      if (latestViewScopeRef.current !== viewScopeKey) {
        return;
      }
      setMyAdjustmentRequests(rows);
      adjustmentRequestLoadedScopeRef.current = viewScopeKey;
    } catch (err: unknown) {
      if (latestViewScopeRef.current !== viewScopeKey) {
        return;
      }
      console.error(err);
      setMyAdjustmentRequests([]);
    } finally {
      if (!options?.silent) {
        setAdjustmentLoading(false);
      }
    }
  }, [
    canRequestAdjustStock,
    canViewInventory,
    centralWarehouseFacilityId,
    currentFacilityCode,
    currentFacilityId,
    viewScopeKey,
    warehouseScope,
  ]);

  const loadAdjustmentApprovalData = useCallback(async (options?: { silent?: boolean; force?: boolean }) => {
    if (!canViewInventory || !canApproveStock) {
      setPendingAdjustmentApprovals([]);
      return;
    }

    if (!options?.force && adjustmentApprovalLoadedScopeRef.current === viewScopeKey) {
      return;
    }

    try {
      if (!options?.silent) {
        setAdjustmentLoading(true);
      }
      const rows = await stockAdjustmentRequestService.getPendingApprovals({
        facilityId:
          warehouseScope === 'central'
            ? centralWarehouseFacilityId
            : currentFacilityId ?? undefined,
        facilityCode: warehouseScope === 'farm' ? currentFacilityCode ?? undefined : undefined,
      });
      if (latestViewScopeRef.current !== viewScopeKey) {
        return;
      }
      setPendingAdjustmentApprovals(rows);
      adjustmentApprovalLoadedScopeRef.current = viewScopeKey;
    } catch (err: unknown) {
      if (latestViewScopeRef.current !== viewScopeKey) {
        return;
      }
      console.error(err);
      setPendingAdjustmentApprovals([]);
    } finally {
      if (!options?.silent) {
        setAdjustmentLoading(false);
      }
    }
  }, [
    canApproveStock,
    canViewInventory,
    centralWarehouseFacilityId,
    currentFacilityCode,
    currentFacilityId,
    viewScopeKey,
    warehouseScope,
  ]);

  useEffect(() => {
    setCurrentFacilityId(getCurrentFacilityId());
    setCurrentFacilityCode(getCurrentFacilityCode());
    setCurrentFacilityIsCentralHub(false);
    const onFacilityChanged = () => {
      setCurrentFacilityId(getCurrentFacilityId());
      setCurrentFacilityCode(getCurrentFacilityCode());
      setCurrentFacilityIsCentralHub(false);
    };
    window.addEventListener(FACILITY_CHANGED_EVENT, onFacilityChanged);
    return () =>
      window.removeEventListener(FACILITY_CHANGED_EVENT, onFacilityChanged);
  }, []);

  useEffect(() => {
    if (!currentFacilityId) {
      setWarehouseScope('farm');
      setCurrentFacilityIsCentralHub(false);
      return;
    }

    let active = true;
    void (async () => {
      try {
        const response = await axiosInstance.get<FacilityScopeResponse>(`/api/Facilities/${currentFacilityId}`);
        if (!active) return;
        const isCentral = response.data?.isCentralHub === true;
        setCurrentFacilityIsCentralHub(isCentral);
        setWarehouseScope(isCentral ? 'central' : 'farm');
      } catch {
        if (!active) return;
        setCurrentFacilityIsCentralHub(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [currentFacilityId]);

  useEffect(() => {
    receivingLoadedScopeRef.current = '';
    pendingActivationLoadedScopeRef.current = '';
    issueLoadedScopeRef.current = '';
    adjustmentRequestLoadedScopeRef.current = '';
    adjustmentApprovalLoadedScopeRef.current = '';
    transferLoadedScopeRef.current = '';
    stockRevisionRef.current = null;
    stockRevisionInitializedRef.current = false;
    setReceivablePRs([]);
    setPendingActivationPRs([]);
    setPendingIssueRequests([]);
    setMyAdjustmentRequests([]);
    setPendingAdjustmentApprovals([]);
    setReceiveTransactions([]);
    setIssueTransactions([]);
    setTransferTransactions([]);
  }, [viewScopeKey]);

  useEffect(() => {
    if (dashboard !== null) return;
    void loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    if (activeTab !== 'farm-stock' || warehouseScope !== 'central' || stockBalances.length > 0) return;
    void loadStockBalances();
  }, [activeTab, loadStockBalances, stockBalances.length, warehouseScope]);

  useEffect(() => {
    if (activeTab !== 'farm-stock' || warehouseScope !== 'farm' || stockFacilities.length > 0) return;
    void loadStockFacilities();
  }, [activeTab, loadStockFacilities, stockFacilities.length, warehouseScope]);

  useEffect(() => {
    if (activeTab !== 'receiving') return;
    void loadReceivingData();
  }, [activeTab, loadReceivingData]);

  useEffect(() => {
    if (activeTab !== 'pending-activation') return;
    void loadPendingActivationData();
  }, [activeTab, loadPendingActivationData]);

  useEffect(() => {
    if (activeTab !== 'consumption') return;
    void loadIssueData();
  }, [activeTab, loadIssueData]);

  useEffect(() => {
    const handleStockIssueRequestsChanged = () => {
      void loadIssueData({ force: true, silent: true });
    };

    window.addEventListener(STOCK_ISSUE_REQUESTS_CHANGED_EVENT, handleStockIssueRequestsChanged);
    return () => {
      window.removeEventListener(STOCK_ISSUE_REQUESTS_CHANGED_EVENT, handleStockIssueRequestsChanged);
    };
  }, [loadIssueData]);

  useEffect(() => {
    if (activeTab !== 'transfer') return;
    void loadTransferData();
  }, [activeTab, loadTransferData]);

  useEffect(() => {
    if (activeTab !== 'adjust-requests') return;
    void loadAdjustmentRequestData();
  }, [activeTab, loadAdjustmentRequestData]);

  useEffect(() => {
    if (activeTab !== 'adjust-approvals') return;
    void loadAdjustmentApprovalData();
  }, [activeTab, loadAdjustmentApprovalData]);

  useEffect(() => {
    if (activeTab === 'adjust-requests' && !canRequestAdjustStock) {
      setActiveTab('farm-stock');
      return;
    }

    if (activeTab === 'adjust-approvals' && !canApproveStock) {
      setActiveTab('farm-stock');
    }
  }, [activeTab, canApproveStock, canRequestAdjustStock]);

  const refreshVisibleDataAfterRevisionChange = useCallback(async () => {
    const tasks: Array<Promise<unknown>> = [loadDashboard()];

    if (warehouseScope === 'central') {
      tasks.push(loadStockBalances());
    } else {
      tasks.push(loadStockFacilities());
    }

    if (activeTab === 'receiving') {
      tasks.push(loadReceivingData({ force: true, silent: true }));
    }

    if (activeTab === 'pending-activation') {
      tasks.push(loadPendingActivationData({ force: true, silent: true }));
    }

    if (activeTab === 'consumption') {
      tasks.push(loadIssueData({ force: true, silent: true }));
    }

    if (activeTab === 'transfer') {
      tasks.push(loadTransferData({ force: true, silent: true }));
    }

    if (activeTab === 'adjust-requests') {
      tasks.push(loadAdjustmentRequestData({ force: true, silent: true }));
    }

    if (activeTab === 'adjust-approvals') {
      tasks.push(loadAdjustmentApprovalData({ force: true, silent: true }));
    }

    await Promise.all(tasks);
  }, [
    activeTab,
    loadAdjustmentApprovalData,
    loadAdjustmentRequestData,
    loadDashboard,
    loadIssueData,
    loadPendingActivationData,
    loadReceivingData,
    loadStockBalances,
    loadStockFacilities,
    loadTransferData,
    warehouseScope,
  ]);

  const loadStockRevision = useCallback(async () => {
    if (!canViewInventory) {
      return;
    }

    if (stockRevisionPollInFlightRef.current) {
      return;
    }

    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }

    if (warehouseScope === 'central' && !centralWarehouseId) {
      return;
    }

    stockRevisionPollInFlightRef.current = true;

    try {
      const revisionFacilityId =
        warehouseScope === 'central'
          ? (currentFacilityId ?? centralWarehouseFacilityId ?? undefined)
          : (currentFacilityId ?? undefined);

      const response = await stockService.getStockFacilitiesRevision(
        {
          facilityId: revisionFacilityId,
          facilityCode: currentFacilityCode ?? undefined,
        },
        warehouseScope === 'central',
      );

      const nextRevision = response.revision ?? null;

      if (!stockRevisionInitializedRef.current) {
        stockRevisionRef.current = nextRevision;
        stockRevisionInitializedRef.current = true;
        return;
      }

      if (stockRevisionRef.current !== nextRevision) {
        stockRevisionRef.current = nextRevision;
        await refreshVisibleDataAfterRevisionChange();
      }
    } catch (err) {
      console.error('Failed to load stock revision:', err);
    } finally {
      stockRevisionPollInFlightRef.current = false;
    }
  }, [
    canViewInventory,
    centralWarehouseFacilityId,
    centralWarehouseId,
    currentFacilityCode,
    currentFacilityId,
    refreshVisibleDataAfterRevisionChange,
    warehouseScope,
  ]);

  useEffect(() => {
    if (!canViewInventory) return;

    void loadStockRevision();
    const intervalId = window.setInterval(() => {
      void loadStockRevision();
    }, 15000);

    const handleVisibilityChange = () => {
      void loadStockRevision();
    };

    window.addEventListener('focus', handleVisibilityChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleVisibilityChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [canViewInventory, loadStockRevision]);

  const inventoryContext = useMemo(
    () => resolveInventoryContext(warehouseScope, warehouses, currentFacilityId),
    [currentFacilityId, warehouseScope, warehouses],
  );
  const warehouseScopeContext = useMemo(
    () => createWarehouseScopeContext(warehouses, warehouseScope, currentFacilityId),
    [currentFacilityId, warehouseScope, warehouses],
  );
  const activeWarehouses = inventoryContext.scopedWarehouses;
  const inventoryCatalogMissing =
    mastersRequested && !masterLoading && (items.length === 0 || uoms.length === 0);
  const inventoryScopeWarning = mastersRequested && !masterLoading ? inventoryContext.scopeResolutionMessage : null;

  const isPigRequestType = useCallback((requestType?: string | null) => {
    return (requestType ?? '').toLowerCase() === 'pig';
  }, []);

  const visibleReceivablePRs = useMemo(() => {
    if (warehouseScope === 'central') {
      if (!centralWarehouseId) return [];
      return receivablePRs.filter((row) => row.destinationWarehouseId === centralWarehouseId);
    }

    return receivablePRs.filter((row) => row.destinationWarehouseId !== centralWarehouseId);
  }, [centralWarehouseId, receivablePRs, warehouseScope]);

  const visiblePendingActivationPRs = useMemo(() => {
    if (warehouseScope === 'central') {
      if (!centralWarehouseId) return [];
      return pendingActivationPRs.filter(
        (row) =>
          !isPigRequestType(row.requestType) &&
          row.warehouseId === centralWarehouseId,
      );
    }

    return pendingActivationPRs.filter((row) => !warehouseScopeContext.isCentralWarehouseId(row.warehouseId));
  }, [
    centralWarehouseId,
    isPigRequestType,
    pendingActivationPRs,
    warehouseScope,
    warehouseScopeContext,
  ]);

  const visiblePendingIssueRequests = useMemo(() => {
    if (warehouseScope === 'central') {
      return pendingIssueRequests
        .map((row) => ({
          ...row,
          lines: row.lines.filter((line) => {
            return warehouseScopeContext.isCentralWarehouseId(line.warehouseId);
          }),
        }))
        .filter((row) => row.lines.length > 0);
    }

    return pendingIssueRequests;
  }, [pendingIssueRequests, warehouseScope, warehouseScopeContext]);

  const adjustRequestQuickStatuses = useMemo(() => {
    const counts = {
      draft: 0,
      pending: 0,
      completed: 0,
    };

    for (const row of myAdjustmentRequests) {
      const group = toAdjustRequestStatusGroup(row.status);
      counts[group] += 1;
    }

    return [
      { value: 'all' as const, label: 'ทั้งหมด', count: myAdjustmentRequests.length },
      {
        value: 'draft' as const,
        label: ADJUST_REQUEST_STATUS_LABELS.draft,
        count: counts.draft,
      },
      {
        value: 'pending' as const,
        label: ADJUST_REQUEST_STATUS_LABELS.pending,
        count: counts.pending,
      },
      {
        value: 'completed' as const,
        label: ADJUST_REQUEST_STATUS_LABELS.completed,
        count: counts.completed,
      },
    ];
  }, [myAdjustmentRequests]);

  const filteredMyAdjustmentRequests = useMemo(() => {
    const keyword = adjustRequestAppliedFilters.documentNumber.trim().toLowerCase();

    return myAdjustmentRequests.filter((row) => {
      if (adjustRequestStatusFilter !== 'all' && toAdjustRequestStatusGroup(row.status) !== adjustRequestStatusFilter) {
        return false;
      }

      if (keyword && !String(row.documentNumber).toLowerCase().includes(keyword)) {
        return false;
      }

      const requestDate = String(row.requestDate).slice(0, 10);
      if (adjustRequestAppliedFilters.requestDateFrom && requestDate < adjustRequestAppliedFilters.requestDateFrom) {
        return false;
      }
      if (adjustRequestAppliedFilters.requestDateTo && requestDate > adjustRequestAppliedFilters.requestDateTo) {
        return false;
      }

      return true;
    });
  }, [adjustRequestAppliedFilters, adjustRequestStatusFilter, myAdjustmentRequests]);

  const handleAdjustRequestDraftFilterChange = useCallback((updates: Partial<AdjustRequestDraftFilters>) => {
    setAdjustRequestDraftFilters((prev) => ({
      ...prev,
      ...updates,
    }));
  }, []);

  const handleAdjustRequestSearch = useCallback(() => {
    setAdjustRequestAppliedFilters(adjustRequestDraftFilters);
  }, [adjustRequestDraftFilters]);

  const handleAdjustRequestClear = useCallback(() => {
    setAdjustRequestStatusFilter('all');
    setAdjustRequestDraftFilters(ADJUST_REQUEST_FILTER_DEFAULTS);
    setAdjustRequestAppliedFilters(ADJUST_REQUEST_FILTER_DEFAULTS);
  }, []);

  const warehouseOptions = useMemo<StockWarehouseOption[]>(() => {
    return activeWarehouses
      .map((warehouse) => ({
        warehouseId: warehouse.id,
        warehouseName: warehouse.name,
      }))
      .sort((a, b) => a.warehouseName.localeCompare(b.warehouseName));
  }, [activeWarehouses]);

  useEffect(() => {
    if (warehouseScope === 'central') return;
    if (filters.warehouseId === undefined) return;
    const exists = activeWarehouses.some(
      (warehouse) => warehouse.id === filters.warehouseId,
    );
    if (exists) return;
    setFilters((prev) => ({ ...prev, warehouseId: undefined }));
  }, [activeWarehouses, filters.warehouseId, warehouseScope]);

  const openReceiveDialog = useCallback(async (purchaseRequest: ReceivablePurchaseRequestRow) => {
    try {
      if (warehouses.length === 0) {
        await ensureMastersLoaded();
      }

      setSelectedReceivablePR(purchaseRequest);
      setReceiveDialogOpen(true);

      const requestScopeKey = viewScopeKey;
      void (async () => {
        try {
          const response = await stockService.getReceivablePurchaseRequests(
            {
              warehouseId:
                warehouseScope === 'central' ? centralWarehouseId ?? undefined : undefined,
              facilityId:
                warehouseScope === 'farm'
                  ? (currentFacilityId ?? undefined)
                  : undefined,
              facilityCode:
                warehouseScope === 'farm'
                  ? (currentFacilityCode ?? undefined)
                  : undefined,
              page: 1,
              pageSize: 100,
            },
            warehouseScope === 'central',
          );

          if (latestViewScopeRef.current !== requestScopeKey) {
            return;
          }

          const latestRequest =
            response.data.find((row) => row.id === purchaseRequest.id) ?? purchaseRequest;
          setSelectedReceivablePR(latestRequest);
        } catch (err) {
          console.error('Failed to refresh receivable PR before opening dialog:', err);
        }
      })();
    } catch (err) {
      console.error('Failed to open receivable PR dialog:', err);
      setSelectedReceivablePR(purchaseRequest);
      setReceiveDialogOpen(true);
    }
  }, [
    centralWarehouseId,
    currentFacilityCode,
    currentFacilityId,
    ensureMastersLoaded,
    latestViewScopeRef,
    viewScopeKey,
    warehouseScope,
    warehouses.length,
  ]);

  const openPendingReceiveRequestDialog = async (receiveRequest: StockReceiveRequestResponse) => {
    try {
      setPendingReceiveRequestActionLoading(true);
      const full = await stockService.getStockReceiveRequestById(
        receiveRequest.id,
        warehouseScope === 'central',
      );
      setSelectedPendingReceiveRequest(full);
      setPendingReceiveRequestDialogOpen(true);
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถโหลดรายละเอียดใบรับสินค้าได้');
    } finally {
      setPendingReceiveRequestActionLoading(false);
    }
  };

  const closeReceiveDialog = () => {
    setReceiveDialogOpen(false);
    setSelectedReceivablePR(null);
  };

  const closePendingReceiveRequestDialog = () => {
    setPendingReceiveRequestDialogOpen(false);
    setSelectedPendingReceiveRequest(null);
    setPendingReceiveRequestActionLoading(false);
  };

  const openReceiveHistoryDialog = (transaction: StockTransactionRow) => {
    setSelectedReceiveTransaction(transaction);
    setReceiveHistoryDialogOpen(true);
  };

  const closeReceiveHistoryDialog = () => {
    setReceiveHistoryDialogOpen(false);
    setSelectedReceiveTransaction(null);
  };

  const openIssueHistoryDialog = (transaction: StockTransactionRow) => {
    setSelectedIssueTransaction(transaction);
    setIssueHistoryDialogOpen(true);
  };

  const openPendingIssueRequestDialog = async (
    request: StockIssueRequestResponse,
  ) => {
    try {
      const full = await stockIssueRequestService.getById(request.id);
      setSelectedPendingIssueRequest(full);
      setPendingIssueRequestDialogOpen(true);
    } catch (err) {
      console.error(err);
      setError('ไม่สามารถโหลดรายละเอียดใบขอตัดสต๊อกได้');
    }
  };

  const closePendingIssueRequestDialog = () => {
    setPendingIssueRequestDialogOpen(false);
    setSelectedPendingIssueRequest(null);
  };

  const closeIssueHistoryDialog = () => {
    setIssueHistoryDialogOpen(false);
    setSelectedIssueTransaction(null);
  };

  const openTransferHistoryDialog = (transaction: StockTransactionRow) => {
    setSelectedTransferTransaction(transaction);
    setTransferHistoryDialogOpen(true);
  };

  const closeTransferHistoryDialog = () => {
    setTransferHistoryDialogOpen(false);
    setSelectedTransferTransaction(null);
  };

  const openStockFacilityDialog = async (
    facilityRow: StockFacilityResponse,
  ) => {
    try {
      setSelectedStockFacility(facilityRow);
      setStockFacilityDialogOpen(true);
      setStockFacilityDetailLoading(true);
      const response = await stockService.getStockBalances(
        undefined,
        facilityRow.itemId,
        currentFacilityCode ?? undefined,
        true,
      );
      const detailRows = response.items
        .filter((row) => row.itemId === facilityRow.itemId)
        .sort((a, b) => {
          const lotCompare = (a.lotNumber ?? '').localeCompare(
            b.lotNumber ?? '',
            undefined,
            { numeric: true },
          );
          if (lotCompare !== 0) return lotCompare;
          return (a.feedSiloCode ?? '').localeCompare(b.feedSiloCode ?? '');
        });
      setStockFacilityDetails(detailRows);
    } catch (err) {
      console.error('Failed to load stock facility details:', err);
      setStockFacilityDetails([]);
    } finally {
      setStockFacilityDetailLoading(false);
    }
  };

  const openTransactionDialog = async (mode: WarehouseTransactionMode) => {
    await ensureMastersLoaded();
    setTransactionMode(mode);
    setTransactionDialogOpen(true);
  };

  const closeTransactionDialog = () => {
    setTransactionDialogOpen(false);
    setTransactionMode(null);
  };

  const closeStockFacilityDialog = () => {
    setStockFacilityDialogOpen(false);
    setSelectedStockFacility(null);
    setStockFacilityDetails([]);
  };

  const handleAfterTransaction = async () => {
    const tasks: Array<Promise<unknown>> = [loadDashboard()];

    if (warehouseScope === 'central') {
      tasks.push(loadStockBalances());
    } else {
      tasks.push(
        (async () => {
          await stockService.rebuildStockFacilities(
            {
              facilityId: currentFacilityId ?? undefined,
              facilityCode: currentFacilityCode ?? undefined,
            },
            false,
          );
          await loadStockFacilities();
        })(),
      );
    }

    tasks.push(loadPendingActivationData({ force: true }));
    tasks.push(loadReceivingData({ force: true }));

    if (activeTab === 'consumption') {
      tasks.push(loadIssueData({ force: true }));
    }

    if (activeTab === 'transfer') {
      tasks.push(loadTransferData({ force: true }));
    }

    if (activeTab === 'adjust-requests') {
      tasks.push(loadAdjustmentRequestData({ force: true }));
    }

    if (activeTab === 'adjust-approvals') {
      tasks.push(loadAdjustmentApprovalData({ force: true }));
    }

    await Promise.all(tasks);
    stockRevisionRef.current = null;
    stockRevisionInitializedRef.current = false;
  };

  const handleConfirmIssueRequest = async () => {
    if (!selectedPendingIssueRequest) return;

    try {
      setIssueRequestActionLoading(true);
      await stockIssueRequestService.confirm(selectedPendingIssueRequest.id);
      closePendingIssueRequestDialog();
      await handleAfterTransaction();
      await Swal.fire({
        icon: 'success',
        title: 'ยืนยันตัดสต๊อกสำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      const errorMessage = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string } | undefined)?.message ??
          'กรุณาตรวจสอบ stock คงเหลือและลองอีกครั้ง')
        : 'กรุณาตรวจสอบ stock คงเหลือและลองอีกครั้ง';
      await Swal.fire({
        icon: 'error',
        title: 'ยืนยันตัดสต๊อกไม่สำเร็จ',
        text: errorMessage,
      });
    } finally {
      setIssueRequestActionLoading(false);
    }
  };

  const handleRejectIssueRequest = async (comment: string) => {
    if (!selectedPendingIssueRequest) return;

    try {
      setIssueRequestActionLoading(true);
      await stockIssueRequestService.reject(
        selectedPendingIssueRequest.id,
        comment,
      );
      closePendingIssueRequestDialog();
      await handleAfterTransaction();
      await Swal.fire({
        icon: 'success',
        title: 'ไม่ยืนยันรายการสำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      await Swal.fire({
        icon: 'error',
        title: 'ดำเนินการไม่สำเร็จ',
        text: 'กรุณาลองอีกครั้ง',
      });
    } finally {
      setIssueRequestActionLoading(false);
    }
  };

  const handleApproveAdjustmentRequest = async (requestId: number) => {
    try {
      const input = await Swal.fire({
        icon: 'question',
        title: 'ยืนยันอนุมัติคำขอปรับยอด',
        input: 'text',
        inputPlaceholder: 'หมายเหตุ (ถ้ามี)',
        showCancelButton: true,
        confirmButtonText: 'อนุมัติ',
        cancelButtonText: 'ยกเลิก',
      });

      if (!input.isConfirmed) return;

      setAdjustmentActionLoading(true);
      await stockAdjustmentRequestService.approve(requestId, String(input.value ?? '').trim());
      await handleAfterTransaction();
      await Swal.fire({
        icon: 'success',
        title: 'อนุมัติคำขอสำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      const errorMessage = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string } | undefined)?.message ?? 'ไม่สามารถอนุมัติคำขอได้')
        : 'ไม่สามารถอนุมัติคำขอได้';
      await Swal.fire({
        icon: 'error',
        title: 'อนุมัติไม่สำเร็จ',
        text: errorMessage,
      });
    } finally {
      setAdjustmentActionLoading(false);
    }
  };

  const handleRejectAdjustmentRequest = async (requestId: number) => {
    try {
      const input = await Swal.fire({
        icon: 'warning',
        title: 'ไม่อนุมัติคำขอปรับยอด',
        input: 'text',
        inputPlaceholder: 'กรอกเหตุผล (อย่างน้อย 5 ตัวอักษร)',
        showCancelButton: true,
        confirmButtonText: 'ไม่อนุมัติ',
        cancelButtonText: 'ยกเลิก',
      });

      if (!input.isConfirmed) return;
      const reason = String(input.value ?? '').trim();
      if (reason.length < 5) {
        await Swal.fire({
          icon: 'error',
          title: 'ข้อมูลไม่ครบถ้วน',
          text: 'กรุณากรอกเหตุผลอย่างน้อย 5 ตัวอักษร',
        });
        return;
      }

      setAdjustmentActionLoading(true);
      await stockAdjustmentRequestService.reject(requestId, reason);
      await handleAfterTransaction();
      await Swal.fire({
        icon: 'success',
        title: 'ไม่อนุมัติคำขอสำเร็จ',
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      const errorMessage = axios.isAxiosError(err)
        ? ((err.response?.data as { message?: string } | undefined)?.message ?? 'ไม่สามารถไม่อนุมัติคำขอได้')
        : 'ไม่สามารถไม่อนุมัติคำขอได้';
      await Swal.fire({
        icon: 'error',
        title: 'ดำเนินการไม่สำเร็จ',
        text: errorMessage,
      });
    } finally {
      setAdjustmentActionLoading(false);
    }
  };

  useEffect(() => {
    const maxPage = Math.max(Math.ceil(stockTotalCount / ROWS_PER_PAGE) - 1, 0);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [stockTotalCount, page]);

  const stats = useMemo(() => {
    return {
      totalRecords:
        warehouseScope === 'farm' ? stockFacilities.length : stockTotalCount,
    };
  }, [stockFacilities.length, stockTotalCount, warehouseScope]);

  const pageTabItems = [
    { key: 'farm-stock', label: 'คลังฟาร์ม' },
    { key: 'pending-activation', label: 'รอรับเข้าคลัง' },
    { key: 'receiving', label: 'รายงานรับเข้า' },
    { key: 'consumption', label: 'รายงานตัดสต๊อก' },
    { key: 'transfer', label: 'รายงานโอนย้าย' },
  ];

  if (!canViewInventory) {
    return (
      <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, md: 2 } }}>
        <Stack spacing={2}>
          <Alert severity="warning">
            คุณไม่มีสิทธิ์เข้าถึงหน้าคลังสินค้า
          </Alert>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 1, md: 2 } }}
    >
      <WorkspaceHeader
        chipLabel="Material Stock"
        title="คลังสินค้าและจัดซื้อ"
        meta="Dashboard / คลังสินค้า"
      />

      <Stack spacing={2.5}>
        <Stack spacing={2.5}>
          <Box
            sx={{
              gridTemplateColumns: { xs: '1fr', lg: 'minmax(0,1fr) 240px' },
              gap: 1.5,
            }}
          >
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatsCard
                  title="รายการคงคลัง"
                  value={formatNumber(stats.totalRecords)}
                  subtitle="จำนวนรายการทั้งหมด"
                  icon={<LayersOutlined />}
                  color="info"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatsCard
                  title="มูลค่าสต็อก (บาท)"
                  value={formatNumber(dashboard?.totalStockValue ?? 0, 2)}
                  subtitle="ยอดรวมคงคลัง"
                  icon={<Inventory2Outlined />}
                  color="primary"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatsCard
                  title={warehouseScope === 'central' ? 'รายการรออนุมัติ PR' : 'รออนุมัติ PR'}
                  value={formatNumber(dashboard?.pendingPRCount ?? dashboard?.pendingPrCount ?? 0)}
                  subtitle="สถานะ Pending"
                  icon={<InputOutlined />}
                  color="warning"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <StatsCard
                  title={warehouseScope === 'central' ? 'รอเข้าคลังกลาง' : 'รอรับเข้าคลัง'}
                  value={formatNumber(dashboard?.pendingReceiptCount ?? visibleReceivablePRs.length)}
                  subtitle="รอการรับเข้า"
                  icon={<CheckCircleOutlineOutlined />}
                  color="success"
                />
              </Grid>
            </Grid>
          </Box>
          <Box
            sx={{
              ...panelSx,
              px: 1,
              py: 1,
            }}
          >
            <PageTabs
              tabs={pageTabItems}
              activeKey={activeTab}
              onChange={(key) => {
                setActiveTab(key as typeof activeTab);
                setWarehouseScope('farm');
                if (key === 'farm-stock') setWarehouseScope('farm');
              }}
            />
          </Box>

          {inventoryCatalogMissing && (
            <Alert
              severity="warning"
              sx={{
                width: '100%',
                alignItems: 'center',
                '& .MuiAlert-message': { width: '100%' },
              }}
              action={
                <StockActionButton
                  tone="neutral"
                  size="small"
                  onClick={() => {
                    void loadMasters();
                  }}
                >
                  โหลดใหม่
                </StockActionButton>
              }
            >
              ข้อมูลสินค้า หรือหน่วยนับยังไม่พร้อมสำหรับทำรายการ
            </Alert>
          )}
          {inventoryScopeWarning && (
            <Alert
              severity="info"
              sx={{
                width: '100%',
                alignItems: 'center',
                '& .MuiAlert-message': { width: '100%' },
              }}
            >
              {inventoryScopeWarning}
            </Alert>
          )}

          {error && (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              icon={<WarningAmberRounded fontSize="inherit" />}
              sx={{}}
            >
              {error}
            </Alert>
          )}

          <Box
            sx={{
              ...panelSx,
              p: 1.5,
            }}
          >
            <Box>
              {activeTab === 'farm-stock' && (
                <Stack spacing={2}>
                  <StockFilters
                    filters={filters}
                    onChange={(nextFilters) => {
                      setFilters(nextFilters);
                      setPage(0);
                    }}
                    warehouseOptions={warehouseOptions}
                    itemOptions={visibleItemOptions}
                    quickStatuses={stockQuickStatuses}
                    compactSummaryMode={true}
                  />
                  <Typography
                    variant="caption"
                    color="red"
                    sx={{ display: 'block', textAlign: 'right' }}
                  >
                    *ดับเบิลคลิกที่แถวเพื่อดูรายละเอียดเพิ่มเติม
                  </Typography>
                  {warehouseScope === 'central' ? (
                    <StockList
                      data={stockBalances}
                      loading={stockLoading}
                      totalCount={stockTotalCount}
                      page={page}
                      rowsPerPage={ROWS_PER_PAGE}
                      onPageChange={setPage}
                    />
                  ) : (
                    <StockFacilityList
                      data={stockFacilities}
                      loading={stockFacilitiesLoading}
                      onViewDetails={openStockFacilityDialog}
                    />
                  )}
                </Stack>
              )}

              {activeTab === 'receiving' && (
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    {warehouseScope === 'central'
                      ? 'รับสินค้าเข้าคลังกลางจาก PR ที่อนุมัติแล้ว'
                      : 'รับสินค้าเข้าคลังจาก PR ที่อนุมัติแล้ว'}
                  </Typography>
                  <ReceivablePurchaseRequestList
                    rows={visibleReceivablePRs}
                    centralWarehouseId={centralWarehouseId}
                    loading={receivingLoading}
                    disabled={!canReceiveStock}
                    onReceive={openReceiveDialog}
                  />
                  <Stack spacing={1}>
                    <Typography variant="subtitle1" fontWeight={800}>
                      ประวัติการรับสินค้า {currentScopeLabel}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ textAlign: 'right', display: 'block' }}
                    >
                      *ดับเบิลคลิกที่แถวเพื่อดูรายละเอียดเพิ่มเติม
                    </Typography>
                    <ReceiveTransactionList
                      rows={receiveTransactions}
                      loading={receivingLoading}
                      onView={openReceiveHistoryDialog}
                    />
                  </Stack>
                </Stack>
              )}

              {activeTab === 'pending-activation' && (
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    รายการใบรับสินค้าที่รับของแล้ว แต่ยังรอรับเข้าคลังสมบูรณ์ใน
                    {currentScopeLabel}
                  </Typography>
                  <PendingReceiveRequestList
                    rows={visiblePendingActivationPRs}
                    loading={pendingActivationLoading}
                    disabled={!canReceiveStock || pendingReceiveRequestActionLoading}
                    onManage={openPendingReceiveRequestDialog}
                  />
                </Stack>
              )}

              {activeTab === 'consumption' && (
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    ตรวจสอบรายการขอตัดที่ผ่านอนุมัติแล้ว
                    ก่อนยืนยันตัดสต๊อกจริงจาก{currentScopeLabel}
                  </Typography>
                  <PendingIssueRequestList
                    rows={visiblePendingIssueRequests}
                    loading={issueLoading}
                    onView={openPendingIssueRequestDialog}
                  />
                  <Stack spacing={1}>
                    <Typography variant="subtitle1" fontWeight={800}>
                      ประวัติตัดสต๊อก
                    </Typography>
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ textAlign: 'right', display: 'block' }}
                    >
                      *ดับเบิลคลิกที่แถวเพื่อดูรายละเอียดเพิ่มเติม
                    </Typography>
                    <IssueTransactionList
                      rows={issueTransactions}
                      loading={issueLoading}
                      onView={openIssueHistoryDialog}
                    />
                  </Stack>
                </Stack>
              )}

              {activeTab === 'transfer' && (
                <Stack spacing={2}>
                  <Typography variant="body2" color="text.secondary">
                    ประวัติการโอนย้ายของ{currentScopeLabel}
                  </Typography>
                  <TransferTransactionList
                    rows={transferTransactions}
                    loading={transferLoading}
                    onView={openTransferHistoryDialog}
                  />
                </Stack>
              )}
            </Box>
          </Box>
        </Stack>
        <StockTransactionDialog
          open={transactionDialogOpen}
          mode={transactionMode}
          warehouses={activeWarehouses}
          allWarehouses={warehouses}
          defaultFromWarehouseId={activeWarehouses[0]?.id ?? 0}
          items={visibleItemOptions}
          uoms={uoms}
          onClose={closeTransactionDialog}
          onSubmitted={handleAfterTransaction}
        />
        <ReceivePurchaseRequestDialog
          open={receiveDialogOpen}
          purchaseRequest={selectedReceivablePR}
          warehouses={activeWarehouses}
          onClose={closeReceiveDialog}
          onSubmitted={handleAfterTransaction}
        />
        <StockReceiveRequestDetailsDialog
          open={pendingReceiveRequestDialogOpen}
          data={selectedPendingReceiveRequest}
          onClose={closePendingReceiveRequestDialog}
          onSubmitted={handleAfterTransaction}
        />
        <ReceiveTransactionDetailsDialog
          open={receiveHistoryDialogOpen}
          transaction={selectedReceiveTransaction}
          transactions={receiveTransactions}
          onClose={closeReceiveHistoryDialog}
        />
        <IssueTransactionDetailsDialog
          open={issueHistoryDialogOpen}
          transaction={selectedIssueTransaction}
          onClose={closeIssueHistoryDialog}
        />
        <StockIssueRequestDetailsDialog
          open={pendingIssueRequestDialogOpen}
          mode="confirm"
          data={selectedPendingIssueRequest}
          actionLoading={issueRequestActionLoading}
          onClose={closePendingIssueRequestDialog}
          onReject={handleRejectIssueRequest}
          onConfirm={handleConfirmIssueRequest}
        />
        <TransferTransactionDetailsDialog
          open={transferHistoryDialogOpen}
          transaction={selectedTransferTransaction}
          onClose={closeTransferHistoryDialog}
        />
        <Dialog
          open={stockFacilityDialogOpen}
          onClose={closeStockFacilityDialog}
          fullWidth
          maxWidth="md"
        >
          <DialogTitleWithClose onClose={closeStockFacilityDialog} variant="plain">
            รายละเอียดคงคลังสินค้า
          </DialogTitleWithClose>
          <DialogContent dividers>
            <Stack spacing={2}>
              <Paper
                sx={{
                  p: 2,
                  borderRadius: 10,
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: 'none',
                }}
              >
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      md: '1.2fr 0.6fr 0.6fr 1fr',
                    },
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      สินค้า
                    </Typography>
                    <Typography variant="body1" fontWeight={800}>
                      {selectedStockFacility?.itemName ?? '-'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedStockFacility?.itemCode ?? '-'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      คงเหลือรวม
                    </Typography>
                    <Typography variant="body1" fontWeight={800}>
                      {formatNumber(selectedStockFacility?.onHandQuantity ?? 0)}{' '}
                      {selectedStockFacility?.stockUomName ?? ''}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      จองไว้รวม
                    </Typography>
                    <Typography variant="body1" fontWeight={800}>
                      {formatNumber(
                        selectedStockFacility?.reservedQuantity ?? 0,
                      )}{' '}
                      {selectedStockFacility?.stockUomName ?? ''}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      ฟาร์ม
                    </Typography>
                    <Typography variant="body1" fontWeight={800}>
                      {selectedStockFacility?.facilityName ?? '-'}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              <Typography variant="subtitle1" fontWeight={800}>
                รายละเอียดจาก lot และไซโล
              </Typography>

              <TableContainer
                component={Paper}
                sx={{
                  borderRadius: 10,
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: 'none',
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Lot</TableCell>
                      <TableCell>วันหมดอายุ</TableCell>
                      <TableCell>ไซโล</TableCell>
                      <TableCell>คลัง</TableCell>
                      <TableCell align="right">คงเหลือ</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stockFacilityDetailLoading ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          กำลังโหลด...
                        </TableCell>
                      </TableRow>
                    ) : stockFacilityDetailRows.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                          ไม่พบข้อมูล lot/ไซโล
                        </TableCell>
                      </TableRow>
                    ) : (
                      stockFacilityDetailRows.map((row) => (
                        <TableRow key={row.key}>
                          <TableCell>{row.lotNumber}</TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {row.expiryDate ? new Date(row.expiryDate).toLocaleDateString('th-TH') : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            {getFeedSiloDisplayLabel(
                              row.feedSiloName,
                              row.feedSiloCode,
                            )}
                          </TableCell>
                          <TableCell>{row.warehouseName}</TableCell>
                          <TableCell align="right">
                            {formatNumber(row.quantity)} {row.uomName}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </DialogContent>
        </Dialog>
      </Stack>
    </Box>
  );
}
