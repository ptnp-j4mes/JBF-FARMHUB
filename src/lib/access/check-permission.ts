import { authService } from '@/features/auth/services/auth.service';

export type PermissionMode = 'any' | 'all';

export interface PermissionCheckOptions {
  requiredPermissions?: string[];
  mode?: PermissionMode;
  facilityId?: number | null;
}

export function hasPermission(
  options: PermissionCheckOptions = {},
): boolean {
  const {
    requiredPermissions = [],
    mode = 'all',
    facilityId,
  } = options;

  if (!requiredPermissions.length) {
    return true;
  }

  return mode === 'all'
    ? authService.hasAllPermissions(requiredPermissions, { facilityId })
    : authService.hasAnyPermission(requiredPermissions, { facilityId });
}
