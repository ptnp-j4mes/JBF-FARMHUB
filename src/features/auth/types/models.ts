/**
 * Auth Module - Model Types
 * 
 * Entity models matching backend Models/Auth/*.cs
 */

import type { BaseEntity } from '@/types';

/**
 * User Entity - Matches backend User.cs
 */
export interface User extends BaseEntity {
  username: string;
  email: string;
  prefix?: string | null;
  firstName: string;
  lastName: string;
  userScopes: UserScope[];
}

/**
 * Role Entity - Matches backend Role.cs
 */
export interface Role extends BaseEntity {
  name: string;
  description: string;
  rolePermissions: RolePermission[];
}

/**
 * Permission Entity - Matches backend Permission.cs
 */
export interface Permission extends BaseEntity {
  resource: string; // e.g., "PurchaseRequest"
  action: string; // e.g., "view", "approve", "soft_delete"
  description: string;
}

/**
 * Role Permission - Junction table
 */
export interface RolePermission {
  roleId: number;
  permissionId: number;
  permission?: Permission;
}

/**
 * User Scope - For facility/location access control
 */
export interface UserScope {
  userId: number;
  facilityId: number;
}

/**
 * Session Entity - Matches backend Session.cs
 */
export interface Session extends BaseEntity {
  userId: number;
  token: string;
  refreshToken: string;
  expiresAt: string;
  ipAddress: string;
  userAgent: string;
}
