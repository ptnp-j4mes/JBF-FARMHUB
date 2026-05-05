/**
 * Date Utilities
 * 
 * Helper functions for date formatting and manipulation
 */
import dayjs from '@/lib/dayjs';

/**
 * Format date to Thai locale
 */
export const formatDateThai = (date: string | Date): string => {
  const d = dayjs(date);
  if (!d.isValid()) return '-';
  return `${d.format('D MMMM')} ${d.year() + 543}`;
};

/**
 * Format date to short format (DD/MM/YYYY)
 */
export const formatDateShort = (date: string | Date): string => {
  const d = dayjs(date);
  if (!d.isValid()) return '-';
  return `${d.format('DD/MM')}/${d.year() + 543}`;
};

/**
 * Format datetime
 */
export const formatDateTime = (date: string | Date): string => {
  const d = dayjs(date);
  if (!d.isValid()) return '-';
  return `${d.format('DD/MM')}/${d.year() + 543} ${d.format('HH:mm')}`;
};

/**
 * Format time only
 */
export const formatTime = (date: string | Date): string => {
  const d = dayjs(date);
  if (!d.isValid()) return '-';
  return d.format('HH:mm');
};

/**
 * Get relative time (e.g., "2 hours ago")
 */
export const getRelativeTime = (date: string | Date): string => {
  const d = dayjs(date);
  if (!d.isValid()) return '-';
  const diffMins = dayjs().diff(d, 'minute');
  const diffHours = dayjs().diff(d, 'hour');
  const diffDays = dayjs().diff(d, 'day');

  if (diffMins < 1) return 'เมื่อสักครู่';
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
  
  return formatDateShort(d.toDate());
};

/**
 * Calculate age in days
 */
export const calculateAgeInDays = (birthDate: string | Date): number => {
  const birth = dayjs(birthDate);
  if (!birth.isValid()) return 0;
  return dayjs().diff(birth, 'day');
};

/**
 * Calculate age in months
 */
export const calculateAgeInMonths = (birthDate: string | Date): number => {
  const birth = dayjs(birthDate);
  if (!birth.isValid()) return 0;
  return dayjs().diff(birth, 'month');
};

/**
 * Check if date is today
 */
export const isToday = (date: string | Date): boolean => {
  const d = dayjs(date);
  if (!d.isValid()) return false;
  return d.isSame(dayjs(), 'day');
};

/**
 * Convert to ISO date string (YYYY-MM-DD)
 */
export const toISODateString = (date: Date): string => {
  return dayjs(date).format('YYYY-MM-DD');
};
