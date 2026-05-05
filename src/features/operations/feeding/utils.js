/**
 * Feeding page utility functions
 */

export const todayIso = () => new Date().toISOString().slice(0, 10);

export const toDisplayQty = (quantityKg, meta) => {
  const numeric = Number(quantityKg ?? 0);
  if (!meta?.isBagDisplay || !meta.kgPerDisplayUnit || meta.kgPerDisplayUnit <= 0) {
    return numeric;
  }
  return numeric / meta.kgPerDisplayUnit;
};

export const toKgQty = (displayQty, meta) => {
  const numeric = Number(displayQty ?? 0);
  if (!meta?.isBagDisplay || !meta.kgPerDisplayUnit || meta.kgPerDisplayUnit <= 0) {
    return numeric;
  }
  return numeric * meta.kgPerDisplayUnit;
};

export const formatFeedQuantity = (quantityKg, meta) => {
  const numericKg = Number(quantityKg ?? 0);
  if (!meta?.isBagDisplay || !meta.kgPerDisplayUnit || meta.kgPerDisplayUnit <= 0) {
    return `${numericKg.toLocaleString(undefined, { maximumFractionDigits: 3 })} กก.`;
  }
  const displayQty = toDisplayQty(numericKg, meta);
  return `${displayQty.toLocaleString(undefined, { maximumFractionDigits: 3 })} ${meta.displayUomName || 'กระสอบ'}`;
};

export const formatFeedQuantityWithSecondaryKg = (quantityKg, meta) => {
  const numericKg = Number(quantityKg ?? 0);
  if (!meta?.isBagDisplay || !meta.kgPerDisplayUnit || meta.kgPerDisplayUnit <= 0) {
    return `${numericKg.toLocaleString(undefined, { maximumFractionDigits: 3 })} กก.`;
  }
  const displayQty = toDisplayQty(numericKg, meta);
  return `${displayQty.toLocaleString(undefined, { maximumFractionDigits: 3 })} ${meta.displayUomName || 'กระสอบ'} (${numericKg.toLocaleString(undefined, { maximumFractionDigits: 3 })} กก.)`;
};

export const getCartCount = (quantityKg, cartWeightKg) => {
  const numericKg = Number(quantityKg ?? 0);
  if (numericKg <= 0) return 0;

  const numericCartWeight = Number(cartWeightKg ?? 0);
  if (!Number.isFinite(numericCartWeight) || numericCartWeight <= 0) {
    return 1;
  }

  return Math.ceil(numericKg / numericCartWeight);
};

export const formatSignedKg = (value) =>
  `${value > 0 ? '+' : ''}${value.toLocaleString(undefined, { maximumFractionDigits: 3 })} กก.`;

export const normalizeFeedCodeForMatch = (feedItemCode) => {
  const upper = (feedItemCode ?? '').trim().toUpperCase();
  if (!upper) return '';
  const tail = upper.includes('-') ? upper.slice(upper.lastIndexOf('-') + 1) : upper;
  if (tail.endsWith('0') || tail.endsWith('L')) {
    return tail.slice(0, -1);
  }
  return tail;
};
