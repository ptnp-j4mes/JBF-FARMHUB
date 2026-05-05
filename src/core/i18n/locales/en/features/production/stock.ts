import type { TranslationTree } from '@/core/i18n/types';

export const productionStockEn: TranslationTree = {
  page: {
    title: 'Material Stock',
    subtitle: 'Monitor on-hand inventory by warehouse and lot for accurate issue operations',
    actions: {
      refresh: 'Refresh',
      export: 'Export',
    },
    searchPlaceholder: 'Search by item name, item code, lot, or warehouse...',
    filterButton: 'Filter',
  },
  filterPanel: {
    warehouse: 'Warehouse',
    allWarehouses: 'All warehouses',
    stockStatus: 'Stock status',
    allStatuses: 'All statuses',
    lotStatus: 'Lot status',
    allLotStatuses: 'All lots',
    withLot: 'With lot number',
    withoutLot: 'Without lot number',
    reset: 'Reset',
    apply: 'Search',
  },
  alerts: {
    loadError: 'Unable to load stock balances',
  },
  cards: {
    totalRecords: 'Stock records',
    uniqueItems: 'Unique items',
    uniqueWarehouses: 'Warehouses',
    lowStock: 'Low stock',
    outOfStock: 'Out of stock',
    totalQuantity: 'Total quantity',
  },
  table: {
    columns: {
      item: 'Item',
      warehouse: 'Warehouse',
      lot: 'Lot',
      stockCompact: 'Balance / Status',
      balance: 'Balance',
      stockStatus: 'Status',
    },
    stockStatus: {
      normal: 'Normal',
      low: 'Low',
      out: 'Out',
    },
    noData: 'No stock data found',
    totalItems: 'Total {count} records',
  },
  export: {
    filenamePrefix: 'material-stock',
    columns: {
      itemCode: 'Item Code',
      itemName: 'Item Name',
      warehouse: 'Warehouse',
      lot: 'Lot',
      quantity: 'Quantity',
      uom: 'Unit',
      status: 'Status',
    },
  },
};
