'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  DialogTitleWithClose,
  type FilterableSelectFieldOption,
} from '@/components/common';
import {
  getOrLoadClientQueryCache,
  readClientQueryCache,
} from '@/lib/client-query-cache';

import { splitPermissionCode } from '@/lib/access/permission-code';
import {
  Add,
  Business,
  Check,
  Delete,
  ExpandMore,
  MailOutline,
  PersonOutline,
  Search,
  Settings,
} from '@mui/icons-material';
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  Divider,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  FormControl,
  InputLabel,
  ListSubheader,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import PermissionMatrixEditor, {
  type PermissionMatrixFilterOption,
} from './PermissionMatrixEditor';
import PermissionStatsSummary from './PermissionStatsSummary';
import type {
  AssignmentDialogPayload,
  UserResponse,
  FarmCatalogItem,
  HouseCatalogItem,
  ZoneCatalogItem,
  RoleCatalogItem,
  RoleScope,
  ScopePermissionOverrideInput,
  UserAssignment,
} from '../types';
import {
  createEmptyRoleScope,
  toUniqueSelectOptions,
} from '../utils';
import {
  buildPermissionActionOrder,
  formatPermissionActionLabel,
} from '../utils/permission-actions';
import { userService } from '../services';

type ScopePermissionSelection = ScopePermissionOverrideInput;
type PermissionFilterState = 'all' | 'effective' | 'base' | 'modified';
type ScopeModulePermissionItem = {
  code: string;
  moduleCode: string;
  action: string;
  fromRole: boolean;
  allowSelected: boolean;
  denySelected: boolean;
  initialAllowSelected: boolean;
  initialDenySelected: boolean;
  assignable: boolean;
};

type ScopePermissionModuleGroup = {
  moduleCode: string;
  moduleSlug: string;
  moduleLabel: string;
  sectionLabel: string;
  sectionOrder: number;
  moduleOrder: number;
  rows: ScopeModulePermissionItem[];
};

type ScopePermissionSectionGroup = {
  sectionKey: string;
  sectionLabel: string;
  sectionOrder: number;
  modules: ScopePermissionModuleGroup[];
};

type AddUserDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (payload: AssignmentDialogPayload) => void;
  saving?: boolean;
  initialAssignment: UserAssignment | null;
  assignedUserIds?: number[];
  roleOptions: string[];
  roleCatalog: RoleCatalogItem[];
  farmCatalog: FarmCatalogItem[];
  zoneCatalog: ZoneCatalogItem[];
  houseCatalog: HouseCatalogItem[];
  permissionsLoading?: boolean;
  rolePermissionCodes?: string[];
  rolePermissionsByRoleName?: Record<string, string[]>;
  initialScopePermissionOverrides?: ScopePermissionOverrideInput[];
  assignablePermissionCodes?: string[];
  permissionMenuSlugByCode?: Record<string, string>;
  menuListLabelBySlug?: Record<string, string>;
  menuGroupLabelByMenuListSlug?: Record<string, string>;
  menuGroupOrderByMenuListSlug?: Record<string, number>;
  menuListOrderBySlug?: Record<string, number>;
};

function normalizePermissionList(codes: string[]): string[] {
  return Array.from(
    new Set(
      codes
        .map((item) => normalizePermissionCodeForScope(item))
        .filter((item): item is string => Boolean(item)),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

function buildEmptyScopePermissionSelection(): ScopePermissionSelection {
  return {
    allowPermissionCodes: [],
    denyPermissionCodes: [],
  };
}

function hasSelectedScopeValue(value: string | undefined): boolean {
  const normalized = (value ?? '').trim();
  return normalized.length > 0 && normalized !== '-';
}

const USERNAME_MAX_LENGTH = 50;

const USER_ASSIGNMENT_DIALOG_USERS_CACHE_KEY = 'user-assignment-dialog:users';

const SCOPE_PERMISSION_FILTER_OPTIONS: PermissionMatrixFilterOption[] = [
  { value: 'all', label: 'แสดงทั้งหมด' },
  { value: 'effective', label: 'สิทธิหลังปรับแต่ง' },
  { value: 'base', label: 'สิทธิก่อนปรับแต่ง' },
  { value: 'modified', label: 'เฉพาะส่วนที่มีการเพิ่มลด' },
];

const FALLBACK_SCOPE_SECTION_LABEL = 'ไม่พบในเมนู';
const UNMAPPED_PERMISSION_MENU_SLUG = '__unmapped_permissions';

function normalizeScopePermissionSelection(
  selection: ScopePermissionOverrideInput | undefined,
): ScopePermissionSelection {
  return {
    allowPermissionCodes: normalizePermissionList(selection?.allowPermissionCodes ?? []),
    denyPermissionCodes: normalizePermissionList(selection?.denyPermissionCodes ?? []),
  };
}

function ensureScopePermissionSelectionLength(
  selections: ScopePermissionSelection[],
  targetLength: number,
): ScopePermissionSelection[] {
  if (selections.length === targetLength) {
    return selections;
  }
  if (selections.length > targetLength) {
    return selections.slice(0, targetLength);
  }
  return [
    ...selections,
    ...Array.from({ length: targetLength - selections.length }, () =>
      buildEmptyScopePermissionSelection(),
    ),
  ];
}

function isActiveScopeStatus(status: string | undefined): boolean {
  const normalized = (status ?? '').trim().toLowerCase();
  return normalized === 'active' || normalized === 'ใช้งาน';
}

function hasAnySelection(selections: ScopePermissionSelection[]): boolean {
  return selections.some(
    (selection) =>
      selection.allowPermissionCodes.length > 0 || selection.denyPermissionCodes.length > 0,
  );
}

function normalizeMenuLookupKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[.\-\s]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizePermissionCodeForScope(code: string): string | null {
  const normalized = code.trim();
  if (!normalized) {
    return null;
  }

  // Preserve the original code structure as much as possible to avoid merging distinct permissions
  return normalized;
}

type PermissionModuleMeta = {
  moduleSlug: string;
  moduleLabel: string;
  sectionLabel: string;
  sectionOrder: number;
  moduleOrder: number;
};

function resolveModuleCodeFromPermissionCode(
  code: string,
  permissionMenuSlugByCode: Record<string, string>,
): string | null {
  const normalizedCode = normalizePermissionCodeForScope(code)?.toLowerCase() ?? '';
  if (!normalizedCode) {
    return null;
  }

  return permissionMenuSlugByCode[normalizedCode] || null;
}

function createUnmappedModuleMeta(): PermissionModuleMeta {
  return {
    moduleSlug: UNMAPPED_PERMISSION_MENU_SLUG,
    moduleLabel: FALLBACK_SCOPE_SECTION_LABEL,
    sectionLabel: FALLBACK_SCOPE_SECTION_LABEL,
    sectionOrder: Number.MAX_SAFE_INTEGER,
    moduleOrder: Number.MAX_SAFE_INTEGER,
  };
}

function resolveModuleSectionMeta(
  moduleCode: string,
  menuListLabelBySlug: Record<string, string>,
  menuGroupLabelByMenuListSlug: Record<string, string>,
  menuGroupOrderByMenuListSlug: Record<string, number>,
  menuListOrderBySlug: Record<string, number>,
): PermissionModuleMeta | null {
  const normalizedLookupKey = normalizeMenuLookupKey(moduleCode);
  if (!normalizedLookupKey || !menuListLabelBySlug[normalizedLookupKey]) {
    return null;
  }

  const sectionLabel = menuGroupLabelByMenuListSlug[normalizedLookupKey];
  if (!sectionLabel) {
    return null;
  }

  return {
    moduleSlug: normalizedLookupKey,
    moduleLabel: menuListLabelBySlug[normalizedLookupKey],
    sectionLabel,
    sectionOrder: menuGroupOrderByMenuListSlug[normalizedLookupKey] ?? Number.MAX_SAFE_INTEGER,
    moduleOrder: menuListOrderBySlug[normalizedLookupKey] ?? Number.MAX_SAFE_INTEGER,
  };
}

function resolvePermissionModuleMeta(
  permissionCode: string,
  permissionMenuSlugByCode: Record<string, string>,
  menuListLabelBySlug: Record<string, string>,
  menuGroupLabelByMenuListSlug: Record<string, string>,
  menuGroupOrderByMenuListSlug: Record<string, number>,
  menuListOrderBySlug: Record<string, number>,
): PermissionModuleMeta {
  const menuSlug = resolveModuleCodeFromPermissionCode(
    permissionCode,
    permissionMenuSlugByCode,
  );
  if (menuSlug) {
    const meta = resolveModuleSectionMeta(
      menuSlug,
      menuListLabelBySlug,
      menuGroupLabelByMenuListSlug,
      menuGroupOrderByMenuListSlug,
      menuListOrderBySlug,
    );
    if (meta) {
      return meta;
    }
  }

  return createUnmappedModuleMeta();
}

export default function AddUserDialog({
  open,
  onClose,
  onSave,
  saving = false,
  initialAssignment,
  assignedUserIds = [],
  roleOptions,
  roleCatalog,
  farmCatalog,
  zoneCatalog,
  houseCatalog,
  permissionsLoading = false,
  rolePermissionCodes = [],
  rolePermissionsByRoleName = {},
  initialScopePermissionOverrides = [],
  assignablePermissionCodes = [],
  permissionMenuSlugByCode = {},
  menuListLabelBySlug = {},
  menuGroupLabelByMenuListSlug = {},
  menuGroupOrderByMenuListSlug = {},
  menuListOrderBySlug = {},
}: AddUserDialogProps) {
  const theme = useTheme();
  const pageBg = theme.palette.background.default;
  const surface = theme.palette.background.paper;
  const surfaceMuted = alpha(
    theme.palette.background.paper,
    theme.palette.mode === 'dark' ? 0.74 : 0.96,
  );
  const borderStrong = alpha(theme.palette.divider, 0.92);
  const textPrimary = theme.palette.text.primary;
  const textSecondary = theme.palette.text.secondary;
  const primary = theme.palette.primary.main;
  const modalPaperBg = alpha(surface, theme.palette.mode === 'dark' ? 0.98 : 1);
  const modalHeaderBg = alpha(surfaceMuted, theme.palette.mode === 'dark' ? 0.6 : 0.96);
  const modalSectionBg = alpha(pageBg, theme.palette.mode === 'dark' ? 0.62 : 0.4);
  const modalInputBg = alpha(pageBg, theme.palette.mode === 'dark' ? 0.78 : 0.9);
  const cachedUsers = readClientQueryCache<UserResponse[]>(USER_ASSIGNMENT_DIALOG_USERS_CACHE_KEY);
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [catalogUsers, setCatalogUsers] = useState<UserResponse[]>(cachedUsers ?? []);
  const [loadingUsers, setLoadingUsers] = useState(cachedUsers === undefined);
  const [company, setCompany] = useState('');
  const [roleScopes, setRoleScopes] = useState<RoleScope[]>([createEmptyRoleScope()]);
  const [scopePermissionSelections, setScopePermissionSelections] = useState<ScopePermissionSelection[]>([
    buildEmptyScopePermissionSelection(),
  ]);
  const [initialScopePermissionSelections, setInitialScopePermissionSelections] = useState<ScopePermissionSelection[]>([
    buildEmptyScopePermissionSelection(),
  ]);
  const [permissionSearches, setPermissionSearches] = useState<string[]>(['']);
  const [roleSearches, setRoleSearches] = useState<string[]>(['']);
  const [farmSearches, setFarmSearches] = useState<string[]>(['']);
  const [zoneSearches, setZoneSearches] = useState<string[]>(['']);
  const [houseSearches, setHouseSearches] = useState<string[]>(['']);
  const [scopePermissionFilters, setScopePermissionFilters] = useState<PermissionFilterState[]>([
    'all',
  ]);
  const [scopeExpandedModules, setScopeExpandedModules] = useState<string[][]>([[]]);
  const [scopeEntryIds, setScopeEntryIds] = useState<number[]>([1]);
  const scopeEntryIdRef = useRef(2);

  const roleSelectOptions = useMemo<FilterableSelectFieldOption[]>(
    () => {
      const roleNamesInCatalog = new Set(roleCatalog.map((item) => item.name));
      const currentAssignmentRoleNames =
        initialAssignment?.roleScopes
          .map((scope) => scope.role.trim())
          .filter((value) => value.length > 0) ?? [];
      return toUniqueSelectOptions([
        ...roleCatalog.map((item) => ({
          value: item.name,
          label: item.name,
          meta: {
            code: item.code,
          },
        })),
        ...roleOptions
          .filter((item) => !roleNamesInCatalog.has(item))
          .map((item) => ({
            value: item,
            label: item,
            meta: {
              code: '',
            },
          })),
        ...currentAssignmentRoleNames
          .filter((item) => !roleNamesInCatalog.has(item))
          .map((item) => ({
            value: item,
            label: item,
            meta: {
              code: '',
            },
          })),
      ]);
    },
    [initialAssignment, roleCatalog, roleOptions],
  );

  const roleCodeByName = useMemo(() => {
    const next: Record<string, string> = {};
    roleCatalog.forEach((item) => {
      const roleNameKey = item.name.trim().toLowerCase();
      const roleCodeKey = item.code.trim().toLowerCase();
      if (roleNameKey && roleCodeKey) {
        next[roleNameKey] = roleCodeKey;
      }
    });
    return next;
  }, [roleCatalog]);

  const farmSelectOptions = useMemo<FilterableSelectFieldOption[]>(
    () => {
      const activeFarmCatalog = farmCatalog.filter((item) => isActiveScopeStatus(item.status));
      return toUniqueSelectOptions([
        ...activeFarmCatalog.map((item) => ({
          value: item.name,
          label: item.name,
          caption: `${item.location} / ${item.status}`,
          meta: { location: item.location, status: item.status },
        })),
      ]);
    },
    [farmCatalog],
  );

  const zoneSelectOptions = useMemo<FilterableSelectFieldOption[]>(
    () => {
      const activeZoneCatalog = zoneCatalog.filter((item) => isActiveScopeStatus(item.status));
      return toUniqueSelectOptions(
        [
          ...activeZoneCatalog.map((item) => ({
            value: item.name,
            label: item.name,
            caption: `${item.farmName} / ${item.status}`,
            meta: { farm: item.farmName, status: item.status },
          })),
        ],
        (option) => `${option.value}::${option.meta?.farm ?? ''}`,
      );
    },
    [zoneCatalog],
  );
  const zoneSelectOptionsWithNone = useMemo<FilterableSelectFieldOption[]>(
    () => [{ value: '', label: 'None' }, ...zoneSelectOptions],
    [zoneSelectOptions],
  );

  const houseSelectOptions = useMemo<FilterableSelectFieldOption[]>(
    () => {
      const activeHouseCatalog = houseCatalog.filter((item) => isActiveScopeStatus(item.status));
      return toUniqueSelectOptions(
        [
          ...activeHouseCatalog.map((item) => ({
            value: item.name,
            label: item.name,
            caption: `${item.farmName} / ${item.zoneName} / ${item.status}`,
            meta: {
              farm: item.farmName,
              zone: item.zoneName,
              status: item.status,
            },
          })),
        ],
        (option) =>
          `${option.value}::${option.meta?.farm ?? ''}::${option.meta?.zone ?? ''}`,
      );
    },
    [houseCatalog],
  );
  const selectedCatalogUser = useMemo(
    () => catalogUsers.find((user) => user.username === username) ?? null,
    [catalogUsers, username],
  );
  const availableCatalogUsers = useMemo(() => {
    if (initialAssignment?.userId) {
      return catalogUsers.filter(
        (user) => user.id === initialAssignment.userId || !assignedUserIds.includes(user.id),
      );
    }

    return catalogUsers.filter((user) => !assignedUserIds.includes(user.id));
  }, [assignedUserIds, catalogUsers, initialAssignment]);

  const houseSelectOptionsWithNone = useMemo<FilterableSelectFieldOption[]>(
    () => [{ value: '', label: 'None' }, ...houseSelectOptions],
    [houseSelectOptions],
  );

  useEffect(() => {
    let active = true;

    if (!cachedUsers) {
      void getOrLoadClientQueryCache(
        USER_ASSIGNMENT_DIALOG_USERS_CACHE_KEY,
        () => userService.users.getAll(),
      )
        .then((rows) => {
          if (!active) {
            return;
          }
          setCatalogUsers(rows);
          setLoadingUsers(false);
        })
        .catch((error) => {
          if (!active) {
            return;
          }
          console.error(error);
          setLoadingUsers(false);
        });
    }

    return () => {
      active = false;
    };
  }, [cachedUsers]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const cachedUserRows = readClientQueryCache<UserResponse[]>(
      USER_ASSIGNMENT_DIALOG_USERS_CACHE_KEY,
    );
    if (cachedUserRows) {
      setCatalogUsers(cachedUserRows);
      setLoadingUsers(false);
    } else {
      setLoadingUsers(true);
      void getOrLoadClientQueryCache(
        USER_ASSIGNMENT_DIALOG_USERS_CACHE_KEY,
        () => userService.users.getAll(),
      )
        .then((rows) => setCatalogUsers(rows))
        .catch(console.error)
        .finally(() => setLoadingUsers(false));
    }

    setRoleScopes((previous) => {
      let hasChanges = false;
      const next = previous.map((scope) => {
        let nextScope = { ...scope };

        const farmIsValid =
          !nextScope.farm ||
          farmSelectOptions.some((option) => option.value === nextScope.farm);
        if (!farmIsValid) {
          hasChanges = true;
          nextScope = {
            ...nextScope,
            farm: '',
            zone: '',
            house: '',
          };
          return nextScope;
        }

        const zoneIsValid =
          !nextScope.zone ||
          zoneSelectOptions.some(
            (option) =>
              option.value === nextScope.zone &&
              (!nextScope.farm || option.meta?.farm === nextScope.farm),
          );
        if (!zoneIsValid) {
          hasChanges = true;
          nextScope = {
            ...nextScope,
            zone: '',
            house: '',
          };
          return nextScope;
        }

        const houseIsValid =
          !nextScope.house ||
          houseSelectOptions.some(
            (option) =>
              option.value === nextScope.house &&
              (!nextScope.farm || option.meta?.farm === nextScope.farm) &&
              (!nextScope.zone || option.meta?.zone === nextScope.zone),
          );
        if (!houseIsValid) {
          hasChanges = true;
          nextScope = {
            ...nextScope,
            house: '',
          };
        }

        return nextScope;
      });

      return hasChanges ? next : previous;
    });
  }, [open, farmSelectOptions, zoneSelectOptions, houseSelectOptions]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (!initialAssignment) {
      setUsername('');
      setFirstName('');
      setLastName('');
      setEmail('');
      setCompany('');
      setRoleScopes([createEmptyRoleScope()]);
      setScopePermissionSelections([buildEmptyScopePermissionSelection()]);
      setInitialScopePermissionSelections([buildEmptyScopePermissionSelection()]);
      setPermissionSearches(['']);
      setRoleSearches(['']);
      setFarmSearches(['']);
      setZoneSearches(['']);
      setHouseSearches(['']);
      setScopePermissionFilters(['all']);
      setScopeExpandedModules([[]]);
      setScopeEntryIds([1]);
      scopeEntryIdRef.current = 2;
      return;
    }

    const matchedCatalogUser =
      catalogUsers.find((user) => user.id === initialAssignment.userId) ?? null;
    const nameParts = initialAssignment.name.trim().split(/\s+/).filter(Boolean);
    const initialFirstName =
      matchedCatalogUser?.firstName ??
      initialAssignment.firstName ??
      nameParts[0] ??
      '';
    const initialLastName =
      matchedCatalogUser?.lastName ??
      initialAssignment.lastName ??
      nameParts.slice(1).join(' ');
    const fallbackUsername = initialAssignment.email.split('@')[0] ?? '';
    const initialUsername =
      matchedCatalogUser?.username ??
      initialAssignment.username?.trim() ??
      fallbackUsername;

    setUsername(initialUsername);
    setFirstName(initialFirstName);
    setLastName(initialLastName);
    setEmail(matchedCatalogUser?.email ?? initialAssignment.email);
    setCompany(matchedCatalogUser?.companyName ?? initialAssignment.organization.company);
    const nextRoleScopes = initialAssignment.roleScopes.length
      ? initialAssignment.roleScopes.map((scope) => ({ ...scope }))
      : [createEmptyRoleScope()];
    const normalizedInitialSelections = ensureScopePermissionSelectionLength(
      nextRoleScopes.map(() => buildEmptyScopePermissionSelection()),
      nextRoleScopes.length,
    );
    setRoleScopes(nextRoleScopes);
    setScopePermissionSelections(normalizedInitialSelections);
    setInitialScopePermissionSelections(normalizedInitialSelections);
    setPermissionSearches(Array.from({ length: nextRoleScopes.length }, () => ''));
    setRoleSearches(Array.from({ length: nextRoleScopes.length }, () => ''));
    setFarmSearches(Array.from({ length: nextRoleScopes.length }, () => ''));
    setZoneSearches(Array.from({ length: nextRoleScopes.length }, () => ''));
    setHouseSearches(Array.from({ length: nextRoleScopes.length }, () => ''));
    setScopePermissionFilters(Array.from({ length: nextRoleScopes.length }, () => 'all'));
    setScopeExpandedModules(Array.from({ length: nextRoleScopes.length }, () => []));
    const nextScopeEntryIds = Array.from({ length: nextRoleScopes.length }, (_, index) => index + 1);
    setScopeEntryIds(nextScopeEntryIds);
    scopeEntryIdRef.current = nextScopeEntryIds.length + 1;
  }, [catalogUsers, open, initialAssignment]);

  useEffect(() => {
    if (!open || !initialAssignment) {
      return;
    }
    if (initialScopePermissionOverrides.length === 0) {
      return;
    }

    const normalizedOverrideSelections = ensureScopePermissionSelectionLength(
      Array.from({ length: roleScopes.length }, (_, index) =>
        normalizeScopePermissionSelection(initialScopePermissionOverrides[index]),
      ),
      roleScopes.length,
    );

    setInitialScopePermissionSelections(normalizedOverrideSelections);
    setScopePermissionSelections((previous) => {
      const normalizedPrevious = ensureScopePermissionSelectionLength(previous, roleScopes.length);
      if (hasAnySelection(normalizedPrevious)) {
        return normalizedPrevious;
      }
      return normalizedOverrideSelections;
    });
  }, [open, initialAssignment, initialScopePermissionOverrides, roleScopes.length]);

  const handleAddRoleScope = () => {
    const nextScopeEntryId = scopeEntryIdRef.current;
    scopeEntryIdRef.current += 1;

    setRoleScopes((previous) => [...previous, createEmptyRoleScope()]);
    setScopePermissionSelections((previous) => [
      ...previous,
      buildEmptyScopePermissionSelection(),
    ]);
    setInitialScopePermissionSelections((previous) => [
      ...previous,
      buildEmptyScopePermissionSelection(),
    ]);
    setPermissionSearches((previous) => [...previous, '']);
    setRoleSearches((previous) => [...previous, '']);
    setFarmSearches((previous) => [...previous, '']);
    setZoneSearches((previous) => [...previous, '']);
    setHouseSearches((previous) => [...previous, '']);
    setScopePermissionFilters((previous) => [...previous, 'all']);
    setScopeExpandedModules((previous) => [...previous, []]);
    setScopeEntryIds((previous) => [...previous, nextScopeEntryId]);
  };

  const handleRemoveRoleScope = (index: number) => {
    setRoleScopes((previous) => {
      if (previous.length <= 1) {
        return previous;
      }
      return previous.filter((_, itemIndex) => itemIndex !== index);
    });
    setScopePermissionSelections((previous) => {
      if (previous.length <= 1) {
        return previous;
      }
      return previous.filter((_, itemIndex) => itemIndex !== index);
    });
    setInitialScopePermissionSelections((previous) => {
      if (previous.length <= 1) {
        return previous;
      }
      return previous.filter((_, itemIndex) => itemIndex !== index);
    });
    setPermissionSearches((previous) => {
      if (previous.length <= 1) {
        return previous;
      }
      return previous.filter((_, itemIndex) => itemIndex !== index);
    });
    setRoleSearches((previous) => {
      if (previous.length <= 1) {
        return previous;
      }
      return previous.filter((_, itemIndex) => itemIndex !== index);
    });
    setFarmSearches((previous) => {
      if (previous.length <= 1) {
        return previous;
      }
      return previous.filter((_, itemIndex) => itemIndex !== index);
    });
    setZoneSearches((previous) => {
      if (previous.length <= 1) {
        return previous;
      }
      return previous.filter((_, itemIndex) => itemIndex !== index);
    });
    setHouseSearches((previous) => {
      if (previous.length <= 1) {
        return previous;
      }
      return previous.filter((_, itemIndex) => itemIndex !== index);
    });
    setScopePermissionFilters((previous) => {
      if (previous.length <= 1) {
        return previous;
      }
      return previous.filter((_, itemIndex) => itemIndex !== index);
    });
    setScopeExpandedModules((previous) => {
      if (previous.length <= 1) {
        return previous;
      }
      return previous.filter((_, itemIndex) => itemIndex !== index);
    });
    setScopeEntryIds((previous) => {
      if (previous.length <= 1) {
        return previous;
      }
      return previous.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  useEffect(() => {
    setScopeEntryIds((previous) => {
      if (previous.length === roleScopes.length) {
        return previous;
      }
      if (previous.length > roleScopes.length) {
        return previous.slice(0, roleScopes.length);
      }
      const next = [...previous];
      while (next.length < roleScopes.length) {
        next.push(scopeEntryIdRef.current);
        scopeEntryIdRef.current += 1;
      }
      return next;
    });
  }, [roleScopes.length]);

  const handleRoleScopeChange = (index: number, field: keyof RoleScope, value: string) => {
    setRoleScopes((previous) =>
      previous.map((scope, itemIndex) => {
        if (itemIndex !== index) {
          return scope;
        }

        const nextScope = { ...scope, [field]: value };

        if (field === 'farm' && value !== scope.farm) {
          nextScope.zone = '';
          nextScope.house = '';
        }

        if (field === 'zone' && value !== scope.zone) {
          nextScope.house = '';
        }

        return nextScope;
      }),
    );
  };

  const normalizedRoleScopesForValidation = roleScopes.map((scope) => ({
    role: scope.role.trim(),
    farm: scope.farm.trim(),
    zone: scope.zone.trim(),
    house: scope.house.trim(),
  }));
  const hasValidRoleScope = normalizedRoleScopesForValidation.some(
    (scope) => scope.role.length > 0 && hasSelectedScopeValue(scope.farm),
  );
  const hasIncompleteRoleScopeEntry = normalizedRoleScopesForValidation.some((scope) => {
    const hasRole = scope.role.length > 0;
    const hasFarm = hasSelectedScopeValue(scope.farm);
    return hasRole !== hasFarm;
  });
  const validRoleScopeKeys = normalizedRoleScopesForValidation
    .filter((scope) => scope.role.length > 0 && hasSelectedScopeValue(scope.farm))
    .map((scope) =>
      [
        scope.role,
        scope.farm,
        scope.zone || '-',
        scope.house || '-',
      ].map((value) => normalizeMenuLookupKey(value)).join('::'),
    );
  const hasDuplicateRoleScopeEntry =
    new Set(validRoleScopeKeys).size !== validRoleScopeKeys.length;
  const normalizedUsername = username.trim();
  const normalizedFirstName = firstName.trim();
  const normalizedLastName = lastName.trim();
  const normalizedEmail = email.trim();
  const normalizedCompany = company.trim();
  const profileDisplayName = [normalizedFirstName, normalizedLastName].filter(Boolean).join(' ');
  const hasSelectedUserProfile = Boolean(
    normalizedUsername ||
    normalizedFirstName ||
    normalizedLastName ||
    normalizedEmail ||
    normalizedCompany,
  );
  const profileInitials = (profileDisplayName || normalizedUsername || '-')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((segment) => segment.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2) || '-';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const usernameError =
    !normalizedUsername
      ? 'กรุณากรอกชื่อผู้ใช้'
      : normalizedUsername.length > USERNAME_MAX_LENGTH
        ? `ชื่อผู้ใช้ต้องไม่เกิน ${USERNAME_MAX_LENGTH} ตัวอักษร`
        : '';

  const firstNameError = !normalizedFirstName ? 'กรุณากรอกชื่อ' : '';
  const lastNameError = !normalizedLastName ? 'กรุณากรอกนามสกุล' : '';
  const emailError =
    !normalizedEmail
      ? 'กรุณากรอกอีเมล'
      : !emailPattern.test(normalizedEmail)
        ? 'รูปแบบอีเมลไม่ถูกต้อง'
        : '';
  const companyError = !normalizedCompany ? 'กรุณากรอกชื่อบริษัท' : '';
  const roleScopeError = hasIncompleteRoleScopeEntry
    ? 'ทุกรายการต้องระบุ Role + ฟาร์ม ให้ครบ (หรือกดลบรายการที่ไม่ใช้)'
    : hasDuplicateRoleScopeEntry
      ? 'มีรายการ Role + Scope ซ้ำกัน กรุณาลบหรือเปลี่ยนรายการที่ซ้ำ'
      : hasValidRoleScope
        ? ''
        : 'ต้องมีอย่างน้อย 1 รายการที่ระบุ Role และฟาร์ม';
  const scopeFieldSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: modalInputBg,
      color: textPrimary,
      borderRadius: 10,
      '& fieldset': { borderColor: borderStrong },
      '&:hover fieldset': { borderColor: alpha(primary, 0.7) },
      '&.Mui-focused fieldset': { borderColor: primary },
      '&.Mui-disabled': { bgcolor: alpha(modalInputBg, 0.62) },
    },
    '& .MuiInputLabel-root': { color: textSecondary },
    '& .MuiInputLabel-root.Mui-focused': { color: primary },
    '& .MuiInputLabel-root.Mui-disabled': { color: alpha(textSecondary, 0.55) },
    '& .MuiSvgIcon-root': { color: textSecondary },
    '& .MuiSelect-select.Mui-disabled': { WebkitTextFillColor: alpha(textSecondary, 0.55) },
  } as const;
  const scopeCompactSelectSx = {
    borderRadius: 10,
    '& .MuiSelect-select': {
      py: 1,
      fontSize: '0.95rem',
      lineHeight: 1.35,
    },
  } as const;
  const formValid =
    !usernameError &&
    !firstNameError &&
    !lastNameError &&
    !emailError &&
    !companyError &&
    !roleScopeError;

  const assignablePermissionSet = useMemo(
    () => new Set(assignablePermissionCodes.map((item) => item.trim())),
    [assignablePermissionCodes],
  );

  const setScopePermissionEffect = (
    scopeIndex: number,
    code: string,
    effect: 'allow' | 'deny' | 'none',
  ) => {
    const normalizedCode = code.trim();
    if (!normalizedCode) {
      return;
    }

    setScopePermissionSelections((previous) => {
      const next = ensureScopePermissionSelectionLength(previous, roleScopes.length).map(
        (selection) => ({
          allowPermissionCodes: [...selection.allowPermissionCodes],
          denyPermissionCodes: [...selection.denyPermissionCodes],
        }),
      );
      const target = next[scopeIndex] ?? buildEmptyScopePermissionSelection();
      const allowSet = new Set(target.allowPermissionCodes.map((item) => item.trim()));
      const denySet = new Set(target.denyPermissionCodes.map((item) => item.trim()));

      if (effect === 'allow') {
        allowSet.add(normalizedCode);
        denySet.delete(normalizedCode);
      } else if (effect === 'deny') {
        denySet.add(normalizedCode);
        allowSet.delete(normalizedCode);
      } else {
        allowSet.delete(normalizedCode);
        denySet.delete(normalizedCode);
      }

      next[scopeIndex] = {
        allowPermissionCodes: Array.from(allowSet).sort((left, right) => left.localeCompare(right)),
        denyPermissionCodes: Array.from(denySet).sort((left, right) => left.localeCompare(right)),
      };
      return next;
    });
  };

  const toggleScopeModule = (scopeIndex: number, moduleCode: string) => {
    setScopeExpandedModules((previous) =>
      previous.map((modules, index) => {
        if (index !== scopeIndex) {
          return modules;
        }
        return modules.includes(moduleCode)
          ? modules.filter((code) => code !== moduleCode)
          : [...modules, moduleCode];
      }),
    );
  };

  const toggleAllScopeModules = (scopeIndex: number, moduleCodes: string[]) => {
    const uniqueModuleCodes = Array.from(new Set(moduleCodes));
    setScopeExpandedModules((previous) =>
      previous.map((modules, index) => {
        if (index !== scopeIndex) {
          return modules;
        }
        const expandedAll =
          uniqueModuleCodes.length > 0 &&
          uniqueModuleCodes.every((moduleCode) => modules.includes(moduleCode));
        return expandedAll ? [] : uniqueModuleCodes;
      }),
    );
  };

  const resetScopeCustomization = (scopeIndex: number) => {
    setScopePermissionSelections((previous) =>
      previous.map((selection, index) =>
        index === scopeIndex ? buildEmptyScopePermissionSelection() : selection,
      ),
    );
    setScopePermissionFilters((previous) =>
      previous.map((value, index) => (index === scopeIndex ? 'all' : value)),
    );
    setPermissionSearches((previous) =>
      previous.map((value, index) => (index === scopeIndex ? '' : value)),
    );
  };

  const setScopeFilterState = (scopeIndex: number, nextState: PermissionFilterState) => {
    setScopePermissionFilters((previous) =>
      previous.map((value, index) => (index === scopeIndex ? nextState : value)),
    );
  };

  const getScrollbarStyles = (maxHeightValue: number) => ({
    maxHeight: maxHeightValue,
    overflowY: 'auto',
    overflowX: 'hidden',
    boxSizing: 'border-box',
    scrollbarGutter: 'stable',
    scrollbarWidth: 'thin',
    scrollbarColor: `${alpha(theme.palette.primary.main, 0.52)} ${alpha(
      theme.palette.background.default,
      0.46,
    )}`,
    '&::-webkit-scrollbar': { width: '8px' },
    '&::-webkit-scrollbar-track': {
      background: alpha(theme.palette.background.default, 0.46),
      borderRadius: 10,
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: alpha(theme.palette.primary.main, 0.52),
      borderRadius: 10,
      border: `2px solid ${alpha(theme.palette.background.default, 0.46)}`,
      backgroundClip: 'content-box',
    },
    '&::-webkit-scrollbar-thumb:hover': {
      backgroundColor: alpha(theme.palette.primary.main, 0.72),
    },
  });

  const handleSave = () => {
    if (!formValid) {
      return;
    }

    const resolvedEmail = selectedCatalogUser?.email?.trim() || email.trim();
    const resolvedFirstName = selectedCatalogUser?.firstName?.trim() || firstName.trim();
    const resolvedLastName = selectedCatalogUser?.lastName?.trim() || lastName.trim();

    const validScopeEntries = normalizedRoleScopesForValidation
      .map((scope, index) => ({ scope, index }))
      .filter(({ scope }) => scope.role.length > 0 && hasSelectedScopeValue(scope.farm));

    onSave({
      id: initialAssignment?.id,
      userId: initialAssignment?.userId ?? selectedCatalogUser?.id,
      avatar: initialAssignment?.avatar,
      username: username.trim(),
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      email: resolvedEmail,
      organization: {
        company: company.trim(),
      },
      roleScopes: validScopeEntries.map(({ scope }) => scope),
      permissionOverrides: validScopeEntries.map(({ scope, index }) => {
        const scopeSelection = scopePermissionSelections[index] ?? buildEmptyScopePermissionSelection();
        return {
          ...scope,
          allowPermissionCodes: normalizePermissionList(scopeSelection.allowPermissionCodes)
            .filter((code) => assignablePermissionSet.has(code)),
          denyPermissionCodes: normalizePermissionList(scopeSelection.denyPermissionCodes)
            .filter((code) => assignablePermissionSet.has(code)),
        };
      }),
    });
  };

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      maxWidth="md"
      fullWidth
      keepMounted
      PaperProps={{
        sx: {
          borderRadius: 10,
          bgcolor: modalPaperBg,
          border: `1px solid ${borderStrong}`,
          color: textPrimary,
        },
      }}
    >
      <DialogTitleWithClose onClose={onClose} disabled={saving} component="div" sx={{ pb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: textPrimary }}>
          กำหนดสิทธิ
        </Typography>
      </DialogTitleWithClose>

      <Divider />

      <DialogContent
        sx={{
          pt: 3,
          bgcolor: modalPaperBg,
          scrollbarWidth: 'thin',
          scrollbarColor: `${alpha(theme.palette.primary.main, 0.56)} ${alpha(
            theme.palette.background.default,
            0.5,
          )}`,
          '&::-webkit-scrollbar': { width: 10 },
          '&::-webkit-scrollbar-track': {
            background: alpha(theme.palette.background.default, 0.5),
            borderRadius: 10,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(theme.palette.primary.main, 0.56),
            borderRadius: 10,
            border: `2px solid ${alpha(theme.palette.background.default, 0.5)}`,
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: alpha(theme.palette.primary.main, 0.74),
          },
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, color: textPrimary }}>
              1. โปรไฟล์ผู้ใช้
            </Typography>
            <Typography variant="caption" sx={{ color: textSecondary, display: 'block', mb: 1.25 }}>
              เลือกผู้ใช้จากรายการ แล้วระบบจะดึงชื่อ-นามสกุล อีเมล และบริษัทมาให้อัตโนมัติ
            </Typography>
            <Stack spacing={2}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
                <Autocomplete<UserResponse>
                  options={availableCatalogUsers}
                  getOptionLabel={(option: UserResponse) => option.username}
                  value={selectedCatalogUser}
                  onChange={(_event, newValue: UserResponse | null) => {
                    if (newValue) {
                      setUsername(newValue.username);
                      setFirstName(newValue.firstName);
                      setLastName(newValue.lastName);
                      setEmail(newValue.email);
                      setCompany(newValue.companyName);
                    } else {
                      setUsername('');
                      setFirstName('');
                      setLastName('');
                      setEmail('');
                      setCompany('');
                    }
                  }}
                  isOptionEqualToValue={(option, value) => option.id === value.id}
                  autoHighlight
                  openOnFocus
                  loading={loadingUsers}
                  noOptionsText={
                    loadingUsers
                      ? 'กำลังโหลดผู้ใช้...'
                      : 'ไม่มีผู้ใช้ที่พร้อมสำหรับกำหนดสิทธิ'
                  }
                  disabled={Boolean(initialAssignment) || loadingUsers || saving}
                  renderOption={(props, option) => {
                    const { key, ...optionProps } = props;

                    return (
                      <Box
                        component="li"
                        key={key}
                        {...optionProps}
                        sx={{ display: 'flex', flexDirection: 'column', py: 1 }}
                      >
                        <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: textPrimary }}>
                          {option.username}
                        </Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: textSecondary }}>
                          {[option.firstName, option.lastName].filter(Boolean).join(' ') || '-'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: textSecondary }}>
                          {option.email || '-'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.78rem', color: textSecondary }}>
                          {option.companyName || '-'}
                        </Typography>
                      </Box>
                    );
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      size="small"
                      label="ชื่อผู้ใช้"
                      placeholder={loadingUsers ? 'กำลังโหลด...' : 'เลือกชื่อผู้ใช้'}
                      required
                      error={Boolean(usernameError)}
                      helperText={
                        usernameError ||
                        (selectedCatalogUser
                          ? `อีเมล: ${selectedCatalogUser.email || '-'} | บริษัท: ${selectedCatalogUser.companyName || '-'}`
                          : 'แสดงเฉพาะผู้ใช้ที่ยังไม่ถูกกำหนดสิทธิ แล้วระบบจะผูกอีเมลและบริษัทให้อัตโนมัติ')
                      }
                      sx={scopeFieldSx}
                    />
                  )}
                />
              </Box>

              {hasSelectedUserProfile ? (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    borderRadius: 10,
                    borderColor: alpha(primary, 0.14),
                    bgcolor: alpha(surface, theme.palette.mode === 'dark' ? 0.9 : 0.98),
                    backgroundImage: `linear-gradient(135deg, ${alpha(primary, 0.08)} 0%, ${alpha(
                      modalHeaderBg,
                      0.35,
                    )} 100%)`,
                    boxShadow: `inset 0 1px 0 ${alpha('#ffffff', theme.palette.mode === 'dark' ? 0.04 : 0.5)}`,
                  }}
                >
                  <Stack spacing={2}>
                    <Stack
                      direction={{ xs: 'column', sm: 'row' }}
                      spacing={1.5}
                      alignItems={{ xs: 'flex-start', sm: 'center' }}
                    >
                      <Avatar
                        sx={{
                          width: 54,
                          height: 54,
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          bgcolor: alpha(primary, 0.14),
                          color: primary,
                          border: `1px solid ${alpha(primary, 0.18)}`,
                        }}
                      >
                        {profileInitials}
                      </Avatar>
                      <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            color: textSecondary,
                            display: 'block',
                            mb: 0.4,
                            letterSpacing: 0.2,
                          }}
                        >
                          ข้อมูลผู้ใช้ที่เลือก
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: textPrimary,
                            fontWeight: 800,
                            lineHeight: 1.2,
                            mb: 0.6,
                          }}
                        >
                          {profileDisplayName || normalizedUsername || '-'}
                        </Typography>
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.75,
                            px: 1,
                            py: 0.5,
                            borderRadius: 10,
                            bgcolor: alpha(primary, 0.1),
                            border: `1px solid ${alpha(primary, 0.15)}`,
                          }}
                        >
                          <PersonOutline sx={{ fontSize: 15, color: primary }} />
                          <Typography sx={{ color: primary, fontSize: '0.82rem', fontWeight: 700 }}>
                            {normalizedUsername || '-'}
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>

                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                        gap: 1.25,
                      }}
                    >
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 10,
                          bgcolor: alpha(surface, theme.palette.mode === 'dark' ? 0.36 : 0.76),
                          border: `1px solid ${alpha(borderStrong, 0.75)}`,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <MailOutline sx={{ fontSize: 16, color: primary }} />
                          <Typography variant="caption" sx={{ color: textSecondary }}>
                            อีเมล
                          </Typography>
                        </Box>
                        <Typography
                          sx={{
                            color: textPrimary,
                            fontWeight: 600,
                            lineHeight: 1.35,
                            wordBreak: 'break-word',
                          }}
                        >
                          {normalizedEmail || '-'}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 10,
                          bgcolor: alpha(surface, theme.palette.mode === 'dark' ? 0.36 : 0.76),
                          border: `1px solid ${alpha(borderStrong, 0.75)}`,
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Business sx={{ fontSize: 16, color: primary }} />
                          <Typography variant="caption" sx={{ color: textSecondary }}>
                            บริษัท
                          </Typography>
                        </Box>
                        <Typography
                          sx={{
                            color: textPrimary,
                            fontWeight: 600,
                            lineHeight: 1.35,
                          }}
                        >
                          {normalizedCompany || '-'}
                        </Typography>
                      </Box>
                    </Box>
                  </Stack>
                </Paper>
              ) : null}
            </Stack>
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.25 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: textPrimary }}>
                2. บทบาท สิทธิและขอบเขต
              </Typography>
              <Button
                size="small"
                startIcon={<Add />}
                onClick={handleAddRoleScope}
                sx={{ textTransform: 'none', color: primary, fontWeight: 700 }}
              >
                เพิ่มรายการ (อีก 1 ชุด)
              </Button>
            </Box>
            <Typography variant="caption" sx={{ color: textSecondary, display: 'block', mb: 1.25 }}>
              เลือก Role + Scope ได้ตามความลึก Farm → Zone → House, ปรับแต่งสิทธิรายบุคคล (เพิ่ม/ลดจากฐาน Role) และผู้ใช้ 1 คนมีได้หลายชุด
            </Typography>
            {roleScopeError ? (
              <Typography variant="caption" sx={{ display: 'block', mb: 1, color: theme.palette.error.main }}>
                {roleScopeError}
              </Typography>
            ) : null}

            <Stack spacing={2}>
              {roleScopes.map((scope, index) => {
                const scopeEntryId = scopeEntryIds[index] ?? index + 1;
                const scopedZoneOptions = zoneSelectOptionsWithNone.filter((option) => {
                  if (option.value === '') return true;
                  if (!scope.farm) return true;
                  return option.meta?.farm === scope.farm;
                });
                const scopedHouseOptions = houseSelectOptionsWithNone.filter((option) => {
                  if (option.value === '') return true;
                  const farmMatch = !scope.farm || option.meta?.farm === scope.farm;
                  const zoneMatch = !scope.zone || option.meta?.zone === scope.zone;
                  return farmMatch && zoneMatch;
                });
                const scopeRoleName = scope.role.trim().toLowerCase();
                const scopeRoleCode = roleCodeByName[scopeRoleName] ?? '';
                
                let scopeRoleLookupCodes =
                  rolePermissionsByRoleName[scopeRoleName] ??
                  rolePermissionsByRoleName[scopeRoleCode] ??
                  [];

                if (scopeRoleLookupCodes.length === 0) {
                  if (Object.keys(rolePermissionsByRoleName).length === 0) {
                    scopeRoleLookupCodes = rolePermissionCodes;
                  }
                }

                const scopeRolePermissionCodes = Array.from(
                  new Set(
                    scopeRoleLookupCodes
                      .map((code) => normalizePermissionCodeForScope(code))
                      .filter((code): code is string => Boolean(code))
                      .filter((code): code is string => Boolean(code)),
                  ),
                ).sort((left, right) => left.localeCompare(right));
                const scopeSelection =
                  scopePermissionSelections[index] ?? buildEmptyScopePermissionSelection();
                const initialScopeSelection =
                  initialScopePermissionSelections[index] ?? buildEmptyScopePermissionSelection();
                const scopeAllowPermissionSet = new Set(
                  scopeSelection.allowPermissionCodes.map((item) => item.trim()),
                );
                const scopeDenyPermissionSet = new Set(
                  scopeSelection.denyPermissionCodes.map((item) => item.trim()),
                );
                const initialScopeAllowPermissionSet = new Set(
                  initialScopeSelection.allowPermissionCodes.map((item) => item.trim()),
                );
                const initialScopeDenyPermissionSet = new Set(
                  initialScopeSelection.denyPermissionCodes.map((item) => item.trim()),
                );
                const scopePermissionSearch = permissionSearches[index] ?? '';
                const scopeFilterState = scopePermissionFilters[index] ?? 'all';
                const scopeRoleSearch = roleSearches[index] ?? '';
                const scopeFarmSearch = farmSearches[index] ?? '';
                const scopeZoneSearch = zoneSearches[index] ?? '';
                const scopeHouseSearch = houseSearches[index] ?? '';
                const displayedRoleOptions = roleSelectOptions.filter((option) =>
                  option.label.toLowerCase().includes(scopeRoleSearch.trim().toLowerCase()),
                );
                const displayedFarmOptions = farmSelectOptions.filter((option) =>
                  option.label.toLowerCase().includes(scopeFarmSearch.trim().toLowerCase()),
                );
                const displayedZoneOptions = scopedZoneOptions.filter((option) => {
                  if (option.value === '') {
                    return false;
                  }
                  return option.label.toLowerCase().includes(scopeZoneSearch.trim().toLowerCase());
                });
                const displayedHouseOptions = scopedHouseOptions.filter((option) => {
                  if (option.value === '') {
                    return false;
                  }
                  return option.label.toLowerCase().includes(scopeHouseSearch.trim().toLowerCase());
                });
                const expandedScopeModules = scopeExpandedModules[index] ?? [];

                const knownPermissionCodes = Array.from(
                  new Set([
                    ...assignablePermissionCodes.map((item) => item.trim()),
                    ...scopeRolePermissionCodes,
                    ...scopeSelection.allowPermissionCodes.map((item) => item.trim()),
                    ...scopeSelection.denyPermissionCodes.map((item) => item.trim()),
                    ...initialScopeSelection.allowPermissionCodes.map((item) => item.trim()),
                    ...initialScopeSelection.denyPermissionCodes.map((item) => item.trim()),
                  ]),
                )
                  .map((code) => normalizePermissionCodeForScope(code))
                  .filter((code): code is string => Boolean(code))
                  .filter((code) => assignablePermissionSet.has(code))
                  .sort((left, right) => left.localeCompare(right));

                const moduleMetaBySlug: Record<string, PermissionModuleMeta> = {};

                const upsertModuleMeta = (moduleMeta: PermissionModuleMeta) => {
                  const existingMeta = moduleMetaBySlug[moduleMeta.moduleSlug];
                  if (
                    !existingMeta ||
                    moduleMeta.sectionOrder < existingMeta.sectionOrder ||
                    (moduleMeta.sectionOrder === existingMeta.sectionOrder &&
                      moduleMeta.moduleOrder < existingMeta.moduleOrder)
                  ) {
                    moduleMetaBySlug[moduleMeta.moduleSlug] = moduleMeta;
                  }
                };

                const scopePermissionRows: ScopeModulePermissionItem[] = knownPermissionCodes
                  .map((code) => {
                    const parsedPermission = splitPermissionCode(code);
                    const action = parsedPermission?.action ?? code;
                    const moduleMeta = resolvePermissionModuleMeta(
                      code,
                      permissionMenuSlugByCode,
                      menuListLabelBySlug,
                      menuGroupLabelByMenuListSlug,
                      menuGroupOrderByMenuListSlug,
                      menuListOrderBySlug,
                    );
                    upsertModuleMeta(moduleMeta);

                    return {
                      code,
                      moduleCode: moduleMeta.moduleSlug,
                      action,
                      fromRole: scopeRolePermissionCodes.includes(code),
                      allowSelected: scopeAllowPermissionSet.has(code),
                      denySelected: scopeDenyPermissionSet.has(code),
                      initialAllowSelected: initialScopeAllowPermissionSet.has(code),
                      initialDenySelected: initialScopeDenyPermissionSet.has(code),
                      assignable: assignablePermissionSet.has(code),
                    };
                  });
                const scopeRowsByFilterState =
                  scopeFilterState === 'all'
                    ? scopePermissionRows
                    : scopePermissionRows.filter((row) => {
                        const isEffective =
                          (row.fromRole && !row.denySelected) ||
                          (!row.fromRole && row.allowSelected);
                        if (scopeFilterState === 'effective') {
                          return isEffective;
                        }
                        if (scopeFilterState === 'base') {
                          return row.fromRole;
                        }
                        return row.allowSelected || row.denySelected;
                      });
                const scopeFilteredPermissionRows = scopePermissionSearch.trim()
                  ? scopeRowsByFilterState.filter((row) =>
                      `${row.moduleCode}.${row.action} ${formatPermissionActionLabel(row.action) || row.action}`
                        .toLowerCase()
                        .includes(scopePermissionSearch.trim().toLowerCase()),
                    )
                  : scopeRowsByFilterState;
                const scopeActionOrder = buildPermissionActionOrder(
                  scopePermissionRows.map((row) => row.action),
                );
                const scopeModuleGroups = Object.values(
                  scopeFilteredPermissionRows.reduce<
                    Record<
                      string,
                      ScopePermissionModuleGroup & {
                        rowsByCode: Record<string, ScopeModulePermissionItem>;
                      }
                    >
                  >((accumulator, row) => {
                    const moduleMeta = moduleMetaBySlug[row.moduleCode];
                    if (!moduleMeta) {
                      return accumulator;
                    }
                    const groupKey = moduleMeta.moduleSlug;
                    if (!accumulator[groupKey]) {
                      accumulator[groupKey] = {
                        moduleCode: groupKey,
                        moduleSlug: moduleMeta.moduleSlug,
                        moduleLabel: moduleMeta.moduleLabel,
                        sectionLabel: moduleMeta.sectionLabel,
                        sectionOrder: moduleMeta.sectionOrder,
                        moduleOrder: moduleMeta.moduleOrder,
                        rows: [],
                        rowsByCode: {},
                      };
                    }
                    accumulator[groupKey].rowsByCode[row.code] = row;
                    return accumulator;
                  }, {}),
                )
                  .map((group) => ({
                    moduleCode: group.moduleCode,
                    moduleSlug: group.moduleSlug,
                    moduleLabel: group.moduleLabel,
                    sectionLabel: group.sectionLabel,
                    sectionOrder: group.sectionOrder,
                    moduleOrder: group.moduleOrder,
                    rows: Object.values(group.rowsByCode).sort(
                      (left, right) =>
                        (scopeActionOrder.get(left.action) ?? Number.MAX_SAFE_INTEGER) -
                          (scopeActionOrder.get(right.action) ?? Number.MAX_SAFE_INTEGER) ||
                        left.action.localeCompare(right.action),
                    ),
                  }))
                  .sort(
                    (left, right) =>
                      left.sectionOrder - right.sectionOrder ||
                      left.moduleOrder - right.moduleOrder ||
                      left.moduleLabel.localeCompare(right.moduleLabel),
                  );
                const scopeSectionGroups = Object.values(
                  scopeModuleGroups.reduce<Record<string, ScopePermissionSectionGroup>>(
                    (accumulator, group) => {
                      const sectionKey =
                        normalizeMenuLookupKey(group.sectionLabel) || `section-${group.sectionOrder}`;
                      if (!accumulator[sectionKey]) {
                        accumulator[sectionKey] = {
                          sectionKey,
                          sectionLabel: group.sectionLabel,
                          sectionOrder: group.sectionOrder,
                          modules: [],
                        };
                      }
                      accumulator[sectionKey].modules.push(group);
                      return accumulator;
                    },
                    {},
                  ),
                )
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
                const allScopeModulesExpanded =
                  scopeModuleGroups.length > 0 &&
                  scopeModuleGroups.every((group) =>
                    expandedScopeModules.includes(group.moduleCode),
                  );
                const scopeStats = {
                  base: scopePermissionRows.filter((row) => row.fromRole).length,
                  added: scopePermissionRows.filter(
                    (row) => !row.fromRole && row.allowSelected,
                  ).length,
                  removed: scopePermissionRows.filter(
                    (row) => row.fromRole && row.denySelected,
                  ).length,
                  effective: scopePermissionRows.filter(
                    (row) =>
                      (row.fromRole && !row.denySelected) ||
                      (!row.fromRole && row.allowSelected),
                  ).length,
                };
                const scopePermissionRowByCode = new Map(
                  scopePermissionRows.map((row) => [row.code.toLowerCase(), row] as const),
                );
                const scopeMatrixSections = scopeSectionGroups.map((sectionGroup) => ({
                  sectionKey: sectionGroup.sectionKey,
                  sectionLabel: sectionGroup.sectionLabel,
                  modules: sectionGroup.modules.map((moduleGroup) => {
                    const matrixRows = moduleGroup.rows.map((row) => {
                      const checked =
                        (row.fromRole && !row.denySelected) ||
                        (!row.fromRole && row.allowSelected);
                      const disabled =
                        !row.fromRole && !row.assignable && !row.allowSelected;

                      return {
                        code: row.code,
                        action: row.action,
                        actionLabel: formatPermissionActionLabel(row.action) || row.action,
                        description: '',
                        isReady: row.assignable,
                        checked,
                        baselineChecked: row.fromRole,
                        disabled,
                      };
                    });

                    return {
                      moduleSlug: moduleGroup.moduleCode,
                      moduleLabel: moduleGroup.moduleLabel,
                      readyCount: moduleGroup.rows.filter((row) => row.assignable).length,
                      totalCount: moduleGroup.rows.length,
                      selectedCount: matrixRows.filter((row) => row.checked).length,
                      addedCount: moduleGroup.rows.filter(
                        (row) => !row.fromRole && row.allowSelected,
                      ).length,
                      removedCount: moduleGroup.rows.filter(
                        (row) => row.fromRole && row.denySelected,
                      ).length,
                      rows: matrixRows,
                    };
                  }),
                }));

                return (
                  <Paper
                    key={`scope-entry-${scopeEntryId}`}
                    variant="outlined"
                    sx={{
                      p: 2,
                      bgcolor: modalSectionBg,
                      borderColor: borderStrong,
                      borderRadius: 10,
                    }}
                  >
                    <Box
                      sx={{
                        mb: 1.25,
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 1.25,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: textPrimary }}>
                          รายการที่ {scopeEntryId}
                        </Typography>
                      </Box>
                      {roleScopes.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveRoleScope(index)}
                          sx={{
                            color: alpha(textSecondary, 0.85),
                            '&:hover': { color: theme.palette.error.main },
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <Stack spacing={2} sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <FormControl fullWidth>
                            <InputLabel id={`role-label-${index}`} shrink>บทบาท *</InputLabel>
                            <Select
                              labelId={`role-label-${index}`}
                              size="small"
                              value={scope.role}
                              onChange={(event) =>
                                handleRoleScopeChange(index, 'role', String(event.target.value))
                              }
                              onClose={() =>
                                setRoleSearches((previous) =>
                                  previous.map((item, itemIndex) =>
                                    itemIndex === index ? '' : item,
                                  ),
                                )
                              }
                              label="บทบาท *"
                              displayEmpty
                              IconComponent={ExpandMore}
                              sx={scopeCompactSelectSx}
                              renderValue={(selected) => {
                                if (!selected) {
                                  return (
                                    <Box sx={{ color: textSecondary, opacity: 0.6 }}>
                                      เลือกบทบาท...
                                    </Box>
                                  );
                                }
                                const found = roleSelectOptions.find((option) => option.value === selected);
                                return found ? found.label : String(selected);
                              }}
                              MenuProps={{
                                autoFocus: false,
                                PaperProps: {
                                  sx: {
                                    borderRadius: 10,
                                    mt: 1,
                                    border: 1,
                                    borderColor: 'divider',
                                    backgroundImage: 'none',
                                    ...getScrollbarStyles(350),
                                  },
                                },
                                MenuListProps: { disablePadding: true },
                              }}
                            >
                              <ListSubheader
                                sx={{
                                  bgcolor: 'background.paper',
                                  p: 1.5,
                                  position: 'sticky',
                                  top: 0,
                                  zIndex: 2,
                                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                }}
                              >
                                <TextField
                                  size="small"
                                  autoFocus
                                  placeholder="ค้นหาบทบาท..."
                                  fullWidth
                                  value={scopeRoleSearch}
                                  onChange={(event) =>
                                    setRoleSearches((previous) =>
                                      previous.map((item, itemIndex) =>
                                        itemIndex === index ? event.target.value : item,
                                      ),
                                    )
                                  }
                                  onKeyDown={(event) => {
                                    if (event.key !== 'Escape') {
                                      event.stopPropagation();
                                    }
                                  }}
                                  InputProps={{
                                    startAdornment: (
                                      <InputAdornment position="start">
                                        <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                      </InputAdornment>
                                    ),
                                    sx: {
                                      borderRadius: 10,
                                      bgcolor: alpha(theme.palette.action.hover, 0.05),
                                    },
                                  }}
                                />
                              </ListSubheader>

                              {displayedRoleOptions.length > 0 ? (
                                displayedRoleOptions.map((option, optionIndex) => (
                                  <MenuItem
                                    key={String(option.value)}
                                    value={option.value as string}
                                    sx={{
                                      py: 1.5,
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      color: scope.role === option.value ? primary : 'inherit',
                                      fontWeight: scope.role === option.value ? 600 : 400,
                                      borderBottom:
                                        optionIndex < displayedRoleOptions.length - 1
                                          ? `1px solid ${alpha(theme.palette.divider, 0.2)}`
                                          : 'none',
                                    }}
                                  >
                                    {option.label}
                                    {scope.role === option.value && (
                                      <Check fontSize="small" color="primary" />
                                    )}
                                  </MenuItem>
                                ))
                              ) : (
                                <MenuItem disabled sx={{ py: 2, textAlign: 'center', display: 'block' }}>
                                  ไม่พบบทบาทที่ค้นหา
                                </MenuItem>
                              )}
                            </Select>
                          </FormControl>

                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
                              gap: 2,
                            }}
                          >
                            <FormControl fullWidth>
                              <InputLabel id={`farm-label-${index}`} shrink>ฟาร์ม *</InputLabel>
                              <Select
                                labelId={`farm-label-${index}`}
                                size="small"
                                value={scope.farm}
                                onChange={(event) =>
                                  handleRoleScopeChange(index, 'farm', String(event.target.value))
                                }
                                onClose={() =>
                                  setFarmSearches((previous) =>
                                    previous.map((item, itemIndex) =>
                                      itemIndex === index ? '' : item,
                                    ),
                                  )
                                }
                                label="ฟาร์ม *"
                                displayEmpty
                                IconComponent={ExpandMore}
                                sx={scopeCompactSelectSx}
                                renderValue={(selected) => {
                                  if (!selected) {
                                    return (
                                      <Box sx={{ color: textSecondary, opacity: 0.6 }}>
                                        เลือกฟาร์ม...
                                      </Box>
                                    );
                                  }
                                  const found = farmSelectOptions.find((option) => option.value === selected);
                                  return found ? found.label : String(selected);
                                }}
                                MenuProps={{
                                  autoFocus: false,
                                  PaperProps: {
                                    sx: {
                                      borderRadius: 10,
                                      mt: 1,
                                      border: 1,
                                      borderColor: 'divider',
                                      backgroundImage: 'none',
                                      ...getScrollbarStyles(260),
                                    },
                                  },
                                  MenuListProps: { disablePadding: true },
                                }}
                              >
                                <ListSubheader
                                  sx={{
                                    bgcolor: 'background.paper',
                                    p: 1.5,
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 2,
                                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                  }}
                                >
                                  <TextField
                                    size="small"
                                    autoFocus
                                    placeholder="ค้นหาฟาร์ม..."
                                    fullWidth
                                    value={scopeFarmSearch}
                                    onChange={(event) =>
                                      setFarmSearches((previous) =>
                                        previous.map((item, itemIndex) =>
                                          itemIndex === index ? event.target.value : item,
                                        ),
                                      )
                                    }
                                    onKeyDown={(event) => {
                                      if (event.key !== 'Escape') {
                                        event.stopPropagation();
                                      }
                                    }}
                                    InputProps={{
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                        </InputAdornment>
                                      ),
                                      sx: {
                                        borderRadius: 10,
                                        bgcolor: alpha(theme.palette.action.hover, 0.05),
                                      },
                                    }}
                                  />
                                </ListSubheader>

                                {displayedFarmOptions.length > 0 ? (
                                  displayedFarmOptions.map((option, optionIndex) => (
                                    <MenuItem
                                      key={String(option.value)}
                                      value={option.value as string}
                                      sx={{
                                        py: 1.5,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        color: scope.farm === option.value ? primary : 'inherit',
                                        fontWeight: scope.farm === option.value ? 600 : 400,
                                        borderBottom:
                                          optionIndex < displayedFarmOptions.length - 1
                                            ? `1px solid ${alpha(theme.palette.divider, 0.2)}`
                                            : 'none',
                                      }}
                                    >
                                      {option.label}
                                      {scope.farm === option.value && (
                                        <Check fontSize="small" color="primary" />
                                      )}
                                    </MenuItem>
                                  ))
                                ) : (
                                  <MenuItem disabled sx={{ py: 2, textAlign: 'center', display: 'block' }}>
                                    ไม่พบฟาร์มที่ค้นหา
                                  </MenuItem>
                                )}
                              </Select>
                            </FormControl>

                            <FormControl fullWidth disabled={!scope.farm}>
                              <InputLabel id={`zone-label-${index}`} shrink>โซน (ไม่บังคับ)</InputLabel>
                              <Select
                                labelId={`zone-label-${index}`}
                                size="small"
                                value={scope.zone}
                                onChange={(event) =>
                                  handleRoleScopeChange(index, 'zone', String(event.target.value))
                                }
                                onClose={() =>
                                  setZoneSearches((previous) =>
                                    previous.map((item, itemIndex) =>
                                      itemIndex === index ? '' : item,
                                    ),
                                  )
                                }
                                label="โซน (ไม่บังคับ)"
                                displayEmpty
                                IconComponent={ExpandMore}
                                sx={scopeCompactSelectSx}
                                renderValue={(selected) => {
                                  if (!selected) {
                                    return (
                                      <Box sx={{ color: textSecondary, opacity: 0.6 }}>
                                        เลือกโซน...
                                      </Box>
                                    );
                                  }
                                  const found = scopedZoneOptions.find((option) => option.value === selected);
                                  return found ? found.label : String(selected);
                                }}
                                MenuProps={{
                                  autoFocus: false,
                                  PaperProps: {
                                    sx: {
                                      borderRadius: 10,
                                      mt: 1,
                                      border: 1,
                                      borderColor: 'divider',
                                      backgroundImage: 'none',
                                      ...getScrollbarStyles(260),
                                    },
                                  },
                                  MenuListProps: { disablePadding: true },
                                }}
                              >
                                <ListSubheader
                                  sx={{
                                    bgcolor: 'background.paper',
                                    p: 1.5,
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 2,
                                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                  }}
                                >
                                  <TextField
                                    size="small"
                                    autoFocus
                                    placeholder="ค้นหาโซน..."
                                    fullWidth
                                    value={scopeZoneSearch}
                                    onChange={(event) =>
                                      setZoneSearches((previous) =>
                                        previous.map((item, itemIndex) =>
                                          itemIndex === index ? event.target.value : item,
                                        ),
                                      )
                                    }
                                    onKeyDown={(event) => {
                                      if (event.key !== 'Escape') {
                                        event.stopPropagation();
                                      }
                                    }}
                                    InputProps={{
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                        </InputAdornment>
                                      ),
                                      sx: {
                                        borderRadius: 10,
                                        bgcolor: alpha(theme.palette.action.hover, 0.05),
                                      },
                                    }}
                                  />
                                </ListSubheader>
                                <MenuItem value="">(ไม่ระบุ)</MenuItem>
                                {displayedZoneOptions.length > 0 ? (
                                  displayedZoneOptions.map((option, optionIndex) => (
                                    <MenuItem
                                      key={String(option.value)}
                                      value={option.value as string}
                                      sx={{
                                        py: 1.5,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        color: scope.zone === option.value ? primary : 'inherit',
                                        fontWeight: scope.zone === option.value ? 600 : 400,
                                        borderBottom:
                                          optionIndex < displayedZoneOptions.length - 1
                                            ? `1px solid ${alpha(theme.palette.divider, 0.2)}`
                                            : 'none',
                                      }}
                                    >
                                      {option.label}
                                      {scope.zone === option.value && (
                                        <Check fontSize="small" color="primary" />
                                      )}
                                    </MenuItem>
                                  ))
                                ) : (
                                  <MenuItem disabled sx={{ py: 2, textAlign: 'center', display: 'block' }}>
                                    {!scope.farm ? 'กรุณาเลือกฟาร์มก่อน' : 'ไม่พบโซนที่ค้นหา'}
                                  </MenuItem>
                                )}
                              </Select>
                            </FormControl>

                            <FormControl fullWidth disabled={!scope.zone}>
                              <InputLabel id={`house-label-${index}`} shrink>โรงเรือน (ไม่บังคับ)</InputLabel>
                              <Select
                                labelId={`house-label-${index}`}
                                size="small"
                                value={scope.house}
                                onChange={(event) =>
                                  handleRoleScopeChange(index, 'house', String(event.target.value))
                                }
                                onClose={() =>
                                  setHouseSearches((previous) =>
                                    previous.map((item, itemIndex) =>
                                      itemIndex === index ? '' : item,
                                    ),
                                  )
                                }
                                label="โรงเรือน (ไม่บังคับ)"
                                displayEmpty
                                IconComponent={ExpandMore}
                                sx={scopeCompactSelectSx}
                                renderValue={(selected) => {
                                  if (!selected) {
                                    return (
                                      <Box sx={{ color: textSecondary, opacity: 0.6 }}>
                                        เลือกโรงเรือน...
                                      </Box>
                                    );
                                  }
                                  const found = scopedHouseOptions.find((option) => option.value === selected);
                                  return found ? found.label : String(selected);
                                }}
                                MenuProps={{
                                  autoFocus: false,
                                  PaperProps: {
                                    sx: {
                                      borderRadius: 10,
                                      mt: 1,
                                      border: 1,
                                      borderColor: 'divider',
                                      backgroundImage: 'none',
                                      ...getScrollbarStyles(260),
                                    },
                                  },
                                  MenuListProps: { disablePadding: true },
                                }}
                              >
                                <ListSubheader
                                  sx={{
                                    bgcolor: 'background.paper',
                                    p: 1.5,
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 2,
                                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                                  }}
                                >
                                  <TextField
                                    size="small"
                                    autoFocus
                                    placeholder="ค้นหาโรงเรือน..."
                                    fullWidth
                                    value={scopeHouseSearch}
                                    onChange={(event) =>
                                      setHouseSearches((previous) =>
                                        previous.map((item, itemIndex) =>
                                          itemIndex === index ? event.target.value : item,
                                        ),
                                      )
                                    }
                                    onKeyDown={(event) => {
                                      if (event.key !== 'Escape') {
                                        event.stopPropagation();
                                      }
                                    }}
                                    InputProps={{
                                      startAdornment: (
                                        <InputAdornment position="start">
                                          <Search fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                                        </InputAdornment>
                                      ),
                                      sx: {
                                        borderRadius: 10,
                                        bgcolor: alpha(theme.palette.action.hover, 0.05),
                                      },
                                    }}
                                  />
                                </ListSubheader>
                                <MenuItem value="">(ไม่ระบุ)</MenuItem>
                                {displayedHouseOptions.length > 0 ? (
                                  displayedHouseOptions.map((option, optionIndex) => (
                                    <MenuItem
                                      key={String(option.value)}
                                      value={option.value as string}
                                      sx={{
                                        py: 1.5,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        color: scope.house === option.value ? primary : 'inherit',
                                        fontWeight: scope.house === option.value ? 600 : 400,
                                        borderBottom:
                                          optionIndex < displayedHouseOptions.length - 1
                                            ? `1px solid ${alpha(theme.palette.divider, 0.2)}`
                                            : 'none',
                                      }}
                                    >
                                      {option.label}
                                      {scope.house === option.value && (
                                        <Check fontSize="small" color="primary" />
                                      )}
                                    </MenuItem>
                                  ))
                                ) : (
                                  <MenuItem disabled sx={{ py: 2, textAlign: 'center', display: 'block' }}>
                                    {!scope.zone ? 'กรุณาเลือกโซนก่อน' : 'ไม่พบโรงเรือนที่ค้นหา'}
                                  </MenuItem>
                                )}
                              </Select>
                            </FormControl>
                          </Box>
                        </Box>
                        <Divider sx={{ borderColor: alpha(theme.palette.divider, 0.65) }} />

                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', lg: 'row' },
                            alignItems: { xs: 'flex-start', lg: 'center' },
                            justifyContent: 'space-between',
                            gap: 1.25,
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<Settings fontSize="small" />}
                              sx={{
                                textTransform: 'none',
                                borderRadius: 10,
                                px: 2,
                                py: 0.7,
                                bgcolor: alpha(theme.palette.primary.dark, 0.96),
                                border: `1px solid ${alpha(theme.palette.common.black, 0.4)}`,
                                color: alpha(theme.palette.common.white, 0.96),
                                boxShadow: 'none',
                                '&:hover': {
                                  bgcolor: theme.palette.primary.dark,
                                  boxShadow: 'none',
                                },
                              }}
                            >
                              ปรับแต่งสิทธิพิเศษรายบุคคล
                            </Button>
                            {!scope.role && (
                              <Typography variant="caption" sx={{ color: theme.palette.error.main }}>
                                กรุณาเลือกบทบาทก่อน
                              </Typography>
                            )}
                          </Box>

                          {scope.role && (
                            <PermissionStatsSummary
                              base={scopeStats.base}
                              added={scopeStats.added}
                              removed={scopeStats.removed}
                              effective={scopeStats.effective}
                            />
                          )}
                        </Box>

                        {scope.role && (
                          <PermissionMatrixEditor
                            showTopBar={false}
                            title="สิทธิของรายการนี้ (ฐานจาก Role + ปรับแต่งรายบุคคล)"
                            subtitle="ปรับจากฐาน role ได้ทั้งลดสิทธิพื้นฐาน และเพิ่มสิทธิจากคลังสิทธิ"
                            searchValue={permissionSearches[index] ?? ''}
                            onSearchChange={(value) =>
                              setPermissionSearches((previous) =>
                                previous.map((item, itemIndex) =>
                                  itemIndex === index ? value : item,
                                ),
                              )
                            }
                            filterValue={scopeFilterState}
                            onFilterChange={(value) =>
                              setScopeFilterState(index, value as PermissionFilterState)
                            }
                            filterOptions={SCOPE_PERMISSION_FILTER_OPTIONS}
                            onResetFilters={() => resetScopeCustomization(index)}
                            resetDisabled={scopeStats.added === 0 && scopeStats.removed === 0}
                            allModulesExpanded={allScopeModulesExpanded}
                            onToggleAllModules={() =>
                              toggleAllScopeModules(
                                index,
                                scopeModuleGroups.map((group) => group.moduleCode),
                              )
                            }
                            sections={permissionsLoading ? [] : scopeMatrixSections}
                            expandedModuleSlugs={expandedScopeModules}
                            onToggleModule={(moduleSlug) =>
                              toggleScopeModule(index, moduleSlug)
                            }
                            onToggleRow={(row) => {
                              const sourceRow = scopePermissionRowByCode.get(
                                row.code.toLowerCase(),
                              );
                              if (!sourceRow) {
                                return;
                              }

                              if (sourceRow.fromRole) {
                                setScopePermissionEffect(
                                  index,
                                  sourceRow.code,
                                  sourceRow.denySelected ? 'none' : 'deny',
                                );
                                return;
                              }

                              setScopePermissionEffect(
                                index,
                                sourceRow.code,
                                sourceRow.allowSelected ? 'none' : 'allow',
                              );
                            }}
                            emptyText={
                              permissionsLoading ? 'กำลังโหลดสิทธิ์...' : 'ไม่พบข้อมูลสิทธิ์'
                            }
                            maxHeight={400}
                          />
                        )}
                      </Stack>

                    </Box>
                  </Paper>
                );
              })}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ p: 2, gap: 1, bgcolor: modalHeaderBg }}>
        <Button onClick={handleSave} variant="contained" disabled={!formValid || saving} sx={{ textTransform: 'none' }}>
          {saving ? 'กำลังบันทึก...' : initialAssignment ? 'บันทึกการแก้ไข' : 'บันทึก'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
