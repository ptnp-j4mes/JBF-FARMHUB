/**
 * Auth Module - Request DTOs
 * 
 * Request types for Auth API endpoints
 */

/**
 * Login Request - Matches backend LoginRequest.cs
 */
export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * Register Request
 */
export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  firstName: string;
  lastName: string;
}

/**
 * Refresh Token Request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Change Password Request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Reset Password Request
 */
export interface ResetPasswordRequest {
  email: string;
}

/**
 * Confirm Reset Password Request
 */
export interface ConfirmResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}
