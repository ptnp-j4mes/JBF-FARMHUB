export type StockLevel = 'normal' | 'low' | 'out';

export const getStockLevel = (
  quantity: number,
  minStockQty?: number | null,
  maxStockQty?: number | null,
): StockLevel => {
  if (quantity <= 0) return 'out';
  if (minStockQty != null && quantity < minStockQty) return 'low';
  if (maxStockQty != null && quantity > maxStockQty) return 'normal';
  return 'normal';
};

export const hasLotNumber = (lotNumber?: string | null): boolean => {
  if (!lotNumber) return false;
  return lotNumber.trim().length > 0;
};
