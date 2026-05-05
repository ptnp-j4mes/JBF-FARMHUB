import { hasPermission, type PermissionCheckOptions } from '../check-permission';

export function canRunAction(
  options: PermissionCheckOptions = {},
): boolean {
  return hasPermission(options);
}
