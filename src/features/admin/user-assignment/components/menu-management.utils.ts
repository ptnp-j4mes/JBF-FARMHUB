import type { MenuListResponse } from '@/features/admin/menu-management/types';

export function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.\-\s]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function sortMenuRows(rows: MenuListResponse[]): MenuListResponse[] {
  return [...rows].sort((left, right) => left.sortOrder - right.sortOrder || left.id - right.id);
}

export function getToggleLabel(isActive: boolean): string {
  return isActive ? 'ปิดใช้งาน' : 'เปิดใช้งาน';
}
