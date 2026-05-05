import { PermissionAction } from '@/features/auth/types/enums';
import { authService } from '@/features/auth/services/auth.service';
import { canAccessData } from '@/lib/access/guard/data.guard';
import { canRenderUi } from '@/lib/access/guard/ui.guard';
import { canRunAction } from '@/lib/access/guard/action.guard';
import {
  buildModuleResource,
  buildPermissionCode,
  findPermissionGroup,
  getPermissionCatalogSnapshot,
  loadPermissionCatalog,
} from '@/lib/access/permission-catalog';

export type ModuleRouteConfig<ResourceKey extends string> = {
  key: string;
  resource: ResourceKey;
  routePrefixes: readonly string[];
};

export function normalizeGuardPath(path: string): string {
  const trimmed = path.trim().toLowerCase();
  if (!trimmed) {
    return '/';
  }
  if (trimmed === '/') {
    return '/';
  }
  return trimmed.replace(/\/+$/, '') || '/';
}

export function matchesGuardPath(
  currentPath: string,
  routePrefix: string,
): boolean {
  const normalizedCurrentPath = normalizeGuardPath(currentPath);
  const normalizedRoutePrefix = normalizeGuardPath(routePrefix);
  return (
    normalizedCurrentPath === normalizedRoutePrefix ||
    normalizedCurrentPath.startsWith(`${normalizedRoutePrefix}/`)
  );
}

export function findRouteConfigByPath<RouteConfig extends { routePrefixes: readonly string[] }>(
  routeConfigs: readonly RouteConfig[],
  routePath: string,
): RouteConfig | null {
  return (
    routeConfigs.find((config) =>
      config.routePrefixes.some((prefix) => matchesGuardPath(routePath, prefix)),
    ) ?? null
  );
}

export function createModuleGuard<ResourceKey extends string>(module: string) {
  const normalizedModule = module.trim().toLowerCase();

  function moduleResource(resource: ResourceKey | null | undefined): string {
    return buildModuleResource(normalizedModule, resource);
  }

  function permissionGroup(
    resource: ResourceKey,
    catalog = getPermissionCatalogSnapshot(),
  ) {
    return findPermissionGroup(catalog, normalizedModule, resource);
  }

  function resolvePermissionCode(
    resource: ResourceKey,
    action: PermissionAction,
  ): string {
    return (
      permissionGroup(resource)?.codesByAction[action] ??
      buildPermissionCode(moduleResource(resource), action)
    );
  }

  function resolvePermissionCodes(resource: ResourceKey): string[] {
    return permissionGroup(resource)?.codes ?? [];
  }

  function canAccessResource(
    resource: ResourceKey,
    facilityId?: number | null,
  ): boolean {
    const permissionCodes = resolvePermissionCodes(resource);
    if (permissionCodes.length > 0) {
      return canAccessData({
        requiredPermissions: permissionCodes,
        mode: 'any',
        facilityId,
        requireScope: Boolean(facilityId),
      });
    }

    return authService.hasPermissionPrefix(moduleResource(resource), {
      facilityId,
    });
  }

  function canRenderResource(
    resource: ResourceKey,
    facilityId?: number | null,
  ): boolean {
    const permissionCodes = resolvePermissionCodes(resource);
    if (permissionCodes.length > 0) {
      return canRenderUi({
        requiredPermissions: permissionCodes,
        mode: 'any',
        facilityId,
      });
    }

    return authService.hasPermissionPrefix(moduleResource(resource), {
      facilityId,
    });
  }

  function canRunResourceAction(
    resource: ResourceKey,
    action: PermissionAction,
    facilityId?: number | null,
  ): boolean {
    return canRunAction({
      requiredPermissions: [resolvePermissionCode(resource, action)],
      mode: 'any',
      facilityId,
    });
  }

  async function warmCatalog(): Promise<void> {
    await loadPermissionCatalog();
  }

  return {
    module: normalizedModule,
    moduleResource,
    permissionGroup,
    resolvePermissionCode,
    resolvePermissionCodes,
    canAccessResource,
    canRenderResource,
    canRunResourceAction,
    warmCatalog,
  };
}
