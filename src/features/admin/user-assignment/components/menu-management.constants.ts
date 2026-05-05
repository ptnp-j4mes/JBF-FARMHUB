export const MENU_TABLE_COLUMNS = [
  'ลำดับ',
  'ชื่อ (ไทย)',
  'ไอคอน',
  'Path',
  'สถานะ',
  'จัดการ',
] as const;

export const MENU_TABLE_CHILD_COLUMNS = [
  '',
  ...MENU_TABLE_COLUMNS,
] as const;

/** Fixed widths per column name; undefined = auto / flex. */
export const MENU_TABLE_COLUMN_WIDTHS: Record<string, number | undefined> = {
  '': 48,          // drag handle
  'ลำดับ': 80,
  'ชื่อ (ไทย)': undefined,
  'ไอคอน': 140,
  'Path': undefined,
  'สถานะ': 130,
  'จัดการ': 180,
};
