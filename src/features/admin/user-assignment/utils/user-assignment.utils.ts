import type { FilterableSelectFieldOption } from '@/components/common';
import type {
  FilterState,
  RoleScope,
} from '../types/user-assignment.types';

export const EMPTY_FILTERS: FilterState = {
  company: '',
  role: '',
  farm: '',
  zone: '',
  house: '',
};

export function normalizeText(value: string): string {
  return value.trim().toLowerCase();
}

export function normalizeCode(value: string): string {
  return value.trim().toUpperCase();
}

export function toRoleCode(name: string): string {
  return name
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
    .replace(/[^A-Z0-9_]/g, '');
}

export function uniqueSorted(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((left, right) =>
    left.localeCompare(right),
  );
}

export function createEmptyRoleScope(): RoleScope {
  return {
    role: '',
    farm: '',
    zone: '',
    house: '',
  };
}

export function toUniqueSelectOptions(
  options: FilterableSelectFieldOption[],
  keyResolver: (option: FilterableSelectFieldOption) => string = (option) =>
    String(option.value),
): FilterableSelectFieldOption[] {
  const map = new Map<string, FilterableSelectFieldOption>();
  options.forEach((item) => {
    const key = keyResolver(item);
    if (!map.has(key)) {
      map.set(key, item);
    }
  });

  return Array.from(map.values()).sort((left, right) => left.label.localeCompare(right.label));
}
