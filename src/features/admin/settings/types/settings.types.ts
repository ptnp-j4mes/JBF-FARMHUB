/**
 * Admin Module - Settings Types
 * 
 * Types for system settings and configuration
 */

/**
 * System Settings
 */
export interface SystemSettings {
  general: GeneralSettings;
  security: SecuritySettings;
  notification: NotificationSettings;
  display: DisplaySettings;
}

/**
 * General Settings
 */
export interface GeneralSettings {
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  taxId?: string;
  fiscalYearStart: number; // Month (1-12)
  defaultCurrency: string;
  defaultLanguage: string;
  timezone: string;
}

/**
 * Security Settings
 */
export interface SecuritySettings {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireDigit: boolean;
  passwordRequireSpecialChar: boolean;
  passwordExpiryDays: number;
  sessionTimeoutMinutes: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  requireTwoFactor: boolean;
}

/**
 * Notification Settings
 */
export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  emailServer?: string;
  emailPort?: number;
  emailUsername?: string;
  emailPassword?: string;
  emailFromAddress?: string;
  emailFromName?: string;
  smsProvider?: string;
  smsApiKey?: string;
}

/**
 * Display Settings
 */
export interface DisplaySettings {
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  secondaryColor: string;
  dateFormat: string;
  timeFormat: string;
  numberFormat: string;
  pageSize: number;
}

/**
 * Update Settings Request
 */
export interface UpdateSettingsRequest {
  general?: Partial<GeneralSettings>;
  security?: Partial<SecuritySettings>;
  notification?: Partial<NotificationSettings>;
  display?: Partial<DisplaySettings>;
}

/**
 * Settings Category
 */
export enum SettingsCategory {
  General = 'General',
  Security = 'Security',
  Notification = 'Notification',
  Display = 'Display',
}
