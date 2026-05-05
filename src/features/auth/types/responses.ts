/**
 * Auth Module - Response DTOs
 * 
 * Response types for Auth API endpoints
 * Matches backend DTOs/Responses/Auth/*.cs
 */

/**
 * User Info Response - Matches backend UserInfoResponse.cs
 */
export interface UserPermissionScopeResponse {
  permissionId: number;
  permissionCode: string;
  effect: 'allow' | 'deny';
  facilityNodeId: number | null;
  facilityCode?: string | null;
  facilityName?: string | null;
}

export interface UserScopeNodeResponse {
  facilityNodeId: number;
  parentId?: number | null;
  facilityCode: string;
  facilityName: string;
  facilityType: string;
  path: string;
  depth: number;
}

export interface UserInfoResponse {
  id: number;
  username: string;
  prefix?: string | null;
  firstName: string;
  lastName: string;
  companyId: number;
  companyName: string;
  isSuperAdmin?: boolean;
  roles: string[];
  roleCodes: string[];
  permissions?: string[]; // Optional for compatibility when backend does not return expanded claims
  scopes?: number[]; // Optional for compatibility when backend does not return expanded claims
  scopeNodes?: UserScopeNodeResponse[]; // Active scope nodes with metadata (farm/zone/house/pen)
  accessibleFarmNodes?: UserScopeNodeResponse[]; // Active farm nodes user can actually use
  permissionScopes?: UserPermissionScopeResponse[]; // User-level overrides with optional facility scope
  requirePasswordReset: boolean;
}

/**
 * Login Response - Matches backend LoginResponse.cs
 */
export interface LoginResponse {
  expiresIn: number; // seconds
  user: UserInfoResponse;
}

/**
 * Refresh Token Response
 */
export interface RefreshTokenResponse {
  expiresIn: number;
}

/**
 * Register Response
 */
export interface RegisterResponse {
  success: boolean;
  message: string;
  user: UserInfoResponse;
}
