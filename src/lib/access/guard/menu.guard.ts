import { authService } from '@/features/auth/services/auth.service';

export interface MenuGuardOptions {
  facilityId?: number | null;
  enforceScope?: boolean;
  requiredPermissionCodes?: string[];
}

export function canAccessMenu(
  menuSlugOrPath: string,
  options: MenuGuardOptions = {},
): boolean {
  return authService.canAccessMenu(menuSlugOrPath, options);
}
