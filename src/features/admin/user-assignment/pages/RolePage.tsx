'use client';

import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Add,
  FilterList,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  DataTable,
  DialogTitleWithClose,
  SearchField,
  type Column,
} from '@/components/common';
import { userService } from '@/features/admin/user-assignment/services';
import {
  buildMenuTreeLookupFromTree,
  normalizeMenuLookupKey,
} from '@/core/config/menu.config';
import Swal, { type SweetAlertOptions } from 'sweetalert2';
import type {
  MenuTreeGroupResponse,
  PermissionResponse,
  RoleResponse,
} from '@/features/admin/user-assignment/types';
import { normalizePermissionResource } from '@/lib/access/permission-code';
import { extractApiErrorMessage } from '@/lib/api-error';
import {
  canAddUserAssignment,
  canEditUserAssignment,
  canSoftDeleteUserAssignment,
} from '@/lib/access/modules/user-assignment.guard';
import PermissionMatrixEditor, {
  type PermissionMatrixFilterOption,
} from '../components/PermissionMatrixEditor';
import {
  buildPermissionActionOrder,
  formatPermissionActionLabel,
} from '../utils/permission-actions';
import { toRoleCode } from '../utils';

const UI = {
  panel: '#ffffff',
  panelSoft: '#f8faf8',
  panelMuted: '#f2f6f3',
  field: '#fbfcfb',
  border: '#dde2de',
  borderStrong: '#cad4cf',
  text: '#2f3a37',
  muted: '#7d8783',
  accent: 'rgb(22, 90, 80)',
  accentSurface: '#edf5f1',
  shadow: '0 18px 40px rgba(22, 35, 31, 0.08), 0 3px 10px rgba(22, 35, 31, 0.05)',
  shadowSoft: '0 10px 24px rgba(22, 35, 31, 0.06), 0 2px 6px rgba(22, 35, 31, 0.04)',
};

const panelSx = {
  borderRadius: 10,
  border: `1px solid ${UI.border}`,
  bgcolor: UI.panel,
  boxShadow: UI.shadow,
};

type RolePageCache = {
  roles: RoleResponse[];
  permissions: PermissionResponse[];
  rolePermissionIds: Record<number, number[]>;
  orderedMenuSlugs: string[];
  menuListLabelBySlug: Record<string, string>;
  menuGroupLabelByMenuListSlug: Record<string, string>;
  menuGroupOrderByMenuListSlug: Record<string, number>;
  menuListOrderBySlug: Record<string, number>;
};

let rolePageCache: RolePageCache | null = null;
let rolePageRequest: Promise<RolePageCache> | null = null;
let rolePermissionZeroRepairAttempted = false;

interface RoleFormState {
  code: string;
  name: string;
  description: string;
  permissionIds: number[];
}

interface RoleTableRow {
  id: number;
  _dbId: number;
  code: string;
  name: string;
  description: string;
  permissionCount: number;
  isActive: boolean;
}

interface RolePermissionOption extends PermissionResponse {
  isReady: boolean;
}

type RolePermissionMatrixRow = {
  permissionId: number | null;
  code: string;
  moduleCode: string;
  action: string;
  actionLabel: string;
  description: string;
  isReady: boolean;
  checked: boolean;
  baselineChecked: boolean;
  disabled: boolean;
};

type RolePermissionModuleGroup = {
  moduleSlug: string;
  moduleLabel: string;
  sectionLabel: string;
  sectionOrder: number;
  moduleOrder: number;
  readyCount: number;
  totalCount: number;
  selectedCount: number;
  addedCount: number;
  removedCount: number;
  rows: RolePermissionMatrixRow[];
};

type RolePermissionSectionGroup = {
  sectionKey: string;
  sectionLabel: string;
  sectionOrder: number;
  modules: RolePermissionModuleGroup[];
};

type RolePermissionViewFilter = 'all' | 'selected' | 'ready' | 'notReady';

const FALLBACK_SECTION_LABEL = 'สิทธิ์ระบบ';

const ROLE_PERMISSION_FILTER_OPTIONS: PermissionMatrixFilterOption[] = [
  { value: 'all', label: 'แสดงทั้งหมด' },
  { value: 'selected', label: 'เลือกแล้ว' },
  { value: 'ready', label: 'พร้อมใช้งาน' },
  { value: 'notReady', label: 'ยังไม่พร้อมใช้' },
];

function humanizePermissionSegment(value: string): string {
  const normalized = normalizeMenuLookupKey(value);
  if (!normalized) {
    return '';
  }

  return normalized
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

function getPermissionResourcePath(permission: Pick<PermissionResponse, 'module' | 'resource' | 'resourcePath' | 'code'>): string {
  const explicitResourcePath = normalizePermissionResource(permission.resourcePath ?? '');
  if (explicitResourcePath) {
    return explicitResourcePath;
  }

  const normalizedModule = (permission.module ?? '').trim();
  const normalizedResource = (permission.resource ?? '').trim();
  if (normalizedModule) {
    return normalizedResource ? `${normalizedModule}.${normalizedResource}` : normalizedModule;
  }

  const fallbackCodeParts = permission.code
    .split('.')
    .map((part) => part.trim())
    .filter(Boolean);
  return fallbackCodeParts.length > 1
    ? fallbackCodeParts.slice(0, -1).join('.')
    : '';
}

function splitPermissionResourcePath(
  resourcePath: string,
): { module: string; resource: string | null } {
  const normalized = normalizePermissionResource(resourcePath);
  if (!normalized) {
    return { module: '', resource: null };
  }

  const parts = normalized.split('.').filter(Boolean);
  if (parts.length <= 1) {
    return { module: normalized, resource: null };
  }

  return {
    module: parts[0],
    resource: parts.slice(1).join('_'),
  };
}

function resolvePermissionModuleSlugForRoleEditor(
  permission: Pick<PermissionResponse, 'module' | 'resource' | 'resourcePath' | 'code'>,
  allowedModules: Set<string>,
): string | null {
  const resourcePath = getPermissionResourcePath(permission);
  const normalizedSlug = normalizeMenuLookupKey(resourcePath);
  if (!normalizedSlug) {
    return null;
  }

  if (allowedModules.has(normalizedSlug)) {
    return normalizedSlug;
  }

  return normalizedSlug;
}

function normalizePermissionForRoleEditor(
  permission: PermissionResponse,
): PermissionResponse | null {
  const normalizedCode = permission.code.trim();
  const resourcePath = getPermissionResourcePath(permission);
  const { module, resource } = splitPermissionResourcePath(resourcePath);
  const fallbackCodeParts = normalizedCode.split('.');
  const fallbackAction =
    fallbackCodeParts.length > 0
      ? fallbackCodeParts[fallbackCodeParts.length - 1]
      : '';
  const rawAction = (permission.action || fallbackAction).trim();

  if (!resourcePath || !module) {
    return null;
  }

  if (!rawAction) {
    return null;
  }

  return {
    ...permission,
    module,
    resource,
    resourcePath,
    action: rawAction,
    code: normalizedCode || `${resourcePath}.${rawAction}`,
  };
}

function isPermissionReady(permission: PermissionResponse): boolean {
  return permission.isActive;
}

const EMPTY_FORM: RoleFormState = {
  code: '',
  name: '',
  description: '',
  permissionIds: [],
};

function cacheRolePageData(value: RolePageCache): RolePageCache {
  rolePageCache = value;
  return value;
}

function buildReadyPermissionIdSet(permissions: PermissionResponse[]): Set<number> {
  return new Set(
    permissions
      .filter((permission) => permission.id > 0 && isPermissionReady(permission))
      .map((permission) => permission.id),
  );
}

function countReadyPermissions(
  permissionIds: number[],
  readyPermissionIdSet: Set<number>,
): number {
  return permissionIds.filter((permissionId) => readyPermissionIdSet.has(permissionId)).length;
}

function hasRoleWithoutReadyPermission(cache: RolePageCache): boolean {
  const readyPermissionIdSet = buildReadyPermissionIdSet(cache.permissions);
  if (readyPermissionIdSet.size === 0) {
    return false;
  }

  return cache.roles.some((role) => {
    const permissionIds = cache.rolePermissionIds[role.id] ?? [];
    return countReadyPermissions(permissionIds, readyPermissionIdSet) === 0;
  });
}

export default function RolePage() {
  const showAlert = useCallback((options: SweetAlertOptions) => {
    const originalDidOpen = options.didOpen;

    return Swal.fire({
      scrollbarPadding: false,
      heightAuto: false,
      target: 'body',
      ...options,
      didOpen: (popup) => {
        const container = Swal.getContainer();
        if (container) {
          container.style.zIndex = '9999';
        }
        originalDidOpen?.(popup);
      },
    });
  }, []);

  const primary = '#1d4ed8';
  const primaryHover = '#1e40af';

  const canCreateRole = canAddUserAssignment();
  const canUpdateRole = canEditUserAssignment();
  const canDeleteRole = canSoftDeleteUserAssignment();

  const [loading, setLoading] = useState(rolePageCache === null);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<RoleResponse[]>(rolePageCache?.roles ?? []);
  const [permissions, setPermissions] = useState<PermissionResponse[]>(rolePageCache?.permissions ?? []);
  const [rolePermissionIds, setRolePermissionIds] = useState<Record<number, number[]>>(
    rolePageCache?.rolePermissionIds ?? {},
  );
  const [orderedMenuSlugs, setOrderedMenuSlugs] = useState<string[]>(
    rolePageCache?.orderedMenuSlugs ?? [],
  );
  const [menuListLabelBySlug, setMenuListLabelBySlug] = useState<Record<string, string>>(
    rolePageCache?.menuListLabelBySlug ?? {},
  );
  const [menuGroupLabelByMenuListSlug, setMenuGroupLabelByMenuListSlug] = useState<Record<string, string>>(
    rolePageCache?.menuGroupLabelByMenuListSlug ?? {},
  );
  const [menuGroupOrderByMenuListSlug, setMenuGroupOrderByMenuListSlug] = useState<Record<string, number>>(
    rolePageCache?.menuGroupOrderByMenuListSlug ?? {},
  );
  const [menuListOrderBySlug, setMenuListOrderBySlug] = useState<Record<string, number>>(
    rolePageCache?.menuListOrderBySlug ?? {},
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [draftStatusFilter, setDraftStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [permissionSearch, setPermissionSearch] = useState('');
  const [permissionViewFilter, setPermissionViewFilter] = useState<RolePermissionViewFilter>('all');
  const [expandedPermissionModules, setExpandedPermissionModules] = useState<string[]>([]);
  const [baselinePermissionIds, setBaselinePermissionIds] = useState<number[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleResponse | null>(null);
  const [form, setForm] = useState<RoleFormState>(EMPTY_FORM);
  const [formValidationError, setFormValidationError] = useState('');

  const loadData = useCallback(async (options?: { force?: boolean }) => {
    const shouldForceRepairFromCache =
      !rolePermissionZeroRepairAttempted &&
      rolePageCache !== null &&
      hasRoleWithoutReadyPermission(rolePageCache);

    if (!options?.force && rolePageCache && !shouldForceRepairFromCache) {
      setRoles(rolePageCache.roles);
      setPermissions(rolePageCache.permissions);
      setRolePermissionIds(rolePageCache.rolePermissionIds);
      setOrderedMenuSlugs(rolePageCache.orderedMenuSlugs);
      setMenuListLabelBySlug(rolePageCache.menuListLabelBySlug);
      setMenuGroupLabelByMenuListSlug(rolePageCache.menuGroupLabelByMenuListSlug);
      setMenuGroupOrderByMenuListSlug(rolePageCache.menuGroupOrderByMenuListSlug);
      setMenuListOrderBySlug(rolePageCache.menuListOrderBySlug);
      setLoading(false);
      return rolePageCache;
    }

    if (!options?.force && rolePageRequest) {
      setLoading(true);
      try {
        const cached = await rolePageRequest;
        setRoles(cached.roles);
        setPermissions(cached.permissions);
        setRolePermissionIds(cached.rolePermissionIds);
        setOrderedMenuSlugs(cached.orderedMenuSlugs);
        setMenuListLabelBySlug(cached.menuListLabelBySlug);
        setMenuGroupLabelByMenuListSlug(cached.menuGroupLabelByMenuListSlug);
        setMenuGroupOrderByMenuListSlug(cached.menuGroupOrderByMenuListSlug);
        setMenuListOrderBySlug(cached.menuListOrderBySlug);
        return cached;
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    try {
      rolePageRequest = Promise.all([
        userService.roles.getAll({ includeInactive: true }),
        userService.permissions.getAll({ includeInactive: true }),
        userService.permissionMenus.getTree().catch(() => [] as MenuTreeGroupResponse[]),
      ]).then(async ([roleRows, permissionRows, menuTree]) => {
        const menuLookup = buildMenuTreeLookupFromTree(menuTree);

        const dedupedPermissions = Array.from(
          permissionRows
            .map((permission) => normalizePermissionForRoleEditor(permission))
            .filter((permission): permission is PermissionResponse => Boolean(permission))
            .reduce((acc, permission) => {
              const existing = acc.get(permission.code);
              if (!existing) {
                acc.set(permission.code, permission);
                return acc;
              }

              if (
                permission.roleCount > existing.roleCount ||
                (permission.roleCount === existing.roleCount &&
                  permission.id > 0 &&
                  existing.id <= 0) ||
                (permission.roleCount === existing.roleCount &&
                  (permission.id > 0) === (existing.id > 0) &&
                  permission.id < existing.id)
              ) {
                acc.set(permission.code, permission);
              }

              return acc;
            }, new Map<string, PermissionResponse>())
            .values(),
        );

        let mappingEntries = await Promise.all(
          roleRows.map(async (role) => {
            try {
              const mappings = await userService.rolePermissions.getByRoleId(role.id, { includeInactive: true });
              return [
                role.id,
                mappings
                  .map((item) => item.permissionId)
                  .filter((permissionId) => Number.isFinite(permissionId) && permissionId > 0),
              ] as const;
            } catch {
              return [role.id, [] as number[]] as const;
            }
          }),
        );

        const readyPermissions = dedupedPermissions
          .filter((permission) => permission.id > 0 && isPermissionReady(permission))
          .sort((left, right) => left.code.localeCompare(right.code));
        const permissionById = new Map(
          dedupedPermissions
            .filter((permission) => permission.id > 0)
            .map((permission) => [permission.id, permission] as const),
        );
        const readyPermissionIdSet = new Set(readyPermissions.map((permission) => permission.id));
        const defaultReadyPermissionId =
          readyPermissions.find((permission) => permission.action === 'view')?.id ??
          readyPermissions[0]?.id ??
          null;
        const mappingByRoleId = Object.fromEntries(mappingEntries);

        if (!rolePermissionZeroRepairAttempted && defaultReadyPermissionId && readyPermissionIdSet.size > 0) {
          rolePermissionZeroRepairAttempted = true;
          let repairedAnyRole = false;

          for (const role of roleRows) {
            const currentPermissionIds = (mappingByRoleId[role.id] ?? []).filter(
              (permissionId) => Number.isFinite(permissionId) && permissionId > 0,
            );
            const readyCount = countReadyPermissions(currentPermissionIds, readyPermissionIdSet);
            if (readyCount > 0) {
              continue;
            }

            const preferredResource = currentPermissionIds
              .map((permissionId) => {
                const permission = permissionById.get(permissionId);
                return permission ? getPermissionResourcePath(permission) : null;
              })
              .find((resource): resource is string => Boolean(resource));
            const roleDefaultReadyPermissionId =
              (preferredResource
                ? readyPermissions.find(
                    (permission) =>
                      getPermissionResourcePath(permission) === preferredResource &&
                      permission.action === 'view',
                  )?.id ??
                  readyPermissions.find(
                    (permission) => getPermissionResourcePath(permission) === preferredResource,
                  )?.id
                : null) ?? defaultReadyPermissionId;
            const nextPermissionIds = Array.from(
              new Set([...currentPermissionIds, roleDefaultReadyPermissionId]),
            );

            try {
              await userService.rolePermissions.setForRole(role.id, {
                permissionIds: nextPermissionIds,
              });
              mappingByRoleId[role.id] = nextPermissionIds;
              repairedAnyRole = true;
            } catch (repairError) {
              console.error('Failed to auto-repair role with zero ready permissions', {
                roleId: role.id,
                roleName: role.name,
                repairError,
              });
            }
          }

          if (repairedAnyRole) {
            mappingEntries = await Promise.all(
              roleRows.map(async (role) => {
                try {
                  const mappings = await userService.rolePermissions.getByRoleId(role.id, { includeInactive: true });
                  return [
                    role.id,
                    mappings
                      .map((item) => item.permissionId)
                      .filter((permissionId) => Number.isFinite(permissionId) && permissionId > 0),
                  ] as const;
                } catch {
                  return [role.id, mappingByRoleId[role.id] ?? []] as const;
                }
              }),
            );
          }
        }

        return cacheRolePageData({
          roles: roleRows,
          permissions: dedupedPermissions.sort((left, right) =>
            left.code.localeCompare(right.code),
          ),
          rolePermissionIds: Object.fromEntries(mappingEntries),
          orderedMenuSlugs: menuLookup.orderedMenuSlugs,
          menuListLabelBySlug: menuLookup.menuListLabelBySlug,
          menuGroupLabelByMenuListSlug: menuLookup.menuGroupLabelByMenuListSlug,
          menuGroupOrderByMenuListSlug: menuLookup.menuGroupOrderByMenuListSlug,
          menuListOrderBySlug: menuLookup.menuListOrderBySlug,
        });
      }).finally(() => {
        rolePageRequest = null;
      });

      const result = await rolePageRequest;
      setRoles(result.roles);
      setPermissions(result.permissions);
      setRolePermissionIds(result.rolePermissionIds);
      setOrderedMenuSlugs(result.orderedMenuSlugs);
      setMenuListLabelBySlug(result.menuListLabelBySlug);
      setMenuGroupLabelByMenuListSlug(result.menuGroupLabelByMenuListSlug);
      setMenuGroupOrderByMenuListSlug(result.menuGroupOrderByMenuListSlug);
      setMenuListOrderBySlug(result.menuListOrderBySlug);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const permissionCodeById = useMemo(
    () =>
      new Map(
        permissions.map((permission) => [permission.id, permission.code] as const),
      ),
    [permissions],
  );

  const permissionReadyById = useMemo(
    () =>
      new Map(
        permissions.map((permission) => [permission.id, isPermissionReady(permission)] as const),
      ),
    [permissions],
  );
  const permissionActionOrder = useMemo(
    () => buildPermissionActionOrder(permissions.map((permission) => permission.action)),
    [permissions],
  );
  const selectedReadyPermissionCount = useMemo(
    () =>
      form.permissionIds.filter((permissionId) => permissionReadyById.get(permissionId) === true).length,
    [form.permissionIds, permissionReadyById],
  );

  const filteredRoles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return roles.filter((role) => {
      const roleCode = role.code.toLowerCase();
      const matchesSearch =
        !query ||
        role.name.toLowerCase().includes(query) ||
        role.description.toLowerCase().includes(query) ||
        roleCode.includes(query);
      const matchesStatus =
        draftStatusFilter === 'all' ||
        (draftStatusFilter === 'active' ? role.isActive : !role.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [draftStatusFilter, roles, searchQuery]);

  const tableRows = useMemo<RoleTableRow[]>(() => {
    return filteredRoles.map((role, index) => {
      const permissionIds = rolePermissionIds[role.id] ?? [];
      const permissionCount = permissionIds
        .filter((permissionId) => permissionReadyById.get(permissionId) === true)
        .map((permissionId) => permissionCodeById.get(permissionId))
        .filter((code): code is string => Boolean(code)).length;

      return {
        id: index + 1,
        _dbId: role.id,
        code: role.code,
        name: role.name,
        description: role.description,
        permissionCount,
        isActive: role.isActive,
      };
    });
  }, [filteredRoles, permissionCodeById, permissionReadyById, rolePermissionIds]);

  const pagedRows = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return tableRows.slice(start, end);
  }, [page, rowsPerPage, tableRows]);

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(tableRows.length / rowsPerPage) - 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [page, rowsPerPage, tableRows.length]);

  const columns = useMemo<Column<RoleTableRow>[]>(
    () => [
      { id: 'id', label: 'ID', minWidth: 52, align: 'center' },
      { id: 'code', label: 'รหัสบทบาท', minWidth: 140 },
      { id: 'name', label: 'ชื่อบทบาท', minWidth: 170 },
      { id: 'description', label: 'คำอธิบาย', minWidth: 220 },
      {
        id: 'permissionCount',
        label: 'สิทธิ์พื้นฐาน',
        minWidth: 120,
        align: 'center',
      },
      {
        id: 'isActive',
        label: 'สถานะ',
        minWidth: 84,
        format: (value) => (value ? 'ใช้งาน' : 'ระงับ'),
      },
    ],
    [],
  );

  const openCreateDialog = () => {
    setEditingRole(null);
    setFormValidationError('');
    setPermissionSearch('');
    setPermissionViewFilter('all');
    setExpandedPermissionModules([]);
    setBaselinePermissionIds([]);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEditDialog = (row: RoleTableRow) => {
    const role = roles.find((item) => item.id === row._dbId);
    if (!role) {
      return;
    }

    setEditingRole(role);
    setFormValidationError('');
    setPermissionSearch('');
    setPermissionViewFilter('all');
    setExpandedPermissionModules([]);
    setBaselinePermissionIds(rolePermissionIds[role.id] ?? []);
    setForm({
      code: role.code,
      name: role.name,
      description: role.description,
      permissionIds: rolePermissionIds[role.id] ?? [],
    });
    setDialogOpen(true);
  };

  const handleDelete = async (row: RoleTableRow) => {
    if (!canDeleteRole || saving) {
      return;
    }

    setSaving(true);
    try {
      const role = roles.find((item) => item.id === row._dbId);
      if (!role) {
        return;
      }

      const confirmation = await showAlert({
        icon: 'warning',
        title: 'ยืนยันลบบทบาท?',
        text: `คุณต้องการลบบทบาท ${role.name} หรือไม่`,
        showCancelButton: true,
        confirmButtonText: 'ลบ',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: '#ef4444',
      });
      if (!confirmation.isConfirmed) {
        return;
      }

      await userService.roles.deactivate(row._dbId);
      await loadData({ force: true });
      void showAlert({
        icon: 'success',
        title: 'ลบข้อมูลสำเร็จ',
        text: 'ระบบได้ลบข้อมูลเรียบร้อยแล้ว',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error: any) {
      void showAlert({
        icon: 'error',
        title: 'ไม่สามารถลบข้อมูลได้',
        text: extractApiErrorMessage(
          error,
          'ไม่สามารถลบข้อมูลได้ เนื่องจากมีการอ้างอิงหรือถูกใช้งานอยู่ในระบบ',
        ),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (row: RoleTableRow) => {
    if (!canUpdateRole || saving) {
      return;
    }

    const role = roles.find((item) => item.id === row._dbId);
    if (!role) {
      return;
    }

    setSaving(true);
    try {
      const confirmation = await showAlert({
        icon: 'warning',
        title: 'ยืนยันเปลี่ยนสถานะบทบาท?',
        text: `คุณต้องการ${role.isActive ? 'ระงับ' : 'เปิดใช้งาน'}บทบาท ${role.name} หรือไม่`,
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        confirmButtonColor: role.isActive ? '#f59e0b' : '#B42318',
      });
      if (!confirmation.isConfirmed) {
        return;
      }

      await userService.roles.setStatus(role.id, !role.isActive);
      await loadData({ force: true });
      void showAlert({
        icon: 'success',
        title: 'เปลี่ยนสถานะสำเร็จ',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error: any) {
      void showAlert({
        icon: 'error',
        title: 'เปลี่ยนสถานะไม่สำเร็จ',
        text: extractApiErrorMessage(error, 'ไม่สามารถเปลี่ยนสถานะได้ โปรดลองอีกครั้ง'),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if ((!editingRole && !canCreateRole) || (editingRole && !canUpdateRole)) {
      return;
    }

    if (!form.name.trim()) {
      return;
    }
    if (!form.code.trim()) {
      setFormValidationError('กรุณากรอกรหัสบทบาท');
      return;
    }

    setFormValidationError('');

    const confirmation = await showAlert({
      icon: 'question',
      title: editingRole ? 'ยืนยันบันทึกการแก้ไข?' : 'ยืนยันเพิ่มบทบาท?',
      text: editingRole
        ? `คุณต้องการบันทึกการแก้ไขบทบาท ${editingRole.name} หรือไม่`
        : `คุณต้องการเพิ่มบทบาท ${form.name.trim()} หรือไม่`,
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#1d4ed8',
    });
    if (!confirmation.isConfirmed) {
      return;
    }

    setSaving(true);
    try {
      const normalizedPermissionIds = Array.from(
        new Set(
          form.permissionIds.filter(
            (permissionId) =>
              Number.isFinite(permissionId) && permissionId > 0,
          ),
        ),
      );
      const readyPermissionCount = normalizedPermissionIds.filter(
        (permissionId) => permissionReadyById.get(permissionId) === true,
      ).length;
      if (readyPermissionCount <= 0) {
        setFormValidationError('ต้องเลือกสิทธิที่พร้อมใช้งานอย่างน้อย 1 รายการ');
        return;
      }
      const normalizedRoleCode = form.code.trim();

      if (editingRole) {
        await userService.roles.update(editingRole.id, {
          code: normalizedRoleCode,
          name: form.name.trim(),
          description: form.description.trim(),
        });
        await userService.rolePermissions.setForRole(editingRole.id, {
          permissionIds: normalizedPermissionIds,
        });
      } else {
        const createdRole = await userService.roles.create({
          code: normalizedRoleCode,
          name: form.name.trim(),
          description: form.description.trim(),
          permissionIds: normalizedPermissionIds,
        });
        await userService.rolePermissions.setForRole(createdRole.id, {
          permissionIds: normalizedPermissionIds,
        });
      }

      setDialogOpen(false);
      setEditingRole(null);
      setFormValidationError('');
      setBaselinePermissionIds([]);
      setForm(EMPTY_FORM);
      await loadData({ force: true });

      void showAlert({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error: any) {
      void showAlert({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: extractApiErrorMessage(error, 'ไม่สามารถบันทึกข้อมูลได้ โปรดลองอีกครั้ง'),
      });
    } finally {
      setSaving(false);
    }
  };

  const selectedPermissionIdSet = useMemo(
    () => new Set(form.permissionIds),
    [form.permissionIds],
  );
  const baselinePermissionIdSet = useMemo(
    () => new Set(baselinePermissionIds),
    [baselinePermissionIds],
  );

  const permissionOptionByCode = useMemo(() => {
    const map = new Map<string, RolePermissionOption>();
    permissions.forEach((permission) => {
      map.set(permission.code.trim(), {
        ...permission,
        isReady: isPermissionReady(permission),
      });
    });
    return map;
  }, [permissions]);

  const togglePermissionModule = useCallback((moduleSlug: string) => {
    setExpandedPermissionModules((previous) => {
      if (previous.includes(moduleSlug)) {
        return previous.filter((item) => item !== moduleSlug);
      }
      return [...previous, moduleSlug];
    });
  }, []);

  const toggleRolePermission = useCallback((row: RolePermissionMatrixRow) => {
    const permissionId = row.permissionId;
    if (!permissionId) {
      return;
    }
    if (!row.isReady && !row.checked) {
      return;
    }

    setForm((previous) => ({
      ...previous,
      permissionIds: row.checked
        ? previous.permissionIds.filter((id) => id !== permissionId)
        : [...previous.permissionIds, permissionId],
    }));
    setFormValidationError('');
  }, []);

  const resetPermissionSelectionFilter = useCallback(() => {
    setPermissionSearch('');
    setPermissionViewFilter('all');
  }, []);

  const rolePermissionStats = useMemo(() => {
    const selectedReadyCodes = new Set(
      form.permissionIds
        .filter((permissionId) => permissionReadyById.get(permissionId) === true)
        .map((permissionId) => permissionCodeById.get(permissionId))
        .filter((code): code is string => Boolean(code)),
    );

    const baselineReadyCodes = new Set(
      baselinePermissionIds
        .filter((permissionId) => permissionReadyById.get(permissionId) === true)
        .map((permissionId) => permissionCodeById.get(permissionId))
        .filter((code): code is string => Boolean(code)),
    );

    let added = 0;
    selectedReadyCodes.forEach((code) => {
      if (!baselineReadyCodes.has(code)) {
        added += 1;
      }
    });

    let removed = 0;
    baselineReadyCodes.forEach((code) => {
      if (!selectedReadyCodes.has(code)) {
        removed += 1;
      }
    });

    return {
      base: baselineReadyCodes.size,
      added,
      removed,
      effective: selectedReadyCodes.size,
    };
  }, [
    baselinePermissionIds,
    form.permissionIds,
    permissionCodeById,
    permissionReadyById,
  ]);

  const permissionSectionGroups = useMemo<RolePermissionSectionGroup[]>(() => {
    const query = permissionSearch.trim().toLowerCase();
    const allowedModules = new Set(orderedMenuSlugs);
    const dynamicSectionOrderByKey = new Map<string, number>();
    const dynamicModuleOrderBySlug = new Map<string, number>();
    const moduleGroupsBySlug = new Map<string, RolePermissionModuleGroup>();
    let nextDynamicSectionOrder = 10_000;
    let nextDynamicModuleOrder = 10_000;

    for (const option of permissionOptionByCode.values()) {
      const resourcePath = getPermissionResourcePath(option);
      const { module, resource } = splitPermissionResourcePath(resourcePath);
      const moduleSlug = resolvePermissionModuleSlugForRoleEditor(
        option,
        allowedModules,
      );

      if (!moduleSlug) {
        continue;
      }

      const matchedMenu = allowedModules.has(moduleSlug);
      const fallbackSectionLabel =
        humanizePermissionSegment(module) || FALLBACK_SECTION_LABEL;
      const fallbackModuleLabel =
        humanizePermissionSegment(resource ?? module) || moduleSlug;
      const sectionLabel =
        menuGroupLabelByMenuListSlug[moduleSlug] ?? fallbackSectionLabel;
      const sectionKey =
        normalizeMenuLookupKey(sectionLabel) ||
        `section-${fallbackSectionLabel || moduleSlug}`;
      const sectionOrder = menuGroupOrderByMenuListSlug[moduleSlug] ?? (() => {
        const existingOrder = dynamicSectionOrderByKey.get(sectionKey);
        if (existingOrder !== undefined) {
          return existingOrder;
        }
        const nextOrder = nextDynamicSectionOrder++;
        dynamicSectionOrderByKey.set(sectionKey, nextOrder);
        return nextOrder;
      })();
      const moduleOrder = menuListOrderBySlug[moduleSlug] ?? (() => {
        const existingOrder = dynamicModuleOrderBySlug.get(moduleSlug);
        if (existingOrder !== undefined) {
          return existingOrder;
        }
        const nextOrder = nextDynamicModuleOrder++;
        dynamicModuleOrderBySlug.set(moduleSlug, nextOrder);
        return nextOrder;
      })();
      const moduleLabel = menuListLabelBySlug[moduleSlug] ?? fallbackModuleLabel;

      const checked = option.id > 0 ? selectedPermissionIdSet.has(option.id) : false;
      const baselineChecked =
        option.id > 0 ? baselinePermissionIdSet.has(option.id) : false;
      const isReady = option.isReady;
      const disabled = !isReady && !checked;
      const row: RolePermissionMatrixRow = {
        permissionId: option.id > 0 ? option.id : null,
        code: option.code,
        moduleCode: moduleSlug,
        action: option.action,
        actionLabel: formatPermissionActionLabel(option.action) || option.action,
        description: option.description?.trim() || '',
        isReady,
        checked,
        baselineChecked,
        disabled,
      };

      const existingGroup = moduleGroupsBySlug.get(moduleSlug);
      if (!existingGroup) {
        moduleGroupsBySlug.set(moduleSlug, {
          moduleSlug,
          moduleLabel,
          sectionLabel,
          sectionOrder,
          moduleOrder,
          readyCount: isReady ? 1 : 0,
          totalCount: 1,
          selectedCount: checked ? 1 : 0,
          addedCount: !baselineChecked && checked && isReady ? 1 : 0,
          removedCount: baselineChecked && !checked && isReady ? 1 : 0,
          rows: [row],
        });
        continue;
      }

      existingGroup.readyCount += isReady ? 1 : 0;
      existingGroup.totalCount += 1;
      existingGroup.selectedCount += checked ? 1 : 0;
      existingGroup.addedCount += !baselineChecked && checked && isReady ? 1 : 0;
      existingGroup.removedCount += baselineChecked && !checked && isReady ? 1 : 0;
      existingGroup.rows.push(row);
      if (!matchedMenu && existingGroup.moduleLabel === moduleSlug) {
        existingGroup.moduleLabel = moduleLabel;
      }
    }

    const moduleGroups = Array.from(moduleGroupsBySlug.values())
      .map((group) => {
        const allRows = group.rows
          .slice()
          .sort((left, right) => {
            const leftIndex = permissionActionOrder.get(left.action) ?? Number.MAX_SAFE_INTEGER;
            const rightIndex = permissionActionOrder.get(right.action) ?? Number.MAX_SAFE_INTEGER;
            return (
              leftIndex - rightIndex ||
              left.code.localeCompare(right.code)
            );
          });

        const visibleRows = allRows.filter((row) => {
          const matchesQuery =
            query.length === 0 ||
            row.code.includes(query) ||
            row.actionLabel.toLowerCase().includes(query) ||
            group.moduleLabel.toLowerCase().includes(query) ||
            row.description.toLowerCase().includes(query);

          if (!matchesQuery) {
            return false;
          }

          if (permissionViewFilter === 'selected') {
            return row.checked;
          }
          if (permissionViewFilter === 'ready') {
            return row.isReady;
          }
          if (permissionViewFilter === 'notReady') {
            return !row.isReady;
          }
          return true;
        });

        if (visibleRows.length === 0) {
          return null;
        }

        return {
          ...group,
          rows: visibleRows,
        };
      })
      .filter((group): group is RolePermissionModuleGroup => Boolean(group));

    const sectionMap = new Map<string, RolePermissionSectionGroup>();

    moduleGroups.forEach((moduleGroup) => {
      const sectionKey =
        normalizeMenuLookupKey(moduleGroup.sectionLabel) ||
        `section-${moduleGroup.sectionOrder}`;

      const existingSection = sectionMap.get(sectionKey);
      if (!existingSection) {
        sectionMap.set(sectionKey, {
          sectionKey,
          sectionLabel: moduleGroup.sectionLabel,
          sectionOrder: moduleGroup.sectionOrder,
          modules: [moduleGroup],
        });
        return;
      }

      existingSection.modules.push(moduleGroup);
    });

    return Array.from(sectionMap.values())
      .map((section) => ({
        ...section,
        modules: section.modules.sort(
          (left, right) =>
            left.moduleOrder - right.moduleOrder ||
            left.moduleLabel.localeCompare(right.moduleLabel),
        ),
      }))
      .sort(
        (left, right) =>
          left.sectionOrder - right.sectionOrder ||
          left.sectionLabel.localeCompare(right.sectionLabel),
      );
  }, [
    baselinePermissionIdSet,
    menuGroupLabelByMenuListSlug,
    menuGroupOrderByMenuListSlug,
    menuListLabelBySlug,
    menuListOrderBySlug,
    permissionActionOrder,
    orderedMenuSlugs,
    permissionOptionByCode,
    permissionSearch,
    permissionViewFilter,
    selectedPermissionIdSet,
  ]);

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }
    if (expandedPermissionModules.length > 0) {
      return;
    }

    const allowedModules = new Set(orderedMenuSlugs);
    const selectedModules = permissions
      .filter((permission) => selectedPermissionIdSet.has(permission.id))
      .map((permission) =>
        resolvePermissionModuleSlugForRoleEditor(permission, allowedModules),
      )
      .filter((moduleSlug): moduleSlug is string => Boolean(moduleSlug));
    const uniqueSelectedModules = Array.from(new Set(selectedModules));
    const fallbackModules = permissionSectionGroups
      .flatMap((section) => section.modules.map((module) => module.moduleSlug))
      .slice(0, 3);

    setExpandedPermissionModules(
      uniqueSelectedModules.length > 0 ? uniqueSelectedModules : fallbackModules,
    );
  }, [
    dialogOpen,
    expandedPermissionModules.length,
    orderedMenuSlugs,
    permissionSectionGroups,
    permissions,
    selectedPermissionIdSet,
  ]);

  const activeFilterCount = draftStatusFilter !== 'all' ? 1 : 0;
  const visibleModuleSlugs = useMemo(
    () => permissionSectionGroups.flatMap((section) => section.modules.map((module) => module.moduleSlug)),
    [permissionSectionGroups],
  );
  const allModulesExpanded =
    visibleModuleSlugs.length > 0 &&
    visibleModuleSlugs.every((moduleSlug) => expandedPermissionModules.includes(moduleSlug));

  return (
    <>
      <Paper sx={{ ...panelSx, p: { xs: 1.5, md: 2 }, flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                flexWrap: 'wrap',
                mb: isFilterExpanded ? 1 : 1.25,
              }}
            >
              <SearchField
                placeholder="ค้นหาบทบาท"
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setPage(0);
                }}
                disabled={saving}
                sx={{
                  flex: 1,
                  minWidth: { xs: '100%', md: 260 },
                  maxWidth: { md: 360 },
                  '& .MuiOutlinedInput-root': { bgcolor: UI.field },
                }}
              />

              <Button
                variant="outlined"
                startIcon={<FilterList fontSize="small" />}
                onClick={() => setIsFilterExpanded((prev) => !prev)}
                sx={{
                  minHeight: 40,
                  textTransform: 'none',
                  borderColor:
                    activeFilterCount > 0 || isFilterExpanded
                      ? alpha(UI.accent, 0.5)
                      : UI.border,
                  color:
                    activeFilterCount > 0 || isFilterExpanded
                      ? UI.accent
                      : UI.muted,
                  bgcolor: UI.accentSurface,
                  '&:hover': {
                    borderColor:
                      activeFilterCount > 0 || isFilterExpanded ? UI.accent : UI.text,
                    bgcolor: UI.panelMuted,
                  },
                }}
              >
                ตัวกรอง{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
              </Button>

              <Button
                size="medium"
                variant="contained"
                disableElevation
                startIcon={<Add />}
                disabled={!canCreateRole || saving}
                onClick={openCreateDialog}
                sx={{
                  minWidth: 132,
                  minHeight: 40,
                  ml: { md: 'auto' },
                  bgcolor: '#1d4ed8',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  '&:hover': { bgcolor: '#1e40af' },
                }}
              >
                เพิ่มบทบาท
              </Button>
            </Box>

            <Collapse in={isFilterExpanded} timeout="auto">
              <Paper
                variant="outlined"
                sx={{
                  borderRadius: 10,
                  borderColor: UI.border,
                  bgcolor: UI.panel,
                  p: { xs: 1.25, md: 1.5 },
                  mb: 1.25,
                }}
              >
                <Typography
                  sx={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: UI.text,
                    lineHeight: '16px',
                    mb: 0.75,
                  }}
                >
                  เงื่อนไขการค้นหา
                </Typography>

                <FormControl
                  size="small"
                  sx={{
                    width: '100%',
                    maxWidth: { xs: '100%', md: 280 },
                    '& .MuiOutlinedInput-root': { minHeight: 36 },
                  }}
                >
                  <InputLabel>สถานะ</InputLabel>
                  <Select
                    value={statusFilter}
                    label="สถานะ"
                    onChange={(event) =>
                      setStatusFilter(event.target.value as 'all' | 'active' | 'inactive')
                    }
                    sx={{ bgcolor: UI.field }}
                  >
                    <MenuItem value="all">ทั้งหมด</MenuItem>
                    <MenuItem value="active">ใช้งาน</MenuItem>
                    <MenuItem value="inactive">ระงับ</MenuItem>
                  </Select>
                </FormControl>

                <Divider sx={{ borderColor: UI.border, my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button
                    variant="text"
                    onClick={() => {
                      setStatusFilter('all');
                      setDraftStatusFilter('all');
                      setPage(0);
                    }}
                    sx={{ textTransform: 'none', color: UI.muted }}
                  >
                    ล้างค่า
                  </Button>
                  <Button
                    variant="contained"
                    onClick={() => {
                      setDraftStatusFilter(statusFilter);
                      setPage(0);
                    }}
                    sx={{
                      textTransform: 'none',
                      boxShadow: 'none',
                      bgcolor: primary,
                      '&:hover': { bgcolor: primaryHover, boxShadow: 'none' },
                    }}
                  >
                    นำไปใช้
                  </Button>
                </Box>
              </Paper>
            </Collapse>

            <DataTable<RoleTableRow>
              columns={columns}
              data={pagedRows}
              totalCount={tableRows.length}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={setPage}
              onRowsPerPageChange={(value) => {
                setRowsPerPage(value);
                setPage(0);
              }}
              loading={loading}
              rowsPerPageOptions={[25, 50, 100]}
              footerSummaryText={`ทั้งหมด ${tableRows.length} รายการ`}
              stickyHeader
              sortable={false}
              emptyMessage="ไม่พบบทบาท"
              lockEntityColumns
              includeCodeColumn
              includeStatusColumn
              onEditRow={canUpdateRole ? openEditDialog : undefined}
              onDeleteRow={canDeleteRole ? handleDelete : undefined}
              onToggleRowStatus={canUpdateRole ? handleToggleStatus : undefined}
              isRowActive={(row) => row.isActive}
              paperSx={{
                flex: 1,
                minHeight: 0,
                borderRadius: 10,
                borderColor: UI.border,
                bgcolor: UI.panel,
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'none',
              }}
              tableContainerSx={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollbarGutter: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: `${alpha(UI.muted, 0.6)} ${alpha(UI.border, 0.08)}`,
                '&::-webkit-scrollbar': { width: 8, height: 8 },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: alpha(UI.border, 0.08),
                  borderLeft: `1px solid ${alpha(UI.border, 0.45)}`,
                  borderRadius: 10,
                  marginBlock: 6,
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: alpha(UI.muted, 0.58),
                  borderRadius: 10,
                  border: `1px solid ${alpha(UI.panel, 0.65)}`,
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  backgroundColor: alpha(UI.muted, 0.75),
                },
              }}
              tableSx={{
                tableLayout: 'fixed',
                width: '100%',
                borderCollapse: 'separate',
                borderSpacing: 0,
                '& .MuiTableCell-root': { px: 1.25 },
                '& .MuiTableHead-root .MuiTableCell-root': {
                  fontWeight: 800,
                  letterSpacing: 0.2,
                  color: UI.text,
                },
                '& .MuiTableBody-root .MuiTableRow-root': {
                  '&:hover': {
                    backgroundColor: alpha(UI.accent, 0.04),
                  },
                },
              }}
            />
          </Box>
        </Paper>

      <Dialog
        open={dialogOpen}
        onClose={() => {
          if (saving) return;
          setDialogOpen(false);
          setEditingRole(null);
          setFormValidationError('');
          setPermissionSearch('');
          setPermissionViewFilter('all');
          setExpandedPermissionModules([]);
          setBaselinePermissionIds([]);
          setForm(EMPTY_FORM);
        }}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: 10,
            border: `1px solid ${UI.border}`,
          },
        }}
      >
        <DialogTitleWithClose
          onClose={() => {
            if (saving) return;
            setDialogOpen(false);
            setEditingRole(null);
            setFormValidationError('');
            setPermissionSearch('');
            setPermissionViewFilter('all');
            setExpandedPermissionModules([]);
            setBaselinePermissionIds([]);
            setForm(EMPTY_FORM);
          }}
        >
          {editingRole ? 'แก้ไขบทบาท' : 'เพิ่มบทบาท'}
        </DialogTitleWithClose>

        <Box component="form" onSubmit={handleSave}>
          <DialogContent sx={{ display: 'grid', gap: 1.5, pt: 2 }}>
            <TextField
              label="ชื่อบทบาท"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => {
                  const nextName = event.target.value;
                  const shouldSyncCodeFromName =
                    !editingRole &&
                    (
                      prev.code.trim().length === 0 ||
                      prev.code === toRoleCode(prev.name)
                    );

                  return {
                    ...prev,
                    name: nextName,
                    code: shouldSyncCodeFromName ? toRoleCode(nextName) : prev.code,
                  };
                })
              }
              required
            />

            <TextField
              label="โค้ดบทบาท"
              value={form.code}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  code: event.target.value,
                }))
              }
              required
              helperText="แก้ไขได้ และใช้เป็น code จริงของบทบาท"
            />

            <TextField
              label="คำอธิบาย"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  description: event.target.value,
                }))
              }
              multiline
              minRows={2}
            />

            <Divider />
            <Typography
              sx={{
                mt: -0.5,
                fontSize: '0.8rem',
                color:
                  selectedReadyPermissionCount > 0
                    ? '#B42318'
                    : alpha('#dc2626', 0.9),
                fontWeight: 600,
              }}
            >
              สิทธิที่พร้อมใช้งานที่เลือก: {selectedReadyPermissionCount} รายการ
            </Typography>
            {formValidationError && (
              <Typography
                sx={{
                  mt: -0.5,
                  fontSize: '0.82rem',
                  color: '#dc2626',
                  fontWeight: 600,
                }}
              >
                {formValidationError}
              </Typography>
            )}
            <PermissionMatrixEditor
              topActionLabel="กำหนดสิทธิ์พื้นฐานของบทบาท"
              title="สิทธิ์ของบทบาทนี้ (ฐานจาก Role)"
              subtitle="เลือกสิทธิพื้นฐานจากคลังสิทธิ ระบบจะแสดงเฉพาะสิทธิที่ canonical และบอกสถานะพร้อมใช้งาน"
              stats={rolePermissionStats}
              searchValue={permissionSearch}
              onSearchChange={setPermissionSearch}
              filterValue={permissionViewFilter}
              onFilterChange={(value) => setPermissionViewFilter(value as RolePermissionViewFilter)}
              filterOptions={ROLE_PERMISSION_FILTER_OPTIONS}
              onResetFilters={resetPermissionSelectionFilter}
              resetDisabled={permissionSearch.trim().length === 0 && permissionViewFilter === 'all'}
              allModulesExpanded={allModulesExpanded}
              onToggleAllModules={() => {
                if (allModulesExpanded) {
                  setExpandedPermissionModules([]);
                  return;
                }
                setExpandedPermissionModules(visibleModuleSlugs);
              }}
              sections={permissionSectionGroups}
              expandedModuleSlugs={expandedPermissionModules}
              onToggleModule={togglePermissionModule}
              onToggleRow={(row) => toggleRolePermission(row as RolePermissionMatrixRow)}
              emptyText="ไม่พบสิทธิ์ที่ค้นหา"
              maxHeight={420}
            />
          </DialogContent>

          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => {
                if (saving) return;
                setDialogOpen(false);
                setEditingRole(null);
                setFormValidationError('');
                setPermissionSearch('');
                setPermissionViewFilter('all');
                setExpandedPermissionModules([]);
                setBaselinePermissionIds([]);
                setForm(EMPTY_FORM);
              }}
              disabled={saving}
            >
              ยกเลิก
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving || !form.name.trim()}
            >
              {editingRole ? 'บันทึก' : 'เพิ่มบทบาท'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
