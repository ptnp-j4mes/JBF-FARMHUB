import type { MenuIconKey } from '@/lib/utils/menu-icons';

export type AppRole =
  | 'Admin'
  | 'Executive'
  | 'FarmManager'
  | 'Supervisor'
  | 'Staff'
  | 'Viewer';

export interface MenuItemConfig {
  path: string;
  labelKey: string;
  icon: MenuIconKey;
  permissionModule?: string;
  requiredPermissionCodes?: string[];
  activePathPrefix?: string;
}

export interface MenuGroupConfig {
  id: string;
  titleKey: string;
  roles: AppRole[];
  items: MenuItemConfig[];
}

export interface MenuTreeLookup {
  orderedMenuSlugs: string[];
  menuListLabelBySlug: Record<string, string>;
  menuGroupLabelByMenuListSlug: Record<string, string>;
  menuGroupOrderByMenuListSlug: Record<string, number>;
  menuListOrderBySlug: Record<string, number>;
  permissionMenuSlugByCode: Record<string, string>;
  permissionCodesByMenuSlug: Record<string, string[]>;
}

export interface MenuTreeLookupNode {
  code: string;
  labelTh: string;
  nodeType: string;
  sortOrder: number;
  isActive: boolean;
  requiredPermissionCodes?: string[];
  children?: MenuTreeLookupNode[];
}

export interface NavigationNodeDto {
  id: number;
  parentId?: number | null;
  code: string;
  nodeType: string; // Folder, Link, etc.
  placement: string;
  labelTh: string;
  labelEn?: string | null;
  path?: string | null;
  externalUrl?: string | null;
  iconKey?: string | null;
  activePathPrefix?: string | null;
  sortOrder: number;
  requireScope: boolean;
  missingScopeBehavior: string;
  permissionMode: string;
  isActive: boolean;
  requiredPermissionCodes?: string[];
  children?: NavigationNodeDto[];
}

export function normalizeMenuLookupKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.\-\s]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function createEmptyMenuTreeLookup(): MenuTreeLookup {
  return {
    orderedMenuSlugs: [],
    menuListLabelBySlug: {},
    menuGroupLabelByMenuListSlug: {},
    menuGroupOrderByMenuListSlug: {},
    menuListOrderBySlug: {},
    permissionMenuSlugByCode: {},
    permissionCodesByMenuSlug: {},
  };
}

export function buildMenuTreeLookupFromTree(nodes: MenuTreeLookupNode[]): MenuTreeLookup {
  const lookup = createEmptyMenuTreeLookup();
  const orderedMenuSlugs = new Set<string>();

  const registerNode = (
    node: MenuTreeLookupNode,
    groupLabel: string,
    groupOrder: number,
  ) => {
    if (!node.isActive) {
      return;
    }

    const normalizedSlug = normalizeMenuLookupKey(node.code);
    if (node.nodeType === 'Link' && normalizedSlug) {
      orderedMenuSlugs.add(normalizedSlug);
      lookup.menuListLabelBySlug[normalizedSlug] = node.labelTh;
      lookup.menuGroupLabelByMenuListSlug[normalizedSlug] = groupLabel;
      lookup.menuGroupOrderByMenuListSlug[normalizedSlug] = groupOrder;
      lookup.menuListOrderBySlug[normalizedSlug] = node.sortOrder;

      const permissionCodes = Array.from(
        new Set(
          (node.requiredPermissionCodes ?? [])
            .map((code) => code.trim())
            .filter(Boolean),
        ),
      );
      lookup.permissionCodesByMenuSlug[normalizedSlug] = permissionCodes;
      permissionCodes.forEach((code) => {
        lookup.permissionMenuSlugByCode[code.toLowerCase()] = normalizedSlug;
      });
    }

    (node.children ?? [])
      .slice()
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .forEach((child) => {
        registerNode(
          child,
          groupLabel || (node.nodeType === 'Folder' ? node.labelTh : ''),
          groupOrder || (node.nodeType === 'Folder' ? node.sortOrder : 0),
        );
      });
  };

  nodes
    .slice()
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .forEach((node) => {
      registerNode(node, node.nodeType === 'Folder' ? node.labelTh : '', node.sortOrder);
    });

  lookup.orderedMenuSlugs = Array.from(orderedMenuSlugs);
  return lookup;
}

export function resolveMenuLabel(
  labelKey: string,
  t: (key: string) => string,
): string {
  if (labelKey.startsWith('layout.')) {
    return t(labelKey);
  }
  return labelKey;
}

function normalizeMenuPath(path: string): string {
  const trimmed = path.trim().toLowerCase();
  if (!trimmed) return '/';
  if (trimmed === '/') return '/';
  return trimmed.replace(/\/+$/, '') || '/';
}

function sanitizeMenuRoutePath(path?: string | null): string {
  if (!path) {
    return '#';
  }

  const trimmed = path.trim();
  if (!trimmed) {
    return '#';
  }

  const absoluteMatch = trimmed.match(/^https?:\/{1,2}[^/]+(\/.*)?$/i);
  if (absoluteMatch) {
    return absoluteMatch[1] || '/';
  }

  const protocolRelativeMatch = trimmed.match(/^\/\/[^/]+(\/.*)?$/);
  if (protocolRelativeMatch) {
    return protocolRelativeMatch[1] || '/';
  }

  return trimmed.startsWith('/') ? trimmed : `/${trimmed.replace(/^\/+/, '')}`;
}

export function isMenuItemActivePath(
  currentPath: string,
  itemPath: string,
  activePathPrefix?: string,
): boolean {
  const normalizedCurrentPath = normalizeMenuPath(currentPath);
  const normalizedItemPath = normalizeMenuPath(itemPath);

  if (normalizedItemPath === '/') {
    return normalizedCurrentPath === '/';
  }

  if (
    normalizedCurrentPath === normalizedItemPath ||
    normalizedCurrentPath.startsWith(`${normalizedItemPath}/`)
  ) {
    return true;
  }

  if (activePathPrefix) {
    const normalizedPrefix = normalizeMenuPath(activePathPrefix);
    if (
      normalizedCurrentPath === normalizedPrefix ||
      normalizedCurrentPath.startsWith(`${normalizedPrefix}/`)
    ) {
      return true;
    }
  }

  return false;
}

export function buildMenuGroupsFromTree(
  nodes: NavigationNodeDto[],
): MenuGroupConfig[] {
  const rootNodes = nodes
    .filter((node) => !node.parentId || node.parentId === null)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const groups: MenuGroupConfig[] = [];

  rootNodes.forEach((rootNode) => {
    if (rootNode.nodeType === 'Folder') {
      groups.push({
        id: rootNode.code,
        titleKey: rootNode.labelTh,
        roles: [] as AppRole[],
        items: (rootNode.children ?? [])
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((item) => ({
            path: sanitizeMenuRoutePath(item.path),
            labelKey: item.labelTh,
            icon: (item.iconKey as MenuIconKey) ?? 'dashboard',
            permissionModule: item.code,
            requiredPermissionCodes: item.requiredPermissionCodes,
            activePathPrefix: item.activePathPrefix
              ? sanitizeMenuRoutePath(item.activePathPrefix)
              : undefined,
          })),
      });
    } else if (rootNode.path) {
      groups.push({
        id: rootNode.code,
        titleKey: rootNode.labelTh,
        roles: [] as AppRole[],
        items: [
          {
            path: sanitizeMenuRoutePath(rootNode.path),
            labelKey: rootNode.labelTh,
            icon: (rootNode.iconKey as MenuIconKey) ?? 'dashboard',
            permissionModule: rootNode.code,
            requiredPermissionCodes: rootNode.requiredPermissionCodes,
            activePathPrefix: rootNode.activePathPrefix
              ? sanitizeMenuRoutePath(rootNode.activePathPrefix)
              : undefined,
          },
        ],
      });
    }
  });

  return groups.filter((group) => group.items.length > 0);
}

/**
 * Legacy hard-coded menu groups.
 * @deprecated All menu data is now managed in the database via NavigationMenu tables.
 * This is kept as an empty fallback to avoid breaking imports in other files.
 */
export const MENU_GROUPS: MenuGroupConfig[] = [];
