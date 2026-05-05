export function naturalTextCompare(left: string, right: string): number {
  return left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' });
}

export function formatCodeNameLabel(code?: string | null, name?: string | null): string {
  const normalizedCode = (code ?? '').trim();
  const normalizedName = (name ?? '').trim();

  if (!normalizedCode) return normalizedName;
  if (!normalizedName) return normalizedCode;
  if (normalizedCode.localeCompare(normalizedName, undefined, { sensitivity: 'base' }) === 0) {
    return normalizedName;
  }

  return `${normalizedCode} - ${normalizedName}`;
}

export function getFeedSiloDisplayLabel(name?: string | null, code?: string | null): string {
  return (name ?? '').trim() || (code ?? '').trim() || '-';
}
