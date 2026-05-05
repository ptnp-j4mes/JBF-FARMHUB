import type { StockBalanceResponse } from '../types';

export type FeedSiloIdentityInput = {
  itemId?: number | null;
  pigItemId?: number | null;
  stockLotId?: number | null;
  lotNumber?: string | null;
};

export type FeedSiloCompatibility = {
  compatible: boolean;
  occupied: boolean;
  reason?: string;
};

function normalizeLotNumber(value?: string | null): string {
  return (value ?? '').trim();
}

function buildIdentityKey(
  itemId?: number | null,
  pigItemId?: number | null,
  stockLotId?: number | null,
  lotNumber?: string | null,
): string | null {
  if (!itemId && !pigItemId) {
    return null;
  }

  const identity = itemId ? `item:${itemId}` : `pig:${pigItemId}`;
  if (stockLotId && stockLotId > 0) {
    return `${identity}|lotId:${stockLotId}`;
  }

  const normalizedLotNumber = normalizeLotNumber(lotNumber);
  return `${identity}|lotNo:${normalizedLotNumber}`;
}

export function getFeedSiloCompatibility(
  balances: StockBalanceResponse[],
  feedSiloId: number,
  identity: FeedSiloIdentityInput,
): FeedSiloCompatibility {
  const occupiedBalances = balances.filter((balance) => {
    if (balance.feedSiloId !== feedSiloId) return false;
    return Number(balance.quantity ?? 0) > 0;
  });

  if (occupiedBalances.length === 0) {
    return {
      compatible: true,
      occupied: false,
    };
  }

  const requestedKey = buildIdentityKey(
    identity.itemId,
    identity.pigItemId,
    identity.stockLotId,
    identity.lotNumber,
  );

  if (!requestedKey) {
    return {
      compatible: true,
      occupied: true,
      reason: 'กรอก lot ก่อนเพื่อเช็กความเข้ากันของไซโล',
    };
  }

  const existingKeys = Array.from(
    new Set(
      occupiedBalances
        .map((balance) => buildIdentityKey(balance.itemId, balance.pigItemId, balance.stockLotId, balance.lotNumber))
        .filter((value): value is string => Boolean(value)),
    ),
  );

  if (existingKeys.length === 1 && existingKeys[0] === requestedKey) {
    return {
      compatible: true,
      occupied: true,
      reason: 'ใช้ไซโลเดิมของ item/lot นี้ได้',
    };
  }

  return {
    compatible: false,
    occupied: true,
    reason: 'ไซโลนี้มีสินค้า/ล็อตอื่นอยู่แล้ว',
  };
}
