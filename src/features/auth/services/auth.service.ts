import Cookies from 'js-cookie';
import { apiClient } from '@/lib/api/client';
import { ApiError } from '@/lib/api/errors';
import { normalizePermissionCode } from '@/lib/access/permission-code';
import {
  ensureCurrentFacilityForUser,
  setCurrentFacilityContext,
} from '@/lib/facility-context';
import {
  isAccessContextApplicable,
  readCurrentAccessContext,
  setCurrentAccessContext,
  isWithinScope,
} from '@/lib/access-context';
import { invalidateAccessBootstrapCache } from './access-context.service';
import type {
  LoginRequest,
  LoginResponse,
  UserPermissionScopeResponse,
  UserInfoResponse,
} from '../types';

interface ScopedPermissionOptions {
  facilityId?: number | null;
}

interface MenuAccessOptions extends ScopedPermissionOptions {
  enforceScope?: boolean;
}

interface PermissionContext {
  isSuperAdmin: boolean;
  hasAdminRole: boolean;
  basePermissions: Set<string>;
  scopedOverrides: NormalizedPermissionScopeOverride[];
  hasPermissionData: boolean;
}

interface NormalizedPermissionScopeOverride {
  permissionCode: string;
  effect: 'allow' | 'deny';
  facilityNodeId: number | null;
}

function hasFreshFarmSnapshot(user: UserInfoResponse | null): boolean {
  return Boolean(user?.accessibleFarmNodes?.length);
}

export const authService = {
  setUser: (user: UserInfoResponse | null): void => {
    if (typeof window === 'undefined') return;
    if (!user) {
      localStorage.removeItem('user_info');
      invalidateAccessBootstrapCache();
      return;
    }

    localStorage.setItem('user_info', JSON.stringify(user));
    invalidateAccessBootstrapCache();
    ensureCurrentFacilityForUser(user);
  },

  /**
   * Login user
   * @param credentials - Username and password
   * @returns Login response with the user snapshot returned by the backend proxy
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.user) {
      authService.setUser(response.user);
      setCurrentAccessContext(null);
    }

    return response;
  },

  /**
   * Logout user
   * Clears client auth state and asks the backend proxy to revoke the session
   */
  logout: () => {
    void apiClient
      .post('/api/auth/logout', {}, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .catch(() => undefined);
    Cookies.remove('auth_status');
    Cookies.remove('auth_status', { path: '/' });
    setCurrentFacilityContext(null);
    setCurrentAccessContext(null);
    invalidateAccessBootstrapCache();
    localStorage.removeItem('user_info');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  /**
   * Get current user from local storage
   * @returns User info or null if not authenticated
   */
  getUser: (): UserInfoResponse | null => {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('user_info');
    if (!user) return null;

    try {
      return JSON.parse(user) as UserInfoResponse;
    } catch {
      localStorage.removeItem('user_info');
      return null;
    }
  },

  /**
   * Hydrate latest user profile from backend (scope/name/permission snapshot)
   * while keeping current session.
   */
  hydrateUser: async (): Promise<UserInfoResponse | null> => {
    const cachedUser = authService.getUser();
    if (!authService.isAuthenticated()) {
      return cachedUser;
    }

    const needsProfileRefresh = !hasFreshFarmSnapshot(cachedUser);
    if (!needsProfileRefresh && cachedUser) {
      return cachedUser;
    }

    try {
      if (needsProfileRefresh) {
        await authService.bootstrapUser();
      }
    } catch {
      if (needsProfileRefresh) {
        try {
          await authService.bootstrapUser();
        } catch {
          // Use cached snapshot when bootstrap/refresh is temporarily unavailable.
        }
      }
    }

    return authService.getUser() ?? cachedUser;
  },

  /**
   * Check if user is authenticated
   * @returns True if user has valid token
   */
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return Cookies.get('auth_status') === '1';
  },

  /**
   * Access token is kept server-side in an HttpOnly cookie.
   * The client no longer reads it directly.
   */
  getToken: (): string | null => {
    return null;
  },

  /**
   * Refresh Access Token
   * @returns True when the session was refreshed successfully
   */
  refreshToken: async (): Promise<boolean> => {
    try {
      const response = await apiClient.post<LoginResponse>('/api/auth/refresh', {}, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.user) {
        authService.setUser(response.user);
      }

      return true;
    } catch (error) {
      const statusCode = error instanceof ApiError ? error.status : undefined;

      // Session expired/invalid refresh token: clear auth state so guards can redirect to login.
      if (statusCode === 401 || statusCode === 403) {
        authService.logout();
        return false;
      }

      console.error('Failed to refresh token', error);
    }
    return false;
  },

  bootstrapUser: async (): Promise<UserInfoResponse | null> => {
    if (!authService.isAuthenticated()) {
      return authService.getUser();
    }

    try {
      const response = await apiClient.get<UserInfoResponse>('/api/auth/bootstrap');

      if (response) {
        authService.setUser(response);
        return response;
      }
    } catch (error) {
      const statusCode = error instanceof ApiError ? error.status : undefined;
      if (statusCode === 401 || statusCode === 403) {
        authService.logout();
        return null;
      }

      console.error('Failed to bootstrap user session', error);
    }

    return authService.getUser();
  },

  hasPermissionData: (): boolean => {
    const user = authService.getUser();
    const context = buildPermissionContext(user);
    return context.hasPermissionData || context.isSuperAdmin || context.hasAdminRole;
  },

  /**
   * Check if user has specific permission
   * @param permission - Permission string (e.g., 'purchase_request.view')
   */
  hasPermission: (permission: string, options: ScopedPermissionOptions = {}): boolean => {
    const user = authService.getUser();
    const normalizedTarget = normalizePermission(permission);
    if (!normalizedTarget) return false;

    const context = buildPermissionContext(user);
    const targetFacilityId = normalizeFacilityId(options.facilityId);
    const overrideState = resolveOverrideState(
      context.scopedOverrides,
      normalizedTarget,
      targetFacilityId,
    );

    if (overrideState.hasDeny) {
      return false;
    }

    if (targetFacilityId && !authService.hasScope(targetFacilityId)) {
      return false;
    }

    if (context.hasAdminRole) {
      return true;
    }

    if (overrideState.hasAllow) {
      return true;
    }

    return context.basePermissions.has(normalizedTarget);
  },

  /**
   * Check if user has access to specific facility
   * @param facilityId - Facility ID
   */
  hasScope: (facilityId: number): boolean => {
    const user = authService.getUser();
    if (!user) return false;

    const targetFacilityId = normalizeFacilityId(facilityId);
    if (!targetFacilityId) return false;

    const selectedAccess = readCurrentAccessContext();
    const hasValidSelectedAccess = isAccessContextApplicable(selectedAccess, user);
    if (selectedAccess && hasValidSelectedAccess) {
      const selectedScopeNodeId = normalizeFacilityId(selectedAccess.scopeNodeId);
      if (!selectedScopeNodeId) {
        return true;
      }

      // Hierarchy-aware check: Is targetFacilityId a child of selectedScopeNodeId?
      return isWithinScope(targetFacilityId, selectedScopeNodeId, user.scopeNodes ?? []);
    }

    const scopeIds = new Set<number>();
    (user.scopes ?? []).forEach((scopeId) => {
      const normalized = normalizeFacilityId(scopeId);
      if (normalized) {
        scopeIds.add(normalized);
      }
    });
    (user.accessibleFarmNodes ?? []).forEach((node) => {
      const normalized = normalizeFacilityId(node?.facilityNodeId);
      if (normalized) {
        scopeIds.add(normalized);
      }
    });
    (user.scopeNodes ?? []).forEach((node) => {
      const normalized = normalizeFacilityId(node?.facilityNodeId);
      if (normalized) {
        scopeIds.add(normalized);
      }
    });

    // Fail-open for legacy payloads that do not provide scope claims.
    if (scopeIds.size === 0) {
      return true;
    }

    return scopeIds.has(targetFacilityId);
  },

  hasAnyPermission: (
    permissions: string[],
    options: ScopedPermissionOptions = {},
  ): boolean => {
    return permissions.some((permission) => authService.hasPermission(permission, options));
  },

  hasAllPermissions: (
    permissions: string[],
    options: ScopedPermissionOptions = {},
  ): boolean => {
    return permissions.every((permission) => authService.hasPermission(permission, options));
  },

  hasPermissionPrefix: (
    prefix: string,
    options: ScopedPermissionOptions = {},
  ): boolean => {
    const normalizedPrefix = normalizePermission(prefix);
    if (!normalizedPrefix) return false;

    const user = authService.getUser();
    const context = buildPermissionContext(user);
    if (!context.hasPermissionData) return false;

    const targetFacilityId = normalizeFacilityId(options.facilityId);
    if (targetFacilityId && !authService.hasScope(targetFacilityId)) {
      return false;
    }

    if (context.hasAdminRole) {
      return true;
    }

    const candidates = new Set<string>();
    context.basePermissions.forEach((permission) => {
      if (permission.startsWith(normalizedPrefix)) {
        candidates.add(permission);
      }
    });
    context.scopedOverrides.forEach((permission) => {
      if (permission.permissionCode.startsWith(normalizedPrefix)) {
        candidates.add(permission.permissionCode);
      }
    });

    if (candidates.size === 0) {
      return false;
    }

    return Array.from(candidates).some((permission) =>
      authService.hasPermission(permission, { facilityId: targetFacilityId }),
    );
  },

  canAccessMenu: (
    _menuSlugOrPath: string,
    options: MenuAccessOptions & { requiredPermissionCodes?: string[] } = {},
  ): boolean => {
    const user = authService.getUser();
    const context = buildPermissionContext(user);
    const targetFacilityId = normalizeFacilityId(options.facilityId);

    if (options.enforceScope && targetFacilityId && !authService.hasScope(targetFacilityId)) {
      return false;
    }

    if (context.isSuperAdmin) {
      return true;
    }

    // DB-driven menu permissions: only evaluate explicit permission codes from the tree.
    if (options.requiredPermissionCodes && options.requiredPermissionCodes.length > 0) {
      return options.requiredPermissionCodes.some((perm) =>
        authService.hasPermission(perm, { facilityId: targetFacilityId }),
      );
    }

    return true;
  },
};

function normalizePermission(permission: string | undefined | null): string | null {
  return normalizePermissionCode(permission);
}

function normalizeFacilityId(value: number | null | undefined): number | null {
  if (!Number.isFinite(value)) return null;
  const parsed = Number(value);
  return parsed > 0 ? parsed : null;
}

function normalizeUserPermissionScopes(
  rawScopes: UserPermissionScopeResponse[] | undefined,
): NormalizedPermissionScopeOverride[] {
  if (!rawScopes?.length) return [];

  return rawScopes
    .map((scope): NormalizedPermissionScopeOverride | null => {
      const permissionCode = normalizePermission(scope.permissionCode);
      const effect = scope.effect?.trim().toLowerCase();
      if (!permissionCode || (effect !== 'allow' && effect !== 'deny')) {
        return null;
      }

      return {
        permissionCode,
        effect,
        facilityNodeId: normalizeFacilityId(scope.facilityNodeId),
      };
    })
    .filter((scope): scope is NormalizedPermissionScopeOverride => Boolean(scope));
}

function isAdminRole(user: UserInfoResponse | null): boolean {
  if (!user) return false;
  const codes = (user.roleCodes ?? []).map(c => c?.trim().toLowerCase());
  const roles = (user.roles ?? []).map(r => r?.trim().toLowerCase());
  return codes.includes('super_admin') || codes.includes('adm') || codes.includes('admin') || roles.includes('admin') || roles.includes('ผู้ดูแลระบบ');
}

function buildPermissionContext(
  user: UserInfoResponse | null,
): PermissionContext {
  const selectedAccess = readCurrentAccessContext();
  const hasValidSelectedAccess = isAccessContextApplicable(selectedAccess, user);
  const isSelectedAccessMode = Boolean(selectedAccess && hasValidSelectedAccess);
  if (selectedAccess && !hasValidSelectedAccess) {
    setCurrentAccessContext(null);
  }

  const fromUser = new Set(
    (user?.permissions ?? [])
      .map((item) => normalizePermission(item))
      .filter((item): item is string => Boolean(item)),
  );
  const selectedAccessPermissions = isSelectedAccessMode
    ? new Set(
        (selectedAccess?.permissionCodes ?? [])
          .map((permissionCode) => normalizePermission(permissionCode))
          .filter((permissionCode): permissionCode is string => Boolean(permissionCode)),
      )
    : new Set<string>();

  const defaultBasePermissions = fromUser;
  const basePermissions = isSelectedAccessMode ? selectedAccessPermissions : defaultBasePermissions;
  const scopedOverrides = isSelectedAccessMode
    ? []
    : normalizeUserPermissionScopes(user?.permissionScopes);
  const selectedAccessRoleCode = selectedAccess?.roleCode?.trim().toLowerCase();
  const hasAdminRoleFromSelectedAccess = isSelectedAccessMode && (selectedAccessRoleCode === 'adm' || selectedAccessRoleCode === 'admin' || selectedAccessRoleCode === 'super_admin');

  return {
    isSuperAdmin: user?.isSuperAdmin === true,
    hasAdminRole: isSelectedAccessMode ? hasAdminRoleFromSelectedAccess : isAdminRole(user),
    basePermissions,
    scopedOverrides,
    hasPermissionData:
      isSelectedAccessMode || basePermissions.size > 0 || scopedOverrides.length > 0,
  };
}

function resolveOverrideState(
  scopedOverrides: NormalizedPermissionScopeOverride[],
  permissionCode: string,
  facilityId: number | null,
): {
  hasAllow: boolean;
  hasDeny: boolean;
} {
  let hasAllow = false;
  let hasDeny = false;

  scopedOverrides.forEach((override) => {
    if (override.permissionCode !== permissionCode) {
      return;
    }

    const isApplicableScope =
      facilityId === null
        ? override.facilityNodeId === null
        : override.facilityNodeId === null || override.facilityNodeId === facilityId;
    if (!isApplicableScope) {
      return;
    }

    if (override.effect === 'deny') {
      hasDeny = true;
      return;
    }
    hasAllow = true;
  });

  return { hasAllow, hasDeny };
}

// Re-export types for convenience
export type { UserInfoResponse as User } from '../types';
export type { LoginRequest } from '../types';
