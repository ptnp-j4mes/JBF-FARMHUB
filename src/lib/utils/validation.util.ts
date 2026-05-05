/**
 * Validation Utilities
 * 
 * Helper functions for form validation
 */
import dayjs from '@/lib/dayjs';

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate Thai phone number
 */
export const isValidPhoneNumber = (phone: string): boolean => {
  const phoneRegex = /^0[0-9]{9}$/;
  const cleaned = phone.replace(/\D/g, '');
  return phoneRegex.test(cleaned);
};

/**
 * Validate Thai ID card number
 */
export const isValidThaiID = (id: string): boolean => {
  if (!/^\d{13}$/.test(id)) return false;

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(id.charAt(i)) * (13 - i);
  }
  
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(id.charAt(12));
};

/**
 * Validate password strength
 * Returns: { valid: boolean, errors: string[] }
 */
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวพิมพ์เล็กอย่างน้อย 1 ตัว');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว');
  }

  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว (!@#$%^&*)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Validate required field
 */
export const isRequired = (value: unknown): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

/**
 * Validate number range
 */
export const isInRange = (value: number, min: number, max: number): boolean => {
  return value >= min && value <= max;
};

/**
 * Validate min length
 */
export const hasMinLength = (value: string, minLength: number): boolean => {
  return value.length >= minLength;
};

/**
 * Validate max length
 */
export const hasMaxLength = (value: string, maxLength: number): boolean => {
  return value.length <= maxLength;
};

/**
 * Validate URL format
 */
export const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate positive number
 */
export const isPositiveNumber = (value: number): boolean => {
  return value > 0;
};

/**
 * Validate date is in the future
 */
export const isFutureDate = (date: string | Date): boolean => {
  const d = dayjs(date);
  return d.isValid() && d.isAfter(dayjs());
};

/**
 * Validate date is in the past
 */
export const isPastDate = (date: string | Date): boolean => {
  const d = dayjs(date);
  return d.isValid() && d.isBefore(dayjs());
};
