import { hasPermission, type PermissionCheckOptions } from '../check-permission';

export function canRenderUi(
  options: PermissionCheckOptions = {},
): boolean {
  return hasPermission(options);
}
