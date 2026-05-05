'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ContentCard, DataTable, SearchField, type Column } from '@/components/common';
import { useUserAssignmentData } from '@/features/admin/user-assignment/components';
import { userService, userViewAdapter } from '@/features/admin/user-assignment/services';
import {
  buildMenuTreeLookupFromTree,
  normalizeMenuLookupKey,
  type MenuTreeLookup,
} from '@/core/config/menu.config';
import {
  normalizePermissionCode as normalizeCanonicalPermissionCode,
  normalizePermissionResource,
  splitPermissionCode,
} from '@/lib/access/permission-code';
import { formatPermissionActionLabel } from '../utils/permission-actions';
import {
  canAddUserAssignment,
  canEditUserAssignment,
  canSoftDeleteUserAssignment,
} from '@/lib/access/modules/user-assignment.guard';
import {
  Add,
  FilterList,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import Swal, { type SweetAlertOptions } from 'sweetalert2';
import {
  AddUserDialog,
  AssignmentFilterDialog,
  UserAssignmentSectionLayout,
} from '../components';
import { useUserAssignmentTabs } from '../hooks';
import UserPage from './UserPage';
import RolePage from './RolePage';
import PermissionPage from './PermissionPage';
import OrganizationPage from './OrganizationPage';
import {
  type AssignmentDialogPayload,
  type FacilityNodeResponse,
  type FarmCatalogItem,
  type FilterState,
  type HouseCatalogItem,
  type RoleCatalogItem,
  type ScopePermissionOverrideInput,
  type ScopePermissionOverrideItem,
  type UserAssignment,
  type UserAssignmentAggregateResponse,
  type ZoneCatalogItem,
} from '../types';
import {
  EMPTY_FILTERS,
  createEmptyRoleScope,
  uniqueSorted,
} from '../utils';

function normalizePermissionCode(code: string): string {
  return normalizeCanonicalPermissionCode(code) ?? '';
}

function formatPermissionDisplayLabel(
  code: string,
  permissionMenuSlugByCode: Record<string, string>,
  menuListLabelBySlug: Record<string, string>,
): string {
  const normalizedCode = normalizePermissionCode(code);
  if (!normalizedCode) {
    return '';
  }

  const moduleSlug = permissionMenuSlugByCode[normalizedCode.toLowerCase()];
  if (!moduleSlug) {
    return normalizedCode;
  }

  const moduleLabel = menuListLabelBySlug[moduleSlug] ?? moduleSlug;
  const parsedPermission = splitPermissionCode(normalizedCode);
  const actionLabel =
    parsedPermission?.action ? formatPermissionActionLabel(parsedPermission.action) || parsedPermission.action : '';

  return actionLabel ? `${moduleLabel} / ${actionLabel}` : moduleLabel;
}

function normalizeScopeValue(value: string): string {
  return value.trim().toLowerCase();
}

function isBlankScopeValue(value: string | undefined): boolean {
  if (!value) {
    return true;
  }
  const normalized = value.trim();
  return normalized.length === 0 || normalized === '-';
}

function buildRoleScopeKey(scope: Pick<ScopePermissionOverrideItem, 'role' | 'farm' | 'zone' | 'house'>): string {
  return [
    normalizeScopeValue(scope.role),
    normalizeScopeValue(scope.farm),
    normalizeScopeValue(scope.zone || '-'),
    normalizeScopeValue(scope.house || '-'),
  ].join('::');
}

function matchScopeName(value: string, target: string): boolean {
  return normalizeScopeValue(value) === normalizeScopeValue(target);
}

function resolveFacilityNodeIdFromScope(
  scope: Pick<ScopePermissionOverrideItem, 'farm' | 'zone' | 'house' | 'facilityNodeId'>,
  facilities: FacilityNodeResponse[],
): number | null {
  if (typeof scope.facilityNodeId === 'number' && scope.facilityNodeId > 0) {
    return scope.facilityNodeId;
  }

  const facilityMap = new Map(facilities.map((facility) => [facility.id, facility]));
  const rankCandidate = (candidate: FacilityNodeResponse): number => {
    const parent = candidate.parentId ? facilityMap.get(candidate.parentId) : undefined;
    const grandParent = parent?.parentId ? facilityMap.get(parent.parentId) : undefined;
    let score = candidate.isActive ? 100 : 0;
    if (parent) {
      score += parent.isActive ? 10 : -10;
    }
    if (grandParent) {
      score += grandParent.isActive ? 1 : -1;
    }
    return score;
  };
  const pickBestCandidate = (
    candidates: FacilityNodeResponse[],
  ): FacilityNodeResponse | undefined =>
    [...candidates].sort((left, right) => {
      const scoreDelta = rankCandidate(right) - rankCandidate(left);
      if (scoreDelta !== 0) {
        return scoreDelta;
      }
      return left.id - right.id;
    })[0];
  const farmName = scope.farm?.trim() ?? '';
  const zoneName = scope.zone?.trim() ?? '';
  const houseName = scope.house?.trim() ?? '';

  if (!isBlankScopeValue(houseName)) {
    const candidates = facilities.filter(
      (facility) => facility.type === 'house' && matchScopeName(facility.name, houseName),
    );
    const matchedCandidates = candidates.filter((candidate) => {
      const parent = candidate.parentId ? facilityMap.get(candidate.parentId) : undefined;
      const zone = parent?.type === 'zone' ? parent : undefined;
      const farm =
        zone?.parentId
          ? facilityMap.get(zone.parentId)
          : parent?.type === 'farm'
            ? parent
            : undefined;
      const zoneMatched = isBlankScopeValue(zoneName)
        ? true
        : Boolean(zone && matchScopeName(zone.name, zoneName));
      const farmMatched = isBlankScopeValue(farmName)
        ? true
        : Boolean(farm && matchScopeName(farm.name, farmName));
      return zoneMatched && farmMatched;
    });
    const matched = pickBestCandidate(matchedCandidates);
    return matched?.isActive ? matched.id : null;
  }

  if (!isBlankScopeValue(zoneName)) {
    const candidates = facilities.filter(
      (facility) => facility.type === 'zone' && matchScopeName(facility.name, zoneName),
    );
    const matchedCandidates = candidates.filter((candidate) => {
      const farm = candidate.parentId ? facilityMap.get(candidate.parentId) : undefined;
      return isBlankScopeValue(farmName)
        ? true
        : Boolean(farm && matchScopeName(farm.name, farmName));
    });
    const matched = pickBestCandidate(matchedCandidates);
    return matched?.isActive ? matched.id : null;
  }

  if (!isBlankScopeValue(farmName)) {
    const matched = pickBestCandidate(
      facilities.filter(
      (facility) => facility.type === 'farm' && matchScopeName(facility.name, farmName),
      ),
    );
    return matched?.isActive ? matched.id : null;
  }

  return null;
}

function normalizePermissionCodes(codes: string[]): string[] {
  return Array.from(
    new Set(
      codes
        .map((item) => normalizePermissionCode(item))
        .filter((item) => item.length > 0),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

function buildPermissionMenuSlugByCode(
  permissions: { code?: string | null; resource?: string | null; resourcePath?: string | null }[],
  menuLookup: MenuTreeLookup,
): Record<string, string> {
  return Object.fromEntries(
    permissions
      .map((permission) => {
        const permissionCode = normalizePermissionCode(permission.code ?? '');
        if (!permissionCode) {
          return null;
        }

        const mappedByMenuTree =
          menuLookup.permissionMenuSlugByCode[permissionCode.toLowerCase()];
        if (mappedByMenuTree) {
          return [permissionCode.toLowerCase(), mappedByMenuTree] as const;
        }

        const resourceSlug = normalizeMenuLookupKey(
          normalizePermissionResource(permission.resourcePath || permission.resource || ''),
        );
        if (resourceSlug && menuLookup.menuListLabelBySlug[resourceSlug]) {
          return [permissionCode.toLowerCase(), resourceSlug] as const;
        }

        return [permissionCode.toLowerCase(), ''] as const;
      })
      .filter((entry): entry is readonly [string, string] => Boolean(entry)),
  );
}

function buildAssignmentScopeCountKey(assignmentId: number, scopeIndex: number): string {
  return `${assignmentId}:${scopeIndex}`;
}

function extractErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const response = (error as { response?: { data?: unknown; status?: number } }).response;
    const data = response?.data;
    if (typeof data === 'string' && data.trim()) {
      return data;
    }
    if (typeof data === 'object' && data !== null) {
      const title = (data as { title?: unknown }).title;
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
      if (typeof title === 'string' && title.trim()) {
        const errors = (data as { errors?: Record<string, string[] | string> }).errors;
        if (errors && typeof errors === 'object') {
          const details = Object.entries(errors)
            .flatMap(([, values]) => {
              if (Array.isArray(values)) {
                return values.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
              }
              if (typeof values === 'string' && values.trim().length > 0) {
                return [values];
              }
              return [];
            })
            .filter((value, index, source) => source.indexOf(value) === index);
          if (details.length > 0) {
            return `${title}: ${details.join(' / ')}`;
          }
        }
        return title;
      }
    }

    if (response?.status === 400) {
      return 'ข้อมูลที่บันทึกไม่ผ่านเงื่อนไขของระบบ (กรุณาตรวจสอบฟิลด์ที่ต้องกรอก)';
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'บันทึกผู้ใช้งานไม่สำเร็จ';
}

type DialogPermissionBaseContext = {
  assignablePermissionCodes: string[];
  roleLookup: Record<string, string[]>;
  facilities: FacilityNodeResponse[];
  permissionMenuSlugByCode: Record<string, string>;
  menuListLabelBySlug: Record<string, string>;
  menuGroupLabelByMenuListSlug: Record<string, string>;
  menuGroupOrderByMenuListSlug: Record<string, number>;
  menuListOrderBySlug: Record<string, number>;
};

interface AssignmentTableRow {
  id: number;
  _dbId: number;
  profileName: string;
  profileEmail: string;
  profileAvatar: string;
  organization: string;
  roleScopes: UserAssignment['roleScopes'];
  permissionOverrides: UserAssignment['permissionOverrides'];
}

export function UserAssignmentPage() {
  const theme = useTheme();
  const { activeTabKey, handleTabChange } = useUserAssignmentTabs();
  const {
    dataSource,
    isHydrated,
    loadError,
    assignments: sharedAssignments,
    roles: sharedRoles,
    farms: sharedFarms,
    zones: sharedZones,
    houses: sharedHouses,
    saveUserAssignment,
    deleteUserAssignment,
    reloadWorkspace,
    isMutating,
  } = useUserAssignmentData();
  const [pageAssignments, setPageAssignments] = useState<UserAssignment[] | null>(null);
  const [isPageAssignmentsLoading, setIsPageAssignmentsLoading] = useState(true);
  const assignments = (pageAssignments ?? sharedAssignments) as UserAssignment[];

  useEffect(() => {
    let alive = true;

    const loadPageAssignments = async () => {
      setIsPageAssignmentsLoading(true);
      try {
        const [users, roles, assignmentSummaries] = await Promise.all([
          userService.users.getAll(),
          userService.roles.getAll(),
          userService.userAssignments.getSummary(),
        ]);
        if (!alive) {
          return;
        }

        const assignmentsByUserId = new Map<number, UserAssignmentAggregateResponse>(
          assignmentSummaries.map((item) => [item.userId, item]),
        );
        const nextAssignments = users
          .filter((user) => user.isActive)
          .map((user) =>
            userViewAdapter.toAdminUserAssignment(
              user,
              assignmentsByUserId.get(user.id) ?? {
                userId: user.id,
                username: user.username,
                roleScopes: [],
                permissionOverrides: [],
              },
              [],
              roles,
          ),
        );

        setPageAssignments(nextAssignments);
      } catch {
        if (!alive) {
          return;
        }

        setPageAssignments(null);
      } finally {
        if (alive) {
          setIsPageAssignmentsLoading(false);
        }
      }
    };

    void loadPageAssignments();

    return () => {
      alive = false;
    };
  }, []);

  const roleIdByNormalizedName = useMemo(
    () =>
      new Map(
        sharedRoles.map((role) => [normalizeScopeValue(role.name), Number(role.id)] as const),
      ),
    [sharedRoles],
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<UserAssignment | null>(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [filterState, setFilterState] = useState<FilterState>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [rolePermissionCodes, setRolePermissionCodes] = useState<string[]>([]);
  const [rolePermissionsByRoleName, setRolePermissionsByRoleName] = useState<Record<string, string[]>>({});
  const [initialScopePermissionOverrides, setInitialScopePermissionOverrides] = useState<
    ScopePermissionOverrideInput[]
  >([]);
  const [assignablePermissionCodes, setAssignablePermissionCodes] = useState<string[]>([]);
  const [permissionMenuSlugByCode, setPermissionMenuSlugByCode] = useState<Record<string, string>>({});
  const [menuListLabelBySlug, setMenuListLabelBySlug] = useState<Record<string, string>>({});
  const [menuGroupLabelByMenuListSlug, setMenuGroupLabelByMenuListSlug] = useState<Record<string, string>>({});
  const [menuGroupOrderByMenuListSlug, setMenuGroupOrderByMenuListSlug] = useState<Record<string, number>>({});
  const [menuListOrderBySlug, setMenuListOrderBySlug] = useState<Record<string, number>>({});
  const [isRolePermissionCatalogLoading, setIsRolePermissionCatalogLoading] = useState(true);
  const [scopeEffectivePermissionCountByKey, setScopeEffectivePermissionCountByKey] = useState<
    Record<string, number>
  >({});
  const [isScopeEffectiveCountLoading, setIsScopeEffectiveCountLoading] = useState(true);
  const [permissionCountRefreshTick, setPermissionCountRefreshTick] = useState(0);
  const [isSavingAssignment, setIsSavingAssignment] = useState(false);
  const pageBg = theme.palette.background.default;
  const surface = theme.palette.background.paper;
  const border = theme.palette.divider;
  const borderStrong = alpha(theme.palette.divider, 0.92);
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const textMuted = alpha(theme.palette.text.secondary, 0.84);
  const primary = theme.palette.primary.main;
  const primaryBorder = alpha(theme.palette.primary.main, 0.5);
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
  const canCreateUser = canAddUserAssignment();
  const canUpdateUser = canEditUserAssignment();
  const canDeleteUser = canSoftDeleteUserAssignment();
  const isBusy = isMutating || isSavingAssignment;
  const dialogBaseContextRef = useRef<DialogPermissionBaseContext | null>(null);
  const isRoleCatalogReady = isHydrated && sharedRoles.length > 0;

  const companies = useMemo(
    () =>
      uniqueSorted([
        ...assignments.map((item) => item.organization.company),
      ]),
    [assignments],
  );

  const roles = useMemo(
    () =>
      uniqueSorted([
        ...sharedRoles.map((item) => item.name),
        ...assignments.flatMap((item) => item.roleScopes.map((scope) => scope.role)),
      ]),
    [assignments, sharedRoles],
  );

  const assignableSharedRoles = useMemo(
    () => sharedRoles.filter((role) => role.isActive && role.permissionCount > 0),
    [sharedRoles],
  );

  const rolesWithoutBaselinePermissions = useMemo(
    () => sharedRoles.filter((role) => role.isActive && role.permissionCount <= 0),
    [sharedRoles],
  );

  const farms = useMemo(
    () =>
      uniqueSorted([
        ...sharedFarms.map((item) => item.name),
        ...assignments.flatMap((item) => item.roleScopes.map((scope) => scope.farm)),
      ]),
    [assignments, sharedFarms],
  );

  const zones = useMemo(
    () =>
      uniqueSorted([
        ...sharedZones.map((item) => item.name),
        ...assignments.flatMap((item) => item.roleScopes.map((scope) => scope.zone)),
      ]),
    [assignments, sharedZones],
  );

  const houses = useMemo(
    () =>
      uniqueSorted([
        ...sharedHouses.map((item) => item.name),
        ...assignments.flatMap((item) => item.roleScopes.map((scope) => scope.house)),
      ]),
    [assignments, sharedHouses],
  );

  const roleCatalog = useMemo<RoleCatalogItem[]>(
    () =>
      assignableSharedRoles
        .map((role) => ({
          name: role.name,
          code: role.code,
          permissionCount: role.permissionCount,
        }))
        .sort((left, right) => left.name.localeCompare(right.name)),
    [assignableSharedRoles],
  );

  const selectableRoleNames = useMemo(
    () => uniqueSorted(assignableSharedRoles.map((item) => item.name)),
    [assignableSharedRoles],
  );

  const roleCodeByName = useMemo(() => {
    const next: Record<string, string> = {};
    sharedRoles.forEach((role) => {
      const roleNameKey = role.name.trim().toLowerCase();
      const roleCodeKey = role.code.trim().toLowerCase();
      if (roleNameKey && roleCodeKey) {
        next[roleNameKey] = roleCodeKey;
      }
    });
    return next;
  }, [sharedRoles]);

  const rolePermissionCountByName = useMemo(() => {
    const next: Record<string, number> = {};
    sharedRoles.forEach((role) => {
      const permissionCount = role.permissionCount ?? 0;
      const roleNameKey = role.name.trim().toLowerCase();
      const roleCodeKey = role.code.trim().toLowerCase();

      if (roleNameKey) {
        next[roleNameKey] = permissionCount;
      }
      if (roleCodeKey) {
        next[roleCodeKey] = permissionCount;
      }
    });
    return next;
  }, [sharedRoles]);

  const hasRolePermissionCatalog = useMemo(
    () => Object.keys(rolePermissionsByRoleName).length > 0,
    [rolePermissionsByRoleName],
  );

  const farmCatalog = useMemo<FarmCatalogItem[]>(() => {
    const map = new Map<string, FarmCatalogItem>();

    sharedFarms.forEach((item) => {
      map.set(item.name, {
        name: item.name,
        location: item.location,
        status: item.status,
      });
    });

    farms.forEach((name) => {
      if (!map.has(name)) {
        map.set(name, {
          name,
          location: 'Unspecified',
          status: 'Unknown',
        });
      }
    });

    return Array.from(map.values()).sort((left, right) => left.name.localeCompare(right.name));
  }, [farms, sharedFarms]);

  const zoneCatalog = useMemo<ZoneCatalogItem[]>(() => {
    const map = new Map<string, ZoneCatalogItem>();

    sharedZones.forEach((item) => {
      map.set(`${item.farmName}::${item.name}`, {
        name: item.name,
        farmName: item.farmName,
        status: item.status,
      });
    });

    assignments.forEach((assignment) => {
      assignment.roleScopes.forEach((scope) => {
        if (!scope.zone) {
          return;
        }
        const key = `${scope.farm || 'Unassigned'}::${scope.zone}`;
        if (!map.has(key)) {
          map.set(key, {
            name: scope.zone,
            farmName: scope.farm || 'Unassigned',
            status: 'Unknown',
          });
        }
      });
    });

    zones.forEach((name) => {
      const hasKnownEntry = Array.from(map.values()).some((item) => item.name === name);
      if (!hasKnownEntry) {
        map.set(`Unassigned::${name}`, {
          name,
          farmName: 'Unassigned',
          status: 'Unknown',
        });
      }
    });

    return Array.from(map.values()).sort((left, right) =>
      `${left.farmName} ${left.name}`.localeCompare(`${right.farmName} ${right.name}`),
    );
  }, [assignments, zones, sharedZones]);

  const houseCatalog = useMemo<HouseCatalogItem[]>(() => {
    const map = new Map<string, HouseCatalogItem>();

    sharedHouses.forEach((item) => {
      map.set(`${item.farmName}::${item.zoneName}::${item.name}`, {
        name: item.name,
        farmName: item.farmName,
        zoneName: item.zoneName,
        status: item.status,
      });
    });

    assignments.forEach((assignment) => {
      assignment.roleScopes.forEach((scope) => {
        if (!scope.house) {
          return;
        }
        const key = `${scope.farm || 'Unassigned'}::${scope.zone || 'Unassigned'}::${scope.house}`;
        if (!map.has(key)) {
          map.set(key, {
            name: scope.house,
            farmName: scope.farm || 'Unassigned',
            zoneName: scope.zone || 'Unassigned',
            status: 'Unknown',
          });
        }
      });
    });

    houses.forEach((name) => {
      const hasKnownEntry = Array.from(map.values()).some((item) => item.name === name);
      if (!hasKnownEntry) {
        map.set(`Unassigned::Unassigned::${name}`, {
          name,
          farmName: 'Unassigned',
          zoneName: 'Unassigned',
          status: 'Unknown',
        });
      }
    });

    return Array.from(map.values()).sort((left, right) =>
      `${left.farmName} ${left.zoneName} ${left.name}`.localeCompare(
        `${right.farmName} ${right.zoneName} ${right.name}`,
      ),
    );
  }, [assignments, houses, sharedHouses]);

  const activeFilterCount = useMemo(
    () => Object.values(filterState).filter((value) => value !== '').length,
    [filterState],
  );

  const filteredAssignments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return assignments.filter((assignment) => {
      const queryTarget = [
        assignment.name,
        assignment.email,
        assignment.organization.company,
        ...assignment.roleScopes.flatMap((scope) => [scope.role, scope.farm, scope.zone, scope.house]),
      ]
        .join(' ')
        .toLowerCase();

      const matchesQuery = !query || queryTarget.includes(query);
      if (!matchesQuery) {
        return false;
      }

      const matchesOrganization =
        !filterState.company || assignment.organization.company === filterState.company;

      if (!matchesOrganization) {
        return false;
      }

      return assignment.roleScopes.some(
        (scope) =>
          (!filterState.role || scope.role === filterState.role) &&
          (!filterState.farm || scope.farm === filterState.farm) &&
          (!filterState.zone || scope.zone === filterState.zone) &&
          (!filterState.house || scope.house === filterState.house),
      );
    });
  }, [assignments, filterState, searchQuery]);

  const paginatedAssignments = useMemo(() => {
    const start = page * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredAssignments.slice(start, end);
  }, [filteredAssignments, page, rowsPerPage]);

  const assignmentById = useMemo(
    () => new Map(assignments.map((assignment) => [assignment.id, assignment] as const)),
    [assignments],
  );

  const tableRows = useMemo<AssignmentTableRow[]>(
    () =>
      paginatedAssignments.map((assignment, index) => ({
        id: page * rowsPerPage + index + 1,
        _dbId: assignment.id,
        profileName: assignment.name,
        profileEmail: assignment.email,
        profileAvatar: assignment.avatar,
        organization: assignment.organization.company,
        roleScopes: assignment.roleScopes,
        permissionOverrides: assignment.permissionOverrides,
      })),
    [page, paginatedAssignments, rowsPerPage],
  );

  const assignedUserIds = useMemo(
    () => Array.from(new Set(assignments.map((assignment) => assignment.userId))),
    [assignments],
  );

  const tableColumns = useMemo<Column<AssignmentTableRow>[]>(
    () => [
      { id: 'id', label: 'ID', minWidth: 52, align: 'center' },
      {
        id: 'profileName',
        label: 'โปรไฟล์ผู้ใช้',
        minWidth: 250,
        format: (_value, row) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
            <Avatar
              sx={{
                bgcolor: alpha(primary, 0.16),
                width: 34,
                height: 34,
                color: primary,
                fontWeight: 700,
                fontSize: '0.82rem',
                lineHeight: 1,
                border: `1px solid ${primaryBorder}`,
                flexShrink: 0,
              }}
            >
              {row.profileAvatar}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                sx={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: textPrimary,
                  lineHeight: 1.35,
                }}
              >
                {row.profileName}
              </Typography>
              <Typography
                sx={{
                  fontSize: '11px',
                  color: textMuted,
                  lineHeight: 1.45,
                  wordBreak: 'break-word',
                  overflowWrap: 'anywhere',
                }}
              >
                {row.profileEmail}
              </Typography>
            </Box>
          </Box>
        ),
      },
      {
        id: 'organization',
        label: 'องค์กร',
        minWidth: 180,
      },
      {
        id: 'roleScopes',
        label: 'บทบาท สิทธิและขอบเขต',
        minWidth: 360,
        format: (_value, row) => (
          <Stack spacing={1} sx={{ py: 0.5 }}>
            {row.roleScopes.map((scope, index) => {
              const fallbackScopePermissionCount =
                rolePermissionCountByName[scope.role.trim().toLowerCase()] ??
                rolePermissionCountByName[roleCodeByName[scope.role.trim().toLowerCase()] ?? ''] ??
                0;
              const scopeRoleLookupKey = scope.role.trim().toLowerCase();
              const scopeRoleCode = roleCodeByName[scopeRoleLookupKey] ?? '';
              const scopeRolePermissionCodes = Array.from(
                new Set(
                  (
                    rolePermissionsByRoleName[scopeRoleLookupKey] ??
                    (scopeRoleCode ? rolePermissionsByRoleName[scopeRoleCode] : []) ??
                    []
                  )
                    .map((code) => normalizePermissionCode(code))
                    .filter((code) => code.length > 0),
                ),
              ).sort((left, right) => left.localeCompare(right));
              const scopePermissionCount =
                scopeRolePermissionCodes.length > 0
                  ? scopeRolePermissionCodes.length
                  : fallbackScopePermissionCount;
              const scopePermissionLabel = !isRoleCatalogReady || isRolePermissionCatalogLoading
                ? 'กำลังโหลดสิทธิ์พื้นฐาน...'
                : `${scopePermissionCount} สิทธิ`;
              const scopeLabels = [scope.farm, scope.zone, scope.house].filter(
                (value) => !isBlankScopeValue(value),
              );
              const displayScopeLabels =
                scopeLabels.length > 0 ? scopeLabels : ['ยังไม่กำหนด Scope'];

              return (
                <Box
                  key={`${scope.role}-${scope.farm}-${scope.zone}-${scope.house}-${index}`}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.85,
                    p: 1,
                    borderRadius: 1.5,
                    border: `1px solid ${alpha(borderStrong, 0.9)}`,
                    bgcolor: alpha(surface, 0.72),
                  }}
                >
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    <Chip
                      label={scope.role}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        bgcolor: alpha(primary, 0.18),
                        color: primary,
                        border: `1px solid ${primaryBorder}`,
                        fontSize: '0.72rem',
                      }}
                    />
                    <Chip
                      label={scopePermissionLabel}
                      size="small"
                      sx={{
                        fontWeight: 700,
                        bgcolor: alpha(primary, 0.08),
                        color: !isRoleCatalogReady || isRolePermissionCatalogLoading ? textMuted : textPrimary,
                        border: `1px solid ${alpha(primaryBorder, 0.85)}`,
                        fontSize: '0.68rem',
                      }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: textSecondary,
                        fontWeight: 700,
                        lineHeight: 1.2,
                      }}
                    >
                      สิทธิ์พื้นฐาน
                    </Typography>
                    {!isRoleCatalogReady || isRolePermissionCatalogLoading ? (
                      <Typography variant="caption" sx={{ color: textMuted, lineHeight: 1.35 }}>
                        กำลังโหลดสิทธิ์พื้นฐาน...
                      </Typography>
                    ) : !hasRolePermissionCatalog ? (
                      <Typography variant="caption" sx={{ color: theme.palette.warning.dark, lineHeight: 1.35 }}>
                        ไม่สามารถโหลดสิทธิ์พื้นฐาน
                      </Typography>
                    ) : scopeRolePermissionCodes.length > 0 ? (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {scopeRolePermissionCodes.map((code) => (
                          <Tooltip key={`${scope.role}-${code}`} title={code}>
                            <Chip
                              label={
                                formatPermissionDisplayLabel(
                                  code,
                                  permissionMenuSlugByCode,
                                  menuListLabelBySlug,
                                ) || code
                              }
                              size="small"
                              variant="outlined"
                              sx={{
                                fontSize: '0.68rem',
                                height: 26,
                                bgcolor: alpha(theme.palette.primary.main, 0.06),
                                color: theme.palette.primary.dark,
                                borderColor: alpha(theme.palette.primary.main, 0.26),
                                '& .MuiChip-label': {
                                  px: 1,
                                },
                              }}
                            />
                          </Tooltip>
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="caption" sx={{ color: textMuted, lineHeight: 1.35 }}>
                        ไม่มีสิทธิ์พื้นฐาน
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {displayScopeLabels.map((label) => (
                      <Chip
                        key={`${scope.role}-${label}`}
                        label={label}
                        size="small"
                        variant="outlined"
                        sx={{
                          borderColor: borderStrong,
                          color: textSecondary,
                          fontSize: '0.68rem',
                          bgcolor: alpha(surface, 0.92),
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              );
            })}
            {row.permissionOverrides.length > 0 && (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.85,
                  p: 1,
                  borderRadius: 1.5,
                  border: `1px solid ${alpha(theme.palette.warning.main, 0.4)}`,
                  bgcolor: alpha(theme.palette.warning.main, 0.04),
                }}
              >
                <Typography sx={{ fontSize: '10px', fontWeight: 700, color: theme.palette.warning.dark }}>
                  สิทธิพิเศษ (Overrides)
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {row.permissionOverrides.map((override, idx) => (
                    <Tooltip
                      key={`ovr-${idx}`}
                      title={`${override.permissionCode} (${override.effect})`}
                    >
                      <Chip
                        label={
                          formatPermissionDisplayLabel(
                            override.permissionCode ?? '',
                            permissionMenuSlugByCode,
                            menuListLabelBySlug,
                          ) || override.permissionCode
                        }
                        size="small"
                        sx={{
                          fontSize: '9px',
                          height: '18px',
                          bgcolor:
                            override.effect === 'allow'
                              ? alpha(theme.palette.success.main, 0.1)
                              : alpha(theme.palette.error.main, 0.1),
                          color:
                            override.effect === 'allow'
                              ? theme.palette.success.dark
                              : theme.palette.error.dark,
                          border: `1px solid ${alpha(
                            override.effect === 'allow'
                              ? theme.palette.success.main
                              : theme.palette.error.main,
                            0.3,
                          )}`,
                        }}
                      />
                    </Tooltip>
                  ))}
                </Box>
              </Box>
            )}
          </Stack>
        ),
      },
    ],
    [
      borderStrong,
      primary,
      primaryBorder,
      hasRolePermissionCatalog,
      isScopeEffectiveCountLoading,
      isRolePermissionCatalogLoading,
      menuListLabelBySlug,
      permissionMenuSlugByCode,
      roleCodeByName,
      rolePermissionCountByName,
      rolePermissionsByRoleName,
      scopeEffectivePermissionCountByKey,
      surface,
      textMuted,
      textPrimary,
      textSecondary,
    ],
  );

  useEffect(() => {
    const maxPage = Math.max(0, Math.ceil(filteredAssignments.length / rowsPerPage) - 1);
    if (page > maxPage) {
      setPage(maxPage);
    }
  }, [filteredAssignments.length, page, rowsPerPage]);

  const handleDelete = async (assignmentId: number): Promise<boolean> => {
    if (!canDeleteUser) {
      void showAlert({
        icon: 'warning',
        title: 'ไม่มีสิทธิ์',
        text: 'คุณไม่มีสิทธิ์ลบผู้ใช้งาน',
      });
      return false;
    }
    if (isMutating) {
      return false;
    }

    const assignment = assignmentById.get(assignmentId);
    const confirmation = await showAlert({
      icon: 'warning',
      title: 'ยืนยันลบผู้ใช้งาน?',
      text: assignment
        ? `คุณต้องการลบผู้ใช้งาน ${assignment.username} หรือไม่`
        : 'คุณต้องการลบผู้ใช้งานนี้ใช่หรือไม่?',
      showCancelButton: true,
      confirmButtonText: 'ลบ',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: '#ef4444',
    });
    if (!confirmation.isConfirmed) {
      return false;
    }

    try {
      await deleteUserAssignment(assignmentId);
      void showAlert({
        icon: 'success',
        title: 'ลบข้อมูลสำเร็จ',
        text: 'ระบบได้ลบข้อมูลเรียบร้อยแล้ว',
        showConfirmButton: false,
        timer: 1500,
      });
      return true;
    } catch (error) {
      void showAlert({
        icon: 'error',
        title: 'ลบไม่สำเร็จ',
        text: extractErrorMessage(error) || 'ลบผู้ใช้งานไม่สำเร็จ',
      });
      return false;
    }
  };

  const loadRolePermissionLookup = useCallback(async (): Promise<Record<string, string[]>> => {
    const entries = await Promise.all(
      sharedRoles.map(async (role) => {
        const numericRoleId = Number(role.id);
        if (!Number.isFinite(numericRoleId) || numericRoleId <= 0) {
          return {
            roleName: role.name,
            roleCode: role.code,
            codes: [] as string[],
          };
        }
        try {
          const mappings = await userService.rolePermissions.getByRoleId(numericRoleId);
          const codes = Array.from(
            new Set(mappings.map((item) => normalizePermissionCode(item.permissionCode))),
          ).sort((left, right) => left.localeCompare(right));
          return {
            roleName: role.name,
            roleCode: role.code,
            codes,
          };
        } catch {
          return {
            roleName: role.name,
            roleCode: role.code,
            codes: [] as string[],
          };
        }
      }),
    );

    const lookup: Record<string, string[]> = {};
    entries.forEach(({ roleName, roleCode, codes }) => {
      const byName = roleName.trim().toLowerCase();
      if (byName) {
        lookup[byName] = [...codes];
      }
      const byCode = roleCode.trim().toLowerCase();
      if (byCode) {
        lookup[byCode] = [...codes];
      }
    });

    return lookup;
  }, [sharedRoles]);

  const collectRolePermissionCodesFromScopes = (
    roleScopes: UserAssignment['roleScopes'],
    lookup: Record<string, string[]>,
  ): string[] => {
    const collected = new Set<string>();
    roleScopes.forEach((scope) => {
      const roleLookupKey = scope.role.trim().toLowerCase();
      const mappedRoleCode = roleCodeByName[roleLookupKey];
      const mappedCodes = lookup[roleLookupKey] ?? (mappedRoleCode ? lookup[mappedRoleCode] : []) ?? [];
      mappedCodes.forEach((code) => collected.add(normalizePermissionCode(code)));
    });
    return Array.from(collected).sort((left, right) => left.localeCompare(right));
  };

  const collectRolePermissionCodesForScope = (
    scope: Pick<ScopePermissionOverrideItem, 'role'>,
    lookup: Record<string, string[]>,
  ): string[] => {
    const roleLookupKey = scope.role.trim().toLowerCase();
    const mappedRoleCode = roleCodeByName[roleLookupKey];
    const mappedCodes = lookup[roleLookupKey] ?? (mappedRoleCode ? lookup[mappedRoleCode] : []) ?? [];
    return Array.from(new Set(mappedCodes.map((code) => normalizePermissionCode(code)))).sort(
      (left, right) => left.localeCompare(right),
    );
  };

  const loadDialogBaseContext = useCallback(async (): Promise<DialogPermissionBaseContext> => {
    if (dialogBaseContextRef.current) {
      return dialogBaseContextRef.current;
    }

    const roleLookup = await loadRolePermissionLookup();
    const [allPermissions, facilities, menuTree] = await Promise.all([
      userService.permissions.getAll({ includeInactive: true }).catch(() => []),
      userService.scopeCatalog
        .getFacilities({ includeInactive: true })
        .catch(() => [] as FacilityNodeResponse[]),
      userService.permissionMenus.getTree().catch(() => []),
    ]);
    const menuLookup = buildMenuTreeLookupFromTree(menuTree);
    const assignablePermissions = allPermissions.filter((permission) => {
      if (permission.id <= 0 || (permission.code ?? '').trim().length === 0) {
        return false;
      }
      return normalizePermissionCode(permission.code).length > 0;
    });
    const roleLookupCodes = Array.from(
      new Set(
        Object.values(roleLookup)
          .flat()
          .map((code) => normalizePermissionCode(code))
          .filter((code) => code.length > 0),
      ),
    ).sort((left, right) => left.localeCompare(right));
    const sourcePermissionCodes = assignablePermissions
      .map((item) => normalizePermissionCode(item.code))
      .sort((left, right) => left.localeCompare(right));
    const permissionMenuSlugByCode = buildPermissionMenuSlugByCode(allPermissions, menuLookup);

    const nextContext: DialogPermissionBaseContext = {
      assignablePermissionCodes:
        sourcePermissionCodes.length > 0 ? sourcePermissionCodes : roleLookupCodes,
      roleLookup,
      facilities,
      permissionMenuSlugByCode,
      menuListLabelBySlug: menuLookup.menuListLabelBySlug,
      menuGroupLabelByMenuListSlug: menuLookup.menuGroupLabelByMenuListSlug,
      menuGroupOrderByMenuListSlug: menuLookup.menuGroupOrderByMenuListSlug,
      menuListOrderBySlug: menuLookup.menuListOrderBySlug,
    };
    dialogBaseContextRef.current = nextContext;
    return nextContext;
  }, [loadRolePermissionLookup]);

  useEffect(() => {
    let active = true;

    const preloadRolePermissionCatalog = async () => {
      if (!isHydrated) {
        return;
      }

      if (sharedRoles.length === 0) {
        if (active) {
          setRolePermissionsByRoleName({});
          setAssignablePermissionCodes([]);
          setPermissionMenuSlugByCode({});
          setMenuListLabelBySlug({});
          setMenuGroupLabelByMenuListSlug({});
          setMenuGroupOrderByMenuListSlug({});
          setMenuListOrderBySlug({});
          setRolePermissionCodes([]);
          setIsRolePermissionCatalogLoading(false);
        }
        return;
      }

      setIsRolePermissionCatalogLoading(true);
      try {
        const roleLookup = await loadRolePermissionLookup();
        if (!active) {
          return;
        }

        const roleLookupCodes = Array.from(
          new Set(
            Object.values(roleLookup)
              .flat()
              .map((code) => normalizePermissionCode(code))
              .filter((code) => code.length > 0),
          ),
        ).sort((left, right) => left.localeCompare(right));

        setAssignablePermissionCodes(roleLookupCodes);
        setRolePermissionsByRoleName(roleLookup);
        setRolePermissionCodes(roleLookupCodes);

        const [allPermissionsResult, facilitiesResult, menuTreeResult] = await Promise.allSettled([
          userService.permissions.getAll({ includeInactive: true }),
          userService.scopeCatalog.getFacilities({ includeInactive: true }),
          userService.permissionMenus.getTree(),
        ]);
        void facilitiesResult;

        if (!active) {
          return;
        }

        if (allPermissionsResult.status === 'fulfilled') {
          const allPermissions = allPermissionsResult.value;
          const menuLookup =
            menuTreeResult.status === 'fulfilled'
              ? buildMenuTreeLookupFromTree(menuTreeResult.value)
              : buildMenuTreeLookupFromTree([]);
          setPermissionMenuSlugByCode(buildPermissionMenuSlugByCode(allPermissions, menuLookup));
          setMenuListLabelBySlug(menuLookup.menuListLabelBySlug);
          setMenuGroupLabelByMenuListSlug(menuLookup.menuGroupLabelByMenuListSlug);
          setMenuGroupOrderByMenuListSlug(menuLookup.menuGroupOrderByMenuListSlug);
          setMenuListOrderBySlug(menuLookup.menuListOrderBySlug);
        } else {
          setPermissionMenuSlugByCode({});
          setMenuListLabelBySlug({});
          setMenuGroupLabelByMenuListSlug({});
          setMenuGroupOrderByMenuListSlug({});
          setMenuListOrderBySlug({});
        }

      } catch {
        if (!active) {
          return;
        }

        const fallbackLookup = await loadRolePermissionLookup().catch(() => ({} as Record<string, string[]>));
        const fallbackCodes = Array.from(
          new Set(
            Object.values(fallbackLookup)
              .flat()
              .map((code) => normalizePermissionCode(code))
              .filter((code) => code.length > 0),
          ),
        ).sort((left, right) => left.localeCompare(right));
        setAssignablePermissionCodes(fallbackCodes);
        setRolePermissionsByRoleName(fallbackLookup);
        setRolePermissionCodes(fallbackCodes);
        setPermissionMenuSlugByCode({});
        setMenuListLabelBySlug({});
        setMenuGroupLabelByMenuListSlug({});
        setMenuGroupOrderByMenuListSlug({});
        setMenuListOrderBySlug({});
      } finally {
        if (active) {
          setIsRolePermissionCatalogLoading(false);
        }
      }
    };

    void preloadRolePermissionCatalog();
    return () => {
      active = false;
    };
  }, [isHydrated, loadDialogBaseContext, loadRolePermissionLookup, sharedRoles.length]);

  useEffect(() => {
    if (!isRoleCatalogReady) {
      return;
    }

    let active = true;
    dialogBaseContextRef.current = null;

    const preloadDialogBaseContext = async () => {
      try {
        const roleEntries = await Promise.all(
          sharedRoles.map(async (role) => {
            const numericRoleId = Number(role.id);
            if (!Number.isFinite(numericRoleId) || numericRoleId <= 0) {
              return {
                roleName: role.name,
                roleCode: role.code,
                codes: [] as string[],
              };
            }
            try {
              const mappings = await userService.rolePermissions.getByRoleId(numericRoleId, { includeInactive: true });
              const codes = Array.from(
                new Set(mappings.map((item) => normalizePermissionCode(item.permissionCode))),
              ).sort((left, right) => left.localeCompare(right));
              return {
                roleName: role.name,
                roleCode: role.code,
                codes,
              };
            } catch {
              return {
                roleName: role.name,
                roleCode: role.code,
                codes: [] as string[],
              };
            }
          }),
        );

        const roleLookup: Record<string, string[]> = {};
        roleEntries.forEach(({ roleName, roleCode, codes }) => {
          const byName = roleName.trim().toLowerCase();
          if (byName) {
            roleLookup[byName] = [...codes];
          }
          const byCode = roleCode.trim().toLowerCase();
          if (byCode) {
            roleLookup[byCode] = [...codes];
          }
        });

        const [allPermissions, facilities, menuTree] = await Promise.all([
          userService.permissions.getAll({ includeInactive: true }),
          userService.scopeCatalog
            .getFacilities({ includeInactive: true })
            .catch(() => [] as FacilityNodeResponse[]),
          userService.permissionMenus.getTree().catch(() => []),
        ]);
        const menuLookup = buildMenuTreeLookupFromTree(menuTree);
        const assignablePermissions = allPermissions.filter((permission) => {
          if (permission.id <= 0 || (permission.code ?? '').trim().length === 0) {
            return false;
          }
          return normalizePermissionCode(permission.code).length > 0;
        });
        const assignablePermissionSet = new Set(
          assignablePermissions.map((permission) => normalizePermissionCode(permission.code)),
        );

        if (!active) {
          return;
        }

        const permissionMenuSlugByCode = buildPermissionMenuSlugByCode(allPermissions, menuLookup);

        const nextContext: DialogPermissionBaseContext = {
          assignablePermissionCodes: assignablePermissions
            .map((item) => normalizePermissionCode(item.code))
            .sort((left, right) => left.localeCompare(right)),
          roleLookup,
          facilities,
          permissionMenuSlugByCode,
          menuListLabelBySlug: menuLookup.menuListLabelBySlug,
          menuGroupLabelByMenuListSlug: menuLookup.menuGroupLabelByMenuListSlug,
          menuGroupOrderByMenuListSlug: menuLookup.menuGroupOrderByMenuListSlug,
          menuListOrderBySlug: menuLookup.menuListOrderBySlug,
        };
        dialogBaseContextRef.current = nextContext;
      } catch {
        // Preload is best-effort; edit flow will re-fetch if needed.
      }
    };

    void preloadDialogBaseContext();
    return () => {
      active = false;
    };
  }, [isRoleCatalogReady, roleIdByNormalizedName, sharedRoles, sharedFarms, sharedZones, sharedHouses]);

  const loadDialogPermissionContext = async (assignment: UserAssignment | null) => {
    setPermissionsLoading(true);
    try {
      const baseContext = await loadDialogBaseContext();
      const roleLookup = baseContext.roleLookup;
      const facilities = baseContext.facilities;
      const assignablePermissionSet = new Set(
        baseContext.assignablePermissionCodes.map((code) => normalizePermissionCode(code)),
      );
      setAssignablePermissionCodes(baseContext.assignablePermissionCodes);
      setRolePermissionsByRoleName(roleLookup);
      setPermissionMenuSlugByCode(baseContext.permissionMenuSlugByCode);
      setMenuListLabelBySlug(baseContext.menuListLabelBySlug);
      setMenuGroupLabelByMenuListSlug(baseContext.menuGroupLabelByMenuListSlug);
      setMenuGroupOrderByMenuListSlug(baseContext.menuGroupOrderByMenuListSlug);
      setMenuListOrderBySlug(baseContext.menuListOrderBySlug);
      setIsRolePermissionCatalogLoading(false);

      const roleCodes = assignment
        ? collectRolePermissionCodesFromScopes(assignment.roleScopes, roleLookup)
        : [];
      setRolePermissionCodes(roleCodes);

      if (!assignment?.userId) {
        setInitialScopePermissionOverrides([]);
        return;
      }

      try {
        const scopeOverrides = assignment.roleScopes.map((scope) => {
          const scopeRolePermissionCodes = collectRolePermissionCodesForScope(scope, roleLookup);
          const scopeFacilityNodeId = resolveFacilityNodeIdFromScope(scope, facilities);
          const scopeRoleId =
            typeof scope.roleId === 'number' && scope.roleId > 0
              ? scope.roleId
              : roleIdByNormalizedName.get(normalizeScopeValue(scope.role)) ?? null;
          const overrideRows = assignment.permissionOverrides ?? [];

          const scopedAllowCodes = normalizePermissionCodes(
            overrideRows
              .filter((item) => item.effect === 'allow')
              .filter((item) => item.roleId === scopeRoleId)
              .filter((item) => item.facilityNodeId === scopeFacilityNodeId)
              .map((item) => item.permissionCode ?? ''),
          ).filter((code) => assignablePermissionSet.has(code));
          const scopedDenyCodes = normalizePermissionCodes(
            overrideRows
              .filter((item) => item.effect === 'deny')
              .filter((item) => item.roleId === scopeRoleId)
              .filter((item) => item.facilityNodeId === scopeFacilityNodeId)
              .map((item) => item.permissionCode ?? ''),
          ).filter((code) => assignablePermissionSet.has(code));

          return {
            allowPermissionCodes: scopedAllowCodes.filter(
              (code) => !scopeRolePermissionCodes.includes(code),
            ),
            denyPermissionCodes: scopedDenyCodes.filter((code) =>
              scopeRolePermissionCodes.includes(code),
            ),
          } satisfies ScopePermissionOverrideInput;
        });

        setInitialScopePermissionOverrides(scopeOverrides);
      } catch {
        // Keep base role permissions visible even if user override endpoint fails.
        setInitialScopePermissionOverrides([]);
      }
    } catch {
      dialogBaseContextRef.current = null;
      const fallbackLookup = await loadRolePermissionLookup().catch(() => ({} as Record<string, string[]>));
      const fallbackCodes = Array.from(
        new Set(
          Object.values(fallbackLookup)
            .flat()
            .map((code) => normalizePermissionCode(code))
            .filter((code) => code.length > 0),
        ),
      ).sort((left, right) => left.localeCompare(right));
      setAssignablePermissionCodes(fallbackCodes);
      setRolePermissionsByRoleName(fallbackLookup);
      setPermissionMenuSlugByCode({});
      setMenuListLabelBySlug({});
      setMenuGroupLabelByMenuListSlug({});
      setMenuGroupOrderByMenuListSlug({});
      setMenuListOrderBySlug({});
      const fallbackRoleCodes = assignment
        ? collectRolePermissionCodesFromScopes(assignment.roleScopes, fallbackLookup)
        : [];
      setRolePermissionCodes(fallbackRoleCodes);
      setInitialScopePermissionOverrides([]);
      setIsRolePermissionCatalogLoading(false);
    } finally {
      setPermissionsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadEffectivePermissionCounts = async () => {
      if (active) {
        setIsScopeEffectiveCountLoading(true);
      }

      if (paginatedAssignments.length === 0) {
        if (active) {
          setScopeEffectivePermissionCountByKey({});
          setIsScopeEffectiveCountLoading(false);
        }
        return;
      }

      try {
        const baseContext = await loadDialogBaseContext();
        const roleLookup = baseContext.roleLookup;
        const facilities = baseContext.facilities;
        const assignablePermissionSet = new Set(
          baseContext.assignablePermissionCodes.map((code) =>
            normalizePermissionCode(code),
          ),
        );

        if (!active) {
          return;
        }

        const nextCountByKey: Record<string, number> = {};

        paginatedAssignments.forEach((assignment) => {
          assignment.roleScopes.forEach((scope, scopeIndex) => {
            const baseRolePermissionCodes = collectRolePermissionCodesForScope(
              scope,
              roleLookup,
            )
              .map((code) => normalizePermissionCode(code))
              .filter((code) => assignablePermissionSet.has(code));
            const effectivePermissionSet = new Set(baseRolePermissionCodes);
            const scopeFacilityNodeId = resolveFacilityNodeIdFromScope(
              scope,
              facilities,
            );
            const scopeRoleId =
              typeof scope.roleId === 'number' && scope.roleId > 0
                ? scope.roleId
                : roleIdByNormalizedName.get(normalizeScopeValue(scope.role)) ?? null;

            const allowCodes = normalizePermissionCodes(
              (assignment.permissionOverrides ?? [])
                .filter((row) => row.effect === 'allow')
                .filter((row) => row.roleId === scopeRoleId)
                .filter((row) => row.facilityNodeId === scopeFacilityNodeId)
                .map((row) => row.permissionCode ?? ''),
            ).filter((code) => assignablePermissionSet.has(code));

            const denyCodes = normalizePermissionCodes(
              (assignment.permissionOverrides ?? [])
                .filter((row) => row.effect === 'deny')
                .filter((row) => row.roleId === scopeRoleId)
                .filter((row) => row.facilityNodeId === scopeFacilityNodeId)
                .map((row) => row.permissionCode ?? ''),
            ).filter((code) => assignablePermissionSet.has(code));

            denyCodes.forEach((code) => effectivePermissionSet.delete(code));
            allowCodes.forEach((code) => effectivePermissionSet.add(code));

            nextCountByKey[
              buildAssignmentScopeCountKey(assignment.id, scopeIndex)
            ] = effectivePermissionSet.size;
          });
        });

        if (active) {
          setScopeEffectivePermissionCountByKey(nextCountByKey);
        }
      } catch {
        if (active) {
          setScopeEffectivePermissionCountByKey({});
        }
      } finally {
        if (active) {
          setIsScopeEffectiveCountLoading(false);
        }
      }
    };

    void loadEffectivePermissionCounts();
    return () => {
      active = false;
    };
  }, [loadDialogBaseContext, paginatedAssignments, permissionCountRefreshTick]);

  const openAssignmentDialog = (assignment: UserAssignment | null) => {
    setPermissionsLoading(true);
    setInitialScopePermissionOverrides([]);
    setEditingAssignment(assignment);
    setDialogOpen(true);
    void loadDialogPermissionContext(assignment);
  };

  useEffect(() => {
    if (!dialogOpen || permissionsLoading) {
      return;
    }

    if (sharedRoles.length === 0) {
      return;
    }

    const hasRoleLookup = Object.keys(rolePermissionsByRoleName).length > 0;
    const hasPermissionCatalog = assignablePermissionCodes.length > 0;
    if (hasRoleLookup && hasPermissionCatalog) {
      return;
    }

    void loadDialogPermissionContext(editingAssignment);
  }, [
    dialogOpen,
    permissionsLoading,
    sharedRoles,
    rolePermissionsByRoleName,
    assignablePermissionCodes.length,
    editingAssignment,
  ]);

  const handleEdit = (assignment: UserAssignment) => {
    if (!canUpdateUser) {
      void showAlert({
        icon: 'warning',
        title: 'ไม่มีสิทธิ์',
        text: 'คุณไม่มีสิทธิ์แก้ไขผู้ใช้งาน',
      });
      return;
    }
    openAssignmentDialog(assignment);
  };

  const handleSaveAssignment = async (payload: AssignmentDialogPayload) => {
    const inferredEditId = payload.id ?? editingAssignment?.id;
    const isEdit = Boolean(inferredEditId);
    if ((isEdit && !canUpdateUser) || (!isEdit && !canCreateUser)) {
      void showAlert({
        icon: 'warning',
        title: 'ไม่มีสิทธิ์',
        text: 'คุณไม่มีสิทธิ์บันทึกข้อมูลผู้ใช้งาน',
      });
      return;
    }
    if (isMutating) {
      return;
    }

    const normalizedRoleScopes = (payload.roleScopes.length
      ? payload.roleScopes
      : [createEmptyRoleScope()]
    ).map((scope) => ({
      role: scope.role.trim(),
      farm: scope.farm.trim(),
      zone: scope.zone.trim(),
      house: scope.house.trim(),
    }));
    const hasAtLeastOneValidRoleScope = normalizedRoleScopes.some(
      (scope) => scope.role.length > 0 && !isBlankScopeValue(scope.farm),
    );
    const hasIncompleteRoleScope = normalizedRoleScopes.some((scope) => {
      const hasRole = scope.role.length > 0;
      const hasFarm = !isBlankScopeValue(scope.farm);
      return hasRole !== hasFarm;
    });
    if (hasIncompleteRoleScope || !hasAtLeastOneValidRoleScope) {
      void showAlert({
        icon: 'warning',
        title: 'ข้อมูลไม่ครบ',
        text: 'ต้องกำหนด Role และ Scope (ฟาร์ม) ให้ครบอย่างน้อย 1 รายการก่อนบันทึก',
      });
      return;
    }

    const roleScopeKeys = normalizedRoleScopes
      .filter((scope) => scope.role.length > 0 && !isBlankScopeValue(scope.farm))
      .map((scope) => buildRoleScopeKey(scope));
    if (new Set(roleScopeKeys).size !== roleScopeKeys.length) {
      void showAlert({
        icon: 'warning',
        title: 'รายการซ้ำ',
        text: 'Role + Scope ซ้ำกันในผู้ใช้คนเดียว กรุณาลบหรือเปลี่ยนรายการที่ซ้ำก่อนบันทึก',
      });
      return;
    }

    const normalizedPermissionOverrides = payload.permissionOverrides
      .map((item) => ({
        role: item.role.trim(),
        farm: item.farm.trim(),
        zone: item.zone.trim(),
        house: item.house.trim(),
        allowPermissionCodes: normalizePermissionCodes(item.allowPermissionCodes),
        denyPermissionCodes: normalizePermissionCodes(item.denyPermissionCodes),
      }))
      .filter((item) => item.role.length > 0 && !isBlankScopeValue(item.farm));
    const hasPermissionOverrides = normalizedPermissionOverrides.some(
      (item) => item.allowPermissionCodes.length > 0 || item.denyPermissionCodes.length > 0,
    );

    const targetLabel = payload.username.trim() || payload.email.trim() || 'ผู้ใช้งานนี้';
    const confirmation = await showAlert({
      icon: 'question',
      title: isEdit ? 'ยืนยันบันทึกการแก้ไข?' : 'ยืนยันเพิ่มผู้ใช้งาน?',
      text: isEdit
        ? `คุณต้องการบันทึกการแก้ไขผู้ใช้งาน ${targetLabel} หรือไม่`
        : `คุณต้องการเพิ่มผู้ใช้งาน ${targetLabel} หรือไม่`,
      showCancelButton: true,
      confirmButtonText: 'ยืนยัน',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: primary,
    });
    if (!confirmation.isConfirmed) {
      return;
    }

    setIsSavingAssignment(true);
    try {
      const effectivePayload =
        editingAssignment && (!payload.id || !payload.userId)
          ? {
              ...payload,
              id: payload.id ?? editingAssignment.id,
              userId: payload.userId ?? editingAssignment.userId,
            }
          : payload;

      await saveUserAssignment({
        id: effectivePayload.id,
        userId: effectivePayload.userId,
        avatar: effectivePayload.avatar,
        username: effectivePayload.username,
        firstName: effectivePayload.firstName,
        lastName: effectivePayload.lastName,
        email: effectivePayload.email,
        organization: effectivePayload.organization,
        roleScopes: normalizedRoleScopes,
        permissionOverrides: normalizedPermissionOverrides,
      });
      if (hasPermissionOverrides) {
        setPermissionCountRefreshTick((previous) => previous + 1);
      }
      await reloadWorkspace();

      setDialogOpen(false);
      setEditingAssignment(null);
      setRolePermissionCodes([]);
      setRolePermissionsByRoleName({});
      setInitialScopePermissionOverrides([]);
      setAssignablePermissionCodes([]);
      setPermissionMenuSlugByCode({});
      setMenuListLabelBySlug({});
      setMenuGroupLabelByMenuListSlug({});
      setMenuGroupOrderByMenuListSlug({});
      setMenuListOrderBySlug({});

      void showAlert({
        icon: 'success',
        title: 'บันทึกสำเร็จ',
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      void showAlert({
        icon: 'error',
        title: 'บันทึกไม่สำเร็จ',
        text: extractErrorMessage(error) || 'ไม่สามารถบันทึกข้อมูลได้ โปรดลองอีกครั้ง',
      });
    } finally {
      setIsSavingAssignment(false);
    }
  };

  return (
    <Box
      sx={{
        height: 'calc(100dvh - 52px)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        p: { xs: 2, md: 3 },
        bgcolor: pageBg,
      }}
    >
      <UserAssignmentSectionLayout
        activeKey={activeTabKey}
        onTabChange={handleTabChange}
      >
        {activeTabKey === 'assignment' ? (
          <ContentCard
            borderColor={border}
            backgroundColor={surface}
            sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
          >
            <Box
              sx={{
                flex: 1,
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Toolbar */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  mb: 2.5,
                  flexWrap: 'wrap',
                }}
              >
                <SearchField
                  placeholder="ค้นหาชื่อผู้ใช้, ชื่อ-นามสกุล หรือแผนก..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  sx={{
                    flex: 1,
                    minWidth: { xs: '100%', md: 320 },
                    maxWidth: { md: 480 },
                  }}
                />

                <Button
                  variant="outlined"
                  startIcon={<FilterList fontSize="small" />}
                  onClick={() => setFilterDialogOpen(true)}
                  sx={{
                    minHeight: 40,
                    textTransform: 'none',
                    borderColor:
                      Object.keys(filterState).length > 0 ? primary : border,
                    color:
                      Object.keys(filterState).length > 0
                        ? primary
                        : textSecondary,
                    '&:hover': {
                      borderColor: primary,
                      bgcolor: alpha(primary, 0.04),
                    },
                  }}
                >
                  ตัวกรอง
                  {Object.keys(filterState).length > 0 &&
                    ` (${Object.keys(filterState).length})`}
                </Button>

                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => {
                    setEditingAssignment(null);
                    setDialogOpen(true);
                  }}
                  sx={{
                    ml: { md: 'auto' },
                    minWidth: 140,
                    minHeight: 40,
                    textTransform: 'none',
                    fontWeight: 700,
                    bgcolor: primary,
                    boxShadow: `0 4px 12px ${alpha(primary, 0.2)}`,
                    '&:hover': {
                      bgcolor: theme.palette.primary.dark,
                      boxShadow: `0 6px 16px ${alpha(primary, 0.3)}`,
                    },
                  }}
                >
                  กำหนดสิทธิผู้ใช้
                </Button>
              </Box>

              {/* Data Table */}
              <DataTable<AssignmentTableRow>
                columns={tableColumns}
                data={tableRows}
                totalCount={filteredAssignments.length}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={setPage}
                onRowsPerPageChange={(value) => {
                  setRowsPerPage(value);
                  setPage(0);
                }}
                loading={isPageAssignmentsLoading || (!isHydrated && dataSource === 'server')}
                rowsPerPageOptions={[25, 50, 100]}
                footerSummaryText={`ทั้งหมด ${filteredAssignments.length} รายการ`}
                stickyHeader
                sortable={false}
                emptyMessage="ไม่พบข้อมูลกำหนดสิทธิผู้ใช้"
                lockEntityColumns
                includeCodeColumn={false}
                includeStatusColumn={false}
                includeManagementColumn
                onEditRow={
                  canUpdateUser
                    ? (row) => {
                        const assignment = assignmentById.get(row._dbId);
                        if (assignment) {
                          handleEdit(assignment);
                        }
                      }
                    : undefined
                }
                onDeleteRow={
                  canDeleteUser
                    ? (row) => {
                        void handleDelete(row._dbId);
                      }
                    : undefined
                }
                paperSx={{
                  flex: 1,
                  minHeight: 0,
                  borderRadius: 1.25,
                  borderColor: border,
                  bgcolor: surface,
                  display: 'flex',
                  flexDirection: 'column',
                }}
                tableContainerSx={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  scrollbarGutter: 'auto',
                  scrollbarWidth: 'thin',
                  scrollbarColor: `${alpha(textMuted, 0.6)} ${alpha(border, 0.08)}`,
                  '&::-webkit-scrollbar': { width: 8, height: 8 },
                  '&::-webkit-scrollbar-track': {
                    backgroundColor: alpha(border, 0.08),
                    borderLeft: `1px solid ${alpha(border, 0.45)}`,
                    borderRadius: 999,
                    marginBlock: 6,
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: alpha(textMuted, 0.58),
                    borderRadius: 999,
                    border: `1px solid ${alpha(surface, 0.65)}`,
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    backgroundColor: alpha(textMuted, 0.75),
                  },
                }}
                tableSx={{
                  tableLayout: 'fixed',
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  '& .MuiTableCell-root': { px: 1.25 },
                  '& .MuiTableHead-root .MuiTableCell-root': {
                    borderBottom: `1px solid ${border}`,
                    color: textPrimary,
                    fontSize: '13px',
                  },
                  '& .MuiTableBody-root .MuiTableCell-root': {
                    borderBottom: `1px solid ${border}`,
                    color: textSecondary,
                    fontSize: '12px',
                    verticalAlign: 'top',
                  },
                  '& .MuiTableHead-root .MuiTableCell-root:not(:last-of-type), & .MuiTableBody-root .MuiTableCell-root:not(:last-of-type)': {
                    borderRight: `1px solid ${border}`,
                  },
                }}
              />
            </Box>
          </ContentCard>
        ) : (
          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {activeTabKey === 'user' && <UserPage />}
            {activeTabKey === 'role' && <RolePage />}
            {activeTabKey === 'permission-pool' && <PermissionPage />}
            {activeTabKey === 'organization' && <OrganizationPage />}
          </Box>
        )}
      </UserAssignmentSectionLayout>

      <AddUserDialog
        open={dialogOpen}
        onClose={() => {
          if (isBusy) return;
          setDialogOpen(false);
          setEditingAssignment(null);
          setRolePermissionCodes([]);
          setRolePermissionsByRoleName({});
          setInitialScopePermissionOverrides([]);
          setAssignablePermissionCodes([]);
          setPermissionMenuSlugByCode({});
          setMenuListLabelBySlug({});
          setMenuGroupLabelByMenuListSlug({});
          setMenuGroupOrderByMenuListSlug({});
          setMenuListOrderBySlug({});
        }}
        onSave={(payload) => {
          void handleSaveAssignment(payload);
        }}
        initialAssignment={editingAssignment}
        assignedUserIds={assignedUserIds}
        roleOptions={selectableRoleNames}
        roleCatalog={roleCatalog}
        farmCatalog={farmCatalog}
        zoneCatalog={zoneCatalog}
        houseCatalog={houseCatalog}
        permissionsLoading={permissionsLoading}
        rolePermissionCodes={rolePermissionCodes}
        rolePermissionsByRoleName={rolePermissionsByRoleName}
        initialScopePermissionOverrides={initialScopePermissionOverrides}
        assignablePermissionCodes={assignablePermissionCodes}
        permissionMenuSlugByCode={permissionMenuSlugByCode}
        menuListLabelBySlug={menuListLabelBySlug}
        menuGroupLabelByMenuListSlug={menuGroupLabelByMenuListSlug}
        menuGroupOrderByMenuListSlug={menuGroupOrderByMenuListSlug}
        menuListOrderBySlug={menuListOrderBySlug}
        saving={isBusy}
      />

      <AssignmentFilterDialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        onApply={(nextState) => setFilterState(nextState)}
        filterState={filterState}
        companies={companies}
        roles={roles}
        farms={farms}
        zones={zones}
        houses={houses}
      />
    </Box>
  );
}
