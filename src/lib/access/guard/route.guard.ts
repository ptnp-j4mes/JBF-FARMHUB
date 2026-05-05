import { getMenuGroupsCached } from '@/core/config/menu-tree-cache';
import {
  isMenuItemActivePath,
  type MenuGroupConfig,
  type MenuItemConfig,
} from '@/core/config/menu.config';
import { canAccessMenu, type MenuGuardOptions } from './menu.guard';

function normalizeRoutePath(path: string): string {
  const trimmed = path.trim().toLowerCase();
  if (!trimmed) return '/';
  if (trimmed === '/') return '/';
  return trimmed.replace(/\/+$/, '') || '/';
}

function getMatchScore(item: MenuItemConfig): number {
  const itemPathScore = normalizeRoutePath(item.path).length;
  const prefixScore = item.activePathPrefix
    ? normalizeRoutePath(item.activePathPrefix).length
    : 0;
  return Math.max(itemPathScore, prefixScore);
}

function findBestMenuItem(
  menuGroups: MenuGroupConfig[],
  routePath: string,
): MenuItemConfig | null {
  const normalizedRoutePath = normalizeRoutePath(routePath);
  let bestItem: MenuItemConfig | null = null;
  let bestScore = -1;

  menuGroups.forEach((group) => {
    group.items.forEach((item) => {
      if (!item.path || item.path === '#') {
        return;
      }

      if (!isMenuItemActivePath(normalizedRoutePath, item.path, item.activePathPrefix)) {
        return;
      }

      const score = getMatchScore(item);
      if (score > bestScore) {
        bestScore = score;
        bestItem = item;
      }
    });
  });

  return bestItem;
}

async function resolveRequiredPermissionCodes(routePath: string): Promise<string[] | null> {
  const menuGroups = await getMenuGroupsCached();
  if (menuGroups.length === 0) {
    return null;
  }

  const bestItem = findBestMenuItem(menuGroups, routePath);
  return bestItem?.requiredPermissionCodes ?? null;
}

export async function canAccessRoute(
  routePath: string,
  options: MenuGuardOptions = {},
): Promise<boolean> {
  if (options.requiredPermissionCodes && options.requiredPermissionCodes.length > 0) {
    return canAccessMenu(routePath, options);
  }

  const requiredPermissionCodes = await resolveRequiredPermissionCodes(routePath);
  return canAccessMenu(routePath, {
    ...options,
    requiredPermissionCodes: requiredPermissionCodes ?? options.requiredPermissionCodes,
  });
}
