import { authService } from '@/features/auth/services/auth.service';
import { hasPermission, type PermissionCheckOptions } from '../check-permission';

export interface DataGuardOptions extends PermissionCheckOptions {
  requireScope?: boolean;
}

export function canAccessData(
  options: DataGuardOptions = {},
): boolean {
  const { facilityId, requireScope = false, ...permissionOptions } = options;

  if (!hasPermission({ ...permissionOptions, facilityId })) {
    return false;
  }

  if (requireScope && facilityId) {
    return authService.hasScope(facilityId);
  }

  return true;
}
