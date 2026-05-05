/**
 * UI-Specific Types
 * 
 * Types for UI components, forms, and user interactions
 */

/**
 * Loading State
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * Form Field Error
 */
export interface FieldError {
  field: string;
  message: string;
}

/**
 * Form State
 */
export interface FormState<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

/**
 * Dialog Props
 */
export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
}

/**
 * Confirmation Dialog Props
 */
export interface ConfirmDialogProps extends DialogProps {
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  severity?: 'info' | 'warning' | 'error' | 'success';
}

/**
 * Table Column Definition
 */
export interface TableColumn<T = Record<string, unknown>> {
  id: keyof T | string;
  label: string;
  width?: number | string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
}

/**
 * Table Props
 */
export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  pagination?: boolean;
  pageSize?: number;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onSortChange?: (field: string, order: 'asc' | 'desc') => void;
}

/**
 * Breadcrumb Item
 */
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

/**
 * Tab Item
 */
export interface TabItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  badge?: number | string;
}

/**
 * Status Badge Props
 */
export interface StatusBadgeProps {
  status: string;
  variant?: 'filled' | 'outlined';
  size?: 'small' | 'medium';
}

/**
 * Empty State Props
 */
export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Notification
 */
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}
