'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DialogTitleWithClose } from '@/components/common';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  FormControlLabel,
  IconButton,
  InputAdornment,
  ListItemText,
  MenuItem,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { Add, DeleteOutline, RestartAlt, SearchOutlined, VpnKey as VpnKeyIcon } from '@mui/icons-material';
import Swal from 'sweetalert2';
import { useUserAssignmentDetail } from '../hooks';
import { saveUserAssignment } from '../services/user-assignment.api';
import { rolePermissionsService } from '../services/role-permissions.service';
import type {
  FacilityNodeType,
  UserAssignmentDetail,
  UserAssignmentEditorFormState,
  UserAssignmentPermissionQueryResponse,
  UserAssignmentPermissionQueryRow,
  UserAssignmentPermissionOverrideFormItem,
  UserAssignmentWorkspace,
} from '../types';
import { userAssignmentsService } from '../services/user-assignments.service';

type UserAssignmentEditorDialogProps = {
  open: boolean;
  mode: 'create' | 'edit';
  userId?: number | null;
  workspace: UserAssignmentWorkspace | null;
  onClose: () => void;
  onSaved: () => Promise<void> | void;
};

type BackendPreview = {
  decisionReason: string;
  isAllowed: boolean;
  permissionCode: string;
};

type LoadedRolePermission = {
  permissionId: number;
  permissionCode: string;
  description: string;
};

type PermissionOptionViewModel = {
  permissionId: number;
  permissionCode: string;
  description: string;
  resource: string;
  action: string;
  isAssignable: boolean;
  fromSelectedRole: boolean;
  sourceRoleIds: number[];
  sourceRoleNames: string[];
  hasUserAllow: boolean;
  hasUserDeny: boolean;
  isEffectiveAllowed: boolean;
  decisionReason: string;
};

function newLocalId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

const globalPermissionQueryCacheRef: Record<string, UserAssignmentPermissionQueryResponse> = {};
const globalRolePermissionCacheRef: Record<number, LoadedRolePermission[]> = {};

function createEmptyOverride(
  workspace: UserAssignmentWorkspace,
  selectedRoleIds: number[],
): UserAssignmentPermissionOverrideFormItem {
  const firstRoleId =
    selectedRoleIds.find((roleId) => roleId > 0) ??
    workspace.roles.find((role) => role.isActive)?.id ??
    workspace.roles[0]?.id ??
    null;
  return {
    localId: newLocalId(),
    roleId: firstRoleId,
    permissionId: null,
    effect: 'deny',
    facilityNodeId: null,
    note: '',
  };
}

function createEmptyState(workspace: UserAssignmentWorkspace): UserAssignmentEditorFormState {
  const firstCompanyId = workspace.companies.find((company) => company.isActive)?.id ?? workspace.companies[0]?.id ?? null;
  const firstRoleId = workspace.roles.find((role) => role.isActive)?.id ?? workspace.roles[0]?.id ?? null;
  return {
    mode: 'create',
    identity: {
      username: '',
      password: '',
      email: '',
      prefix: '',
      firstName: '',
      lastName: '',
      companyId: firstCompanyId,
      isActive: true,
    },
    selectedRoleIds: firstRoleId ? [firstRoleId] : [],
    selectedFacilityNodeIds: [],
    permissionOverrides: [
      createEmptyOverride(workspace, firstRoleId ? [firstRoleId] : []),
    ],
  };
}

function mapDetailToState(
  workspace: UserAssignmentWorkspace,
  detail: UserAssignmentDetail | null,
): UserAssignmentEditorFormState {
  if (!detail) {
    return createEmptyState(workspace);
  }

  const selectedRoleIds = Array.from(
    new Set(detail.roleScopes.map((scope) => scope.roleId).filter((roleId) => roleId > 0)),
  );
  const selectedFacilityNodeIds = Array.from(
    new Set(
      detail.roleScopes
        .map((scope) => scope.facilityNodeId)
        .filter((facilityNodeId): facilityNodeId is number => typeof facilityNodeId === 'number' && facilityNodeId > 0),
    ),
  );

  return {
    mode: 'edit',
    userId: detail.user.id,
    identity: {
      username: detail.user.username,
      password: '',
      email: detail.user.email,
      prefix: detail.user.prefix ?? '',
      firstName: detail.user.firstName,
      lastName: detail.user.lastName,
      companyId: detail.user.companyId,
      isActive: detail.user.isActive,
    },
    selectedRoleIds: selectedRoleIds.length
      ? selectedRoleIds
      : workspace.roles.slice(0, 1).map((role) => role.id),
    selectedFacilityNodeIds,
    permissionOverrides: detail.permissionOverrides.length
      ? detail.permissionOverrides.map((override) => ({
          localId: newLocalId(),
          id: override.id,
          roleId: override.roleId,
          permissionId: override.permissionId,
          effect: override.effect,
          facilityNodeId: override.facilityNodeId,
          note: override.note,
        }))
      : [createEmptyOverride(workspace, selectedRoleIds)],
  };
}

function formatRoleLabel(roleName: string, permissionCount: number, isActive: boolean) {
  return `${roleName}${isActive ? '' : ' (inactive)'} · ${permissionCount} permissions`;
}

function formatFacilityLabel(pathLabel: string, isActive: boolean) {
  return `${pathLabel}${isActive ? '' : ' (inactive)'}`;
}

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function matchesQuery(value: string, query: string) {
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) {
    return true;
  }

  return value.toLowerCase().includes(normalizedQuery);
}

function buildPermissionQueryKey(roleId: number, facilityNodeId: number) {
  return `${roleId}:${facilityNodeId}`;
}

const FACILITY_TYPE_LABELS: Record<FacilityNodeType, string> = {
  farm: 'Farms',
  zone: 'Zones',
  house: 'Houses',
  pen: 'Pens',
};

const FACILITY_TYPE_ORDER: FacilityNodeType[] = ['farm', 'zone', 'house', 'pen'];

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 10,
    bgcolor: 'background.paper',
  },
};

const fieldLabelSx = {
  '& .MuiInputLabel-root': {
    fontWeight: 600,
  },
};

async function runBackendPreview(
  userId: number,
  permissionId: number,
  facilityNodeId: number | null,
): Promise<BackendPreview | null> {
  try {
    const preview = await userAssignmentsService.previewAccess({
      userId,
      permissionId,
      facilityNodeId,
    });
    return {
      decisionReason: preview.decisionReason,
      isAllowed: preview.isAllowed,
      permissionCode: preview.permissionCode,
    };
  } catch {
    return null;
  }
}

export default function UserAssignmentEditorDialog({
  open,
  mode,
  userId,
  workspace,
  onClose,
  onSaved,
}: UserAssignmentEditorDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const detailState = useUserAssignmentDetail(userId, workspace, open && mode === 'edit');
  const [form, setForm] = useState<UserAssignmentEditorFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<BackendPreview | null>(null);
  const [roleSearch, setRoleSearch] = useState('');
  const [facilitySearch, setFacilitySearch] = useState('');
  const [permissionSearch, setPermissionSearch] = useState('');
  const [overrideRoleFilter, setOverrideRoleFilter] = useState<number | ''>('');
  const [overrideFacilityFilter, setOverrideFacilityFilter] = useState<number | ''>('');
  const [overridePermissions, setOverridePermissions] = useState<UserAssignmentPermissionQueryRow[]>([]);
  const [overridePermissionsLoading, setOverridePermissionsLoading] = useState(false);
  const rolePermissionCacheRef = useRef<Record<number, LoadedRolePermission[]>>({});
  const [rolePermissionCatalog, setRolePermissionCatalog] = useState<Record<number, LoadedRolePermission[]>>({});
  const [rolePermissionLoadingRoleId, setRolePermissionLoadingRoleId] = useState<number | null>(null);
  const [rolePermissionError, setRolePermissionError] = useState<string | null>(null);
  const [permissionQueryCatalog, setPermissionQueryCatalog] = useState<Record<string, UserAssignmentPermissionQueryResponse>>({});
  const [permissionQueryLoadingKeys, setPermissionQueryLoadingKeys] = useState<Record<string, boolean>>({});
  const [permissionQueryErrors, setPermissionQueryErrors] = useState<Record<string, string>>({});
  const editPermissionQuerySignatureRef = useRef<string | null>(null);

  const dialogPaperSx = {
    borderRadius: 10,
    border: '1px solid',
    borderColor: alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.7 : 1),
    bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.98) : '#fff',
    backgroundImage:
      theme.palette.mode === 'dark'
        ? `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.04)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 100%)`
        : `linear-gradient(180deg, ${alpha('#f8fbf9', 0.96)} 0%, ${theme.palette.background.paper} 100%)`,
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 24px 48px rgba(0, 0, 0, 0.38)'
        : '0 28px 60px rgba(15, 23, 42, 0.16)',
  };

  const sectionPaperSx = {
    borderRadius: 10,
    border: '1px solid',
    borderColor: alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.7 : 1),
    bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.9) : alpha('#f8faf8', 0.95),
    boxShadow: 'none',
    p: { xs: 1.75, md: 2.25 },
  };

  const subsectionPaperSx = {
    borderRadius: 10,
    border: '1px solid',
    borderColor: alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.65 : 0.9),
    bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.82) : alpha('#ffffff', 0.9),
    boxShadow: 'none',
    p: { xs: 1.5, md: 1.75 },
  };

  const textFieldSx = {
    ...fieldSx,
    ...fieldLabelSx,
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.8 : 1),
    },
  };

  const chipSx = {
    height: 28,
    borderRadius: 10,
    fontWeight: 700,
    bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.88) : alpha('#f2f7f4', 1),
    border: `1px solid ${alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.7 : 1)}`,
  };

  const tableHeaderSx = {
    fontWeight: 800,
    letterSpacing: 0.2,
    bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.95) : alpha('#f5f8f6', 1),
    borderBottom: '2px solid',
    borderColor: alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.7 : 1),
  };

  const roleBoardCardSx = (selected: boolean, disabled: boolean) => ({
    width: '100%',
    borderRadius: 10,
    border: '1px solid',
    borderColor: selected
      ? alpha(theme.palette.primary.main, 0.55)
      : alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.65 : 0.95),
    bgcolor: selected
      ? alpha(theme.palette.primary.main, theme.palette.mode === 'dark' ? 0.16 : 0.08)
      : theme.palette.mode === 'dark'
        ? alpha(theme.palette.background.paper, 0.8)
        : alpha('#fff', 0.95),
    boxShadow: selected
      ? `0 0 0 1px ${alpha(theme.palette.primary.main, 0.1)}`
      : 'none',
    color: disabled ? theme.palette.text.disabled : 'inherit',
    opacity: disabled ? 0.6 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'transform 120ms ease, box-shadow 120ms ease, border-color 120ms ease, background-color 120ms ease',
    '&:hover': disabled
      ? undefined
      : {
          transform: 'translateY(-1px)',
          borderColor: alpha(theme.palette.primary.main, 0.55),
          boxShadow:
            theme.palette.mode === 'dark'
              ? `0 10px 24px ${alpha(theme.palette.primary.main, 0.12)}`
              : `0 10px 24px ${alpha(theme.palette.primary.main, 0.14)}`,
        },
  });

  useEffect(() => {
    if (!open || !workspace) {
      setForm(null);
      setPreview(null);
      setError(null);
      setRoleSearch('');
      setFacilitySearch('');
      setPermissionSearch('');
      setPermissionQueryCatalog({});
      setPermissionQueryLoadingKeys({});
      setPermissionQueryErrors({});
      return;
    }

    if (mode === 'create') {
      setForm(createEmptyState(workspace));
      setPreview(null);
      setError(null);
      setRoleSearch('');
      setFacilitySearch('');
      setPermissionSearch('');
      setPermissionQueryCatalog({});
      setPermissionQueryLoadingKeys({});
      setPermissionQueryErrors({});
      return;
    }

    if (detailState.detail) {
      setForm(mapDetailToState(workspace, detailState.detail));
      setPreview(null);
      setError(null);
      setRoleSearch('');
      setFacilitySearch('');
      setPermissionSearch('');
      setPermissionQueryCatalog({});
      setPermissionQueryLoadingKeys({});
      setPermissionQueryErrors({});
    }
  }, [open, workspace, mode, detailState.detail]);

  const selectedRoleNames = useMemo(() => {
    if (!workspace || !form) {
      return [];
    }
    const roleById = new Map(workspace.roles.map((role) => [role.id, role] as const));
    return form.selectedRoleIds
      .map((roleId) => roleById.get(roleId))
      .filter((role): role is NonNullable<typeof role> => Boolean(role))
      .map((role) => role.name);
  }, [workspace, form]);

  const selectedRoleIds: number[] = form?.selectedRoleIds ?? [];
  const selectedFacilityNodeIds: number[] = form?.selectedFacilityNodeIds ?? [];
  const overrideRoleOptions: number[] =
    selectedRoleIds.length > 0
      ? selectedRoleIds
      : workspace?.roles.map((role) => role.id) ?? [];

  const filteredOverrides = useMemo(() => {
    const overrides = form?.permissionOverrides ?? [];
    return overrides.filter((override) => {
      if (overrideRoleFilter !== '' && override.roleId !== overrideRoleFilter) return false;
      if (overrideFacilityFilter !== '' && override.facilityNodeId !== overrideFacilityFilter) return false;
      return true;
    });
  }, [form?.permissionOverrides, overrideRoleFilter, overrideFacilityFilter]);

  const roleBoardOptions = useMemo(() => {
    if (!workspace) {
      return [];
    }

    const roleById = new Map(workspace.roles.map((role) => [role.id, role] as const));
    return overrideRoleOptions
      .map((roleId) => roleById.get(roleId))
      .filter((role): role is NonNullable<typeof role> => Boolean(role))
      .sort((left, right) => {
        const leftActive = left.isActive ? 1 : 0;
        const rightActive = right.isActive ? 1 : 0;
        if (leftActive !== rightActive) {
          return rightActive - leftActive;
        }

        if (left.permissionCount !== right.permissionCount) {
          return right.permissionCount - left.permissionCount;
        }

        return left.name.localeCompare(right.name);
      })
      .filter((role) => {
        const query = normalizeQuery(roleSearch);
        if (!query) {
          return true;
        }

        return matchesQuery(role.name, roleSearch) || matchesQuery(role.code, roleSearch) || matchesQuery(role.description, roleSearch);
      });
  }, [workspace, overrideRoleOptions, roleSearch]);

  const editableFacilities = useMemo(() => {
    if (!workspace) {
      return [];
    }

    return mode === 'edit'
      ? workspace.facilities.filter((facility) => facility.type === 'farm')
      : workspace.facilities;
  }, [workspace, mode]);

  const facilityBoardGroups = useMemo(() => {
    if (!workspace) {
      return [];
    }

    const filtered = editableFacilities.filter((facility) => {
      const query = normalizeQuery(facilitySearch);
      if (!query) {
        return true;
      }

      return (
        matchesQuery(facility.pathLabel, facilitySearch) ||
        matchesQuery(facility.code, facilitySearch) ||
        matchesQuery(facility.name, facilitySearch) ||
        matchesQuery(facility.type, facilitySearch)
      );
    });

    return FACILITY_TYPE_ORDER.map((type) => ({
      type,
      label: FACILITY_TYPE_LABELS[type],
      facilities: filtered.filter((facility) => facility.type === type),
    })).filter((group) => group.facilities.length > 0);
  }, [editableFacilities, facilitySearch]);

  useEffect(() => {
    let active = true;

    if (!open || !workspace || mode !== 'create') {
      setRolePermissionLoadingRoleId(null);
      setRolePermissionError(null);
      return () => {
        active = false;
      };
    }

    const roleIdsToLoad = Array.from(
      new Set(
        (form?.permissionOverrides ?? [])
          .map((item) => item.roleId)
          .filter((roleId): roleId is number => typeof roleId === 'number' && roleId > 0),
      ),
    );
    const roleIdToLoad = roleIdsToLoad.find((roleId) => {
      const hasSelectedFacility = (form?.permissionOverrides ?? []).some(
        (item) => item.roleId === roleId && item.facilityNodeId !== null,
      );
      return hasSelectedFacility && !rolePermissionCacheRef.current[roleId] && !globalRolePermissionCacheRef[roleId] && rolePermissionLoadingRoleId !== roleId;
    });

    if (!roleIdToLoad) {
      setRolePermissionLoadingRoleId(null);
      setRolePermissionError(null);
      return () => {
        active = false;
      };
    }

    setRolePermissionLoadingRoleId(roleIdToLoad);
    setRolePermissionError(null);

    void rolePermissionsService
      .getByRoleId(roleIdToLoad, { includeInactive: true })
      .then((permissions) => {
        if (!active) {
          return;
        }

        const normalized = permissions
          .map((permission) => ({
            permissionId: permission.permissionId,
            permissionCode: permission.permissionCode,
            description: permission.description,
          }))
          .filter((permission) => permission.permissionId > 0)
          .sort((left, right) => left.permissionCode.localeCompare(right.permissionCode));
        globalRolePermissionCacheRef[roleIdToLoad] = normalized;
        rolePermissionCacheRef.current = {
          ...rolePermissionCacheRef.current,
          [roleIdToLoad]: normalized,
        };
        setRolePermissionCatalog((current) => ({
          ...current,
          [roleIdToLoad]: normalized,
        }));
      })
      .catch((error) => {
        if (!active) {
          return;
        }

        setRolePermissionError(error instanceof Error ? error.message : 'Failed to load permissions.');
        setRolePermissionCatalog((current) => ({
          ...current,
          [roleIdToLoad]: [],
        }));
      })
      .finally(() => {
        if (active) {
          setRolePermissionLoadingRoleId((current) => (current === roleIdToLoad ? null : current));
        }
      });

    return () => {
      active = false;
    };
  }, [open, workspace, mode, form, rolePermissionLoadingRoleId]);

  const permissionQueryCatalogRef = useRef(permissionQueryCatalog);
  permissionQueryCatalogRef.current = permissionQueryCatalog;
  const permissionQueryLoadingKeysRef = useRef(permissionQueryLoadingKeys);
  permissionQueryLoadingKeysRef.current = permissionQueryLoadingKeys;

  useEffect(() => {
    let active = true;

    if (!open || !workspace || !form || mode !== 'edit' || !userId) {
      editPermissionQuerySignatureRef.current = null;
      return () => {
        active = false;
      };
    }

    const targetMap = new Map<string, { key: string; roleId: number; facilityNodeId: number }>();
    const addTarget = (roleId: number, facilityNodeId: number) => {
      if (roleId <= 0 || facilityNodeId <= 0) {
        return;
      }

      const key = buildPermissionQueryKey(roleId, facilityNodeId);
      if (!targetMap.has(key)) {
        targetMap.set(key, { key, roleId, facilityNodeId });
      }
    };

    (form.selectedRoleIds ?? [])
      .filter((roleId) => roleId > 0)
      .forEach((roleId) => {
        (form.selectedFacilityNodeIds ?? [])
          .filter((facilityNodeId) => facilityNodeId > 0)
          .forEach((facilityNodeId) => addTarget(roleId, facilityNodeId));
      });

    form.permissionOverrides.forEach((item) => {
      if (item.roleId && item.facilityNodeId !== null) {
        addTarget(item.roleId, item.facilityNodeId);
      }
    });

    const targetSignature = Array.from(targetMap.keys()).sort().join('|');
    if (editPermissionQuerySignatureRef.current === targetSignature) {
      return () => {
        active = false;
      };
    }

    const targets = Array.from(targetMap.values());
    const missingTargets = targets.filter(
      (target) => !permissionQueryCatalogRef.current[target.key] && !permissionQueryLoadingKeysRef.current[target.key] && !globalPermissionQueryCacheRef[target.key],
    );

    editPermissionQuerySignatureRef.current = targetSignature;

    if (missingTargets.length === 0) {
      return () => {
        active = false;
      };
    }

    missingTargets.forEach((target) => {
      setPermissionQueryLoadingKeys((current) => ({
        ...current,
        [target.key]: true,
      }));
      setPermissionQueryErrors((current) => {
        const next = { ...current };
        delete next[target.key];
        return next;
      });

      void userAssignmentsService
        .queryPermissions(userId, {
          roleIds: [target.roleId],
          facilityNodeId: target.facilityNodeId,
          includeUserOverrides: true,
          includeCandidatePermissions: true,
          page: 1,
          pageSize: 200,
        })
        .then((response) => {
          if (!active) {
            return;
          }

          const sortedResponse = {
            ...response,
            permissions: [...response.permissions].sort((left, right) =>
              left.permissionCode.localeCompare(right.permissionCode),
            ),
          };
          globalPermissionQueryCacheRef[target.key] = sortedResponse;
          setPermissionQueryCatalog((current) => ({
            ...current,
            [target.key]: sortedResponse,
          }));
        })
        .catch((error) => {
          if (!active) {
            return;
          }

          setPermissionQueryCatalog((current) => ({
            ...current,
            [target.key]: {
              userId,
              facilityNodeId: target.facilityNodeId,
              facilityCode: '',
              facilityName: '',
              facilityType: '',
              facilityPath: '',
              roles: [],
              permissions: [],
              totalCount: 0,
              page: 1,
              pageSize: 200,
              queryMode: 'role-farm',
            },
          }));
          setPermissionQueryErrors((current) => ({
            ...current,
            [target.key]: error instanceof Error ? error.message : 'Failed to load permissions.',
          }));
        })
        .finally(() => {
          if (!active) {
            return;
          }

          setPermissionQueryLoadingKeys((current) => {
            if (!current[target.key]) {
              return current;
            }
            const next = { ...current };
            delete next[target.key];
            return next;
          });
        });
    });

    return () => {
      active = false;
    };
  }, [open, workspace, form, mode, userId]);

  const baselinePermissionCount = useMemo(() => {
    if (!workspace || !form) {
      return 0;
    }
    const permissionIds = new Set<number>();

    if (mode === 'edit') {
      Object.values(permissionQueryCatalog).forEach((query) => {
        query.permissions
          .filter((permission) => permission.fromSelectedRole)
          .forEach((permission) => {
            permissionIds.add(permission.permissionId);
          });
      });
    } else {
      form.selectedRoleIds.forEach((roleId) => {
        (rolePermissionCatalog[roleId] ?? []).forEach((permission) => {
          permissionIds.add(permission.permissionId);
        });
      });
    }

    return permissionIds.size;
  }, [workspace, form, mode, permissionQueryCatalog, rolePermissionCatalog]);

  const loadRolePermissionOptions = useCallback((roleId: number | null) => {
    if (!roleId || roleId <= 0) {
      return [];
    }

    return rolePermissionCatalog[roleId] ?? rolePermissionCacheRef.current[roleId] ?? globalRolePermissionCacheRef[roleId] ?? [];
  }, [rolePermissionCatalog]);

  const loadPermissionQueryOptions = useCallback((roleId: number | null, facilityNodeId: number | null) => {
    if (!roleId || roleId <= 0 || facilityNodeId === null || facilityNodeId <= 0) {
      return [];
    }

    const key = buildPermissionQueryKey(roleId, facilityNodeId);
    return permissionQueryCatalog[key]?.permissions ?? globalPermissionQueryCacheRef[key]?.permissions ?? [];
  }, [permissionQueryCatalog]);

  const getPermissionOptionsForOverride = useCallback((override: UserAssignmentPermissionOverrideFormItem): PermissionOptionViewModel[] => {
    if (mode === 'edit' && override.roleId && override.facilityNodeId !== null) {
      return loadPermissionQueryOptions(override.roleId, override.facilityNodeId).map((permission) => ({
        permissionId: permission.permissionId,
        permissionCode: permission.permissionCode,
        description: permission.description,
        resource: permission.resource,
        action: permission.action,
        isAssignable: permission.isAssignable,
        fromSelectedRole: permission.fromSelectedRole,
        sourceRoleIds: permission.sourceRoleIds,
        sourceRoleNames: permission.sourceRoleNames,
        hasUserAllow: permission.hasUserAllow,
        hasUserDeny: permission.hasUserDeny,
        isEffectiveAllowed: permission.isEffectiveAllowed,
        decisionReason: permission.decisionReason,
      }));
    }

    return loadRolePermissionOptions(override.roleId).map((permission) => ({
      permissionId: permission.permissionId,
      permissionCode: permission.permissionCode,
      description: permission.description,
      resource: '',
      action: '',
      isAssignable: true,
      fromSelectedRole: true,
      sourceRoleIds: [],
      sourceRoleNames: [],
      hasUserAllow: false,
      hasUserDeny: false,
      isEffectiveAllowed: true,
      decisionReason: 'Granted by the selected role(s).',
    }));
  }, [mode, loadPermissionQueryOptions, loadRolePermissionOptions]);

  const getPermissionLoadStateForOverride = useCallback((override: UserAssignmentPermissionOverrideFormItem) => {
    if (mode === 'edit' && override.roleId && override.facilityNodeId !== null) {
      const key = buildPermissionQueryKey(override.roleId, override.facilityNodeId);
      return {
        loading: Boolean(permissionQueryLoadingKeys[key]),
        error: permissionQueryErrors[key] ?? null,
        key,
      };
    }

    return {
      loading: rolePermissionLoadingRoleId === override.roleId,
      error: rolePermissionError,
      key: override.roleId ? String(override.roleId) : null,
    };
  }, [mode, permissionQueryLoadingKeys, permissionQueryErrors, rolePermissionLoadingRoleId, rolePermissionError]);

  const getSelectedPermissionLabel = useCallback((override: UserAssignmentPermissionOverrideFormItem) => {
    if (!override.permissionId || override.permissionId <= 0) {
      return 'Not selected';
    }

    const permission = getPermissionOptionsForOverride(override).find(
      (item) => item.permissionId === override.permissionId,
    );
    return permission?.permissionCode ?? String(override.permissionId);
  }, [getPermissionOptionsForOverride]);

  const permissionStepStatus = useMemo(() => {
    if (!form) {
      return 'Choose role and farm';
    }

    const activeOverride = form.permissionOverrides.find(
      (item) => item.roleId && item.facilityNodeId !== null,
    );

    if (!activeOverride?.roleId) {
      return 'Choose role and farm';
    }

    if (mode === 'edit' && activeOverride.facilityNodeId !== null) {
      const key = buildPermissionQueryKey(activeOverride.roleId, activeOverride.facilityNodeId);
      if (permissionQueryLoadingKeys[key]) {
        return 'Loading permissions...';
      }
      if (permissionQueryErrors[key]) {
        return 'Permission load failed';
      }
      if (!loadPermissionQueryOptions(activeOverride.roleId, activeOverride.facilityNodeId).length) {
        return 'Permissions not loaded yet';
      }
      return `${loadPermissionQueryOptions(activeOverride.roleId, activeOverride.facilityNodeId).length} permissions ready`;
    }

    if (rolePermissionLoadingRoleId === activeOverride.roleId) {
      return 'Loading permissions...';
    }

    if (!loadRolePermissionOptions(activeOverride.roleId).length) {
      return 'Permissions not loaded yet';
    }

    return `${loadRolePermissionOptions(activeOverride.roleId).length} permissions ready`;
  }, [form, mode, permissionQueryLoadingKeys, permissionQueryErrors, permissionQueryCatalog, rolePermissionLoadingRoleId, rolePermissionCatalog]);

  const updateForm = useCallback((updater: (current: UserAssignmentEditorFormState) => UserAssignmentEditorFormState) => {
    setForm((current) => {
      if (!current) {
        return current;
      }
      return updater(current);
    });
  }, []);

  // ---- Load permissions when Role + Farm filter selected ----
  useEffect(() => {
    if (!overrideRoleFilter || !overrideFacilityFilter || !form?.userId) {
      setOverridePermissions([]);
      return;
    }

    let active = true;
    setOverridePermissionsLoading(true);

    userAssignmentsService
      .queryPermissions(form.userId, {
        roleIds: [overrideRoleFilter],
        facilityNodeId: overrideFacilityFilter,
        includeUserOverrides: true,
        includeCandidatePermissions: true,
        pageSize: 500,
      })
      .then((result) => {
        if (!active) return;
        setOverridePermissions(result.permissions);
      })
      .catch(() => {
        if (!active) return;
        setOverridePermissions([]);
      })
      .finally(() => {
        if (active) setOverridePermissionsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [overrideRoleFilter, overrideFacilityFilter, form?.userId]);

  // ---- Override toggle helpers ----
  const findExistingOverride = useCallback(
    (permissionId: number) => {
      if (!overrideRoleFilter || !overrideFacilityFilter) return undefined;
      return (form?.permissionOverrides ?? []).find(
        (o) =>
          o.roleId === overrideRoleFilter &&
          o.facilityNodeId === overrideFacilityFilter &&
          o.permissionId === permissionId,
      );
    },
    [form?.permissionOverrides, overrideRoleFilter, overrideFacilityFilter],
  );

  const handleTogglePermissionEffect = useCallback(
    (permission: UserAssignmentPermissionQueryRow, effect: 'allow' | 'deny') => {
      if (!overrideRoleFilter || !overrideFacilityFilter) return;
      const existing = findExistingOverride(permission.permissionId);

      if (existing) {
        updateForm((current) => ({
          ...current,
          permissionOverrides: current.permissionOverrides.map((item) =>
            item.localId === existing.localId ? { ...item, effect } : item,
          ),
        }));
      } else {
        updateForm((current) => ({
          ...current,
          permissionOverrides: [
            ...current.permissionOverrides,
            {
              localId: newLocalId(),
              roleId: overrideRoleFilter,
              facilityNodeId: overrideFacilityFilter,
              permissionId: permission.permissionId,
              effect,
              note: '',
            },
          ],
        }));
      }
    },
    [overrideRoleFilter, overrideFacilityFilter, findExistingOverride, updateForm],
  );

  const handlePermissionNoteChange = useCallback(
    (permissionId: number, note: string) => {
      const existing = findExistingOverride(permissionId);
      if (existing) {
        updateForm((current) => ({
          ...current,
          permissionOverrides: current.permissionOverrides.map((item) =>
            item.localId === existing.localId ? { ...item, note } : item,
          ),
        }));
      }
    },
    [findExistingOverride, updateForm],
  );

  const handleResetPermission = useCallback(
    (permissionId: number) => {
      const existing = findExistingOverride(permissionId);
      if (existing) {
        updateForm((current) => ({
          ...current,
          permissionOverrides: current.permissionOverrides.filter(
            (item) => item.localId !== existing.localId,
          ),
        }));
      }
    },
    [findExistingOverride, updateForm],
  );

  const handleSave = async () => {
    if (!form || !workspace) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const result = await saveUserAssignment({
        userId: form.userId,
        mode,
        identity: form.identity,
        selectedRoleIds: form.selectedRoleIds,
        selectedFacilityNodeIds: form.selectedFacilityNodeIds,
        permissionOverrides: form.permissionOverrides,
      });

      const firstAssignableOverride = form.permissionOverrides.find(
        (item) => item.permissionId && item.roleId && item.permissionId > 0 && item.roleId > 0,
      );
      const previewResult =
        firstAssignableOverride && result.userId
          ? await runBackendPreview(
              result.userId,
              firstAssignableOverride.permissionId!,
              firstAssignableOverride.facilityNodeId,
            )
          : null;

      const previewText = previewResult
        ? `Preview: ${previewResult.permissionCode} is ${previewResult.isAllowed ? 'allowed' : 'denied'}.\n${previewResult.decisionReason}`
        : 'Save completed.';

      await Swal.fire({
        icon: 'success',
        title: 'Saved',
        text: previewText,
        confirmButtonColor: '#2563eb',
      });

      setPreview(previewResult);
      await onSaved();
      onClose();
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Failed to save user assignment.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (!open || !workspace) {
    return null;
  }

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="lg"
      scroll="paper"
      fullScreen={isMobile}
      PaperProps={{ sx: dialogPaperSx }}
    >
      <DialogTitleWithClose
        onClose={onClose}
        disabled={saving}
        component="div"
        sx={{
          pb: 1.5,
          px: { xs: 2, md: 3 },
          pt: { xs: 2, md: 2.5 },
          borderBottom: '1px solid',
          borderColor: alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.7 : 1),
        }}
      >
        {mode === 'create' ? 'Add User Assignment' : `Edit User Assignment${form?.identity.username ? ` · ${form.identity.username}` : ''}`}
      </DialogTitleWithClose>

      <Box
        sx={{
          px: { xs: 2, md: 3 },
          pt: { xs: 1.75, md: 2 },
          pb: 1.5,
          borderBottom: '1px solid',
          borderColor: alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.55 : 0.9),
          background:
            theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.82)
              : alpha('#f8faf8', 0.95),
        }}
      >
        <Stack spacing={1.25}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label={`${selectedRoleNames.length} บทบาท`} sx={chipSx} />
            <Chip label={`${selectedFacilityNodeIds.length} ${mode === 'edit' ? 'ฟาร์ม' : 'ขอบเขต'}`} sx={chipSx} />
            <Chip label={`${form?.permissionOverrides.length ?? 0} overrides`} sx={chipSx} />
            <Chip label={`${baselinePermissionCount} baseline`} sx={chipSx} />
            <Chip label={rolePermissionError ? 'Permission load failed' : permissionStepStatus} sx={chipSx} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            จัดการผู้ใช้แบบแยกส่วน: ข้อมูลพื้นฐาน, บทบาท, ขอบเขต, และสิทธิ์เฉพาะราย user
          </Typography>
        </Stack>
      </Box>

      <DialogContent
        dividers
        sx={{
          px: { xs: 2, md: 3 },
          py: { xs: 2, md: 2.5 },
          borderColor: alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.65 : 1),
          bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.86 : 1),
        }}
      >
        <Stack spacing={2.25}>
          {error && <Alert severity="error">{error}</Alert>}
          {detailState.loading && mode === 'edit' && <Alert severity="info">Loading user details...</Alert>}
          {detailState.error && <Alert severity="error">{detailState.error}</Alert>}

          <Paper variant="outlined" sx={sectionPaperSx}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  Identity
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  ข้อมูลบัญชีและสถานะการใช้งานของ user
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 220px' }}>
                  <TextField
                    label="Username"
                    value={form?.identity.username ?? ''}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        identity: { ...current.identity, username: event.target.value },
                      }))
                    }
                    fullWidth
                    disabled={mode === 'edit' || saving}
                    sx={textFieldSx}
                  />
                </Box>
                <Box sx={{ flex: '1 1 220px' }}>
                  <TextField
                    label="Password"
                    type="password"
                    value={form?.identity.password ?? ''}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        identity: { ...current.identity, password: event.target.value },
                      }))
                    }
                    fullWidth
                    disabled={mode === 'edit' || saving}
                    helperText={mode === 'edit' ? 'Leave blank to keep the current password.' : 'Required for new users.'}
                    sx={textFieldSx}
                  />
                </Box>
                <Box sx={{ flex: '1 1 220px' }}>
                  <TextField
                    label="Email"
                    value={form?.identity.email ?? ''}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        identity: { ...current.identity, email: event.target.value },
                      }))
                    }
                    fullWidth
                    disabled={saving}
                    sx={textFieldSx}
                  />
                </Box>
                <Box sx={{ flex: '1 1 220px' }}>
                  <TextField
                    label="Prefix"
                    value={form?.identity.prefix ?? ''}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        identity: { ...current.identity, prefix: event.target.value },
                      }))
                    }
                    fullWidth
                    disabled={saving}
                    sx={textFieldSx}
                  />
                </Box>
                <Box sx={{ flex: '1 1 220px' }}>
                  <TextField
                    label="First name"
                    value={form?.identity.firstName ?? ''}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        identity: { ...current.identity, firstName: event.target.value },
                      }))
                    }
                    fullWidth
                    disabled={saving}
                    sx={textFieldSx}
                  />
                </Box>
                <Box sx={{ flex: '1 1 220px' }}>
                  <TextField
                    label="Last name"
                    value={form?.identity.lastName ?? ''}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        identity: { ...current.identity, lastName: event.target.value },
                      }))
                    }
                    fullWidth
                    disabled={saving}
                    sx={textFieldSx}
                  />
                </Box>
                <Box sx={{ flex: '1 1 220px' }}>
                  <TextField
                    label="Company"
                    select
                    value={form?.identity.companyId ?? ''}
                    onChange={(event) =>
                      updateForm((current) => ({
                        ...current,
                        identity: {
                          ...current.identity,
                          companyId: event.target.value ? Number(event.target.value) : null,
                        },
                      }))
                    }
                    fullWidth
                    disabled={saving}
                    sx={textFieldSx}
                    helperText="เลือกบริษัทที่สังกัด"
                  >
                    {workspace.companies.map((company) => (
                      <MenuItem key={company.id} value={company.id} disabled={!company.isActive}>
                        {company.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
                <Box sx={{ flexBasis: '100%' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={form?.identity.isActive ?? true}
                        onChange={(event) =>
                          updateForm((current) => ({
                            ...current,
                            identity: { ...current.identity, isActive: event.target.checked },
                          }))
                        }
                        disabled={saving}
                      />
                    }
                    label="Active"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={sectionPaperSx}>
            <Stack spacing={2}>
              <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                    {mode === 'edit' ? 'Roles and Farms' : 'Roles and Scopes'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {mode === 'edit'
                      ? 'เลือกบทบาทและฟาร์มก่อนค่อยกำหนด permission ที่ต้องการ'
                      : 'เลือกบทบาทหลักและขอบเขตการเข้าถึงก่อนกำหนด override รายการเฉพาะ'}
                  </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 320px' }}>
                  <TextField
                    select
                    label="Roles"
                    value={selectedRoleIds}
                    onChange={(event) => {
                      const value = event.target.value as string | number[];
                      const nextRoleIds = Array.isArray(value) ? value.map(Number) : value.split(',').map(Number);
                      const normalizedRoleIds = nextRoleIds.filter((roleId) => Number.isFinite(roleId) && roleId > 0);
                      const fallbackRoleId = normalizedRoleIds[0] ?? workspace.roles[0]?.id ?? null;
                      updateForm((current) => ({
                        ...current,
                        selectedRoleIds: normalizedRoleIds,
                        permissionOverrides: current.permissionOverrides.map((item) => ({
                          ...item,
                          roleId:
                            item.roleId && normalizedRoleIds.includes(item.roleId)
                              ? item.roleId
                              : fallbackRoleId,
                          permissionId:
                            item.roleId && normalizedRoleIds.includes(item.roleId) ? item.permissionId : null,
                        })),
                      }));
                    }}
                    fullWidth
                    SelectProps={{
                      multiple: true,
                      renderValue: (selected) => {
                        const roleIds = selected as number[];
                        return (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {roleIds.map((roleId) => {
                              const role = workspace.roles.find((item) => item.id === roleId);
                              return <Chip key={roleId} size="small" label={role?.name ?? roleId} sx={chipSx} />;
                            })}
                          </Stack>
                        );
                      },
                    }}
                    disabled={saving}
                    sx={textFieldSx}
                    helperText="เลือกได้หลายบทบาท"
                  >
                    {workspace.roles.map((role) => (
                      <MenuItem key={role.id} value={role.id} disabled={!role.isActive}>
                        <Checkbox checked={selectedRoleIds.includes(role.id)} />
                        <ListItemText primary={formatRoleLabel(role.name, role.permissionCount, role.isActive)} />
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
                <Box sx={{ flex: '1 1 320px' }}>
                  <TextField
                    select
                    label={mode === 'edit' ? 'Farms' : 'Scopes'}
                    value={selectedFacilityNodeIds}
                    onChange={(event) => {
                      const value = event.target.value as string | number[];
                      const nextScopeIds = Array.isArray(value) ? value.map(Number) : value.split(',').map(Number);
                      updateForm((current) => ({
                        ...current,
                        selectedFacilityNodeIds: nextScopeIds.filter((facilityId) => Number.isFinite(facilityId) && facilityId > 0),
                      }));
                    }}
                    fullWidth
                    SelectProps={{
                      multiple: true,
                      renderValue: (selected) => {
                        const scopeIds = selected as number[];
                        return (
                          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                            {scopeIds.map((facilityId) => {
                              const facility = workspace.facilities.find((item) => item.id === facilityId);
                              return <Chip key={facilityId} size="small" label={facility?.pathLabel ?? facilityId} sx={chipSx} />;
                            })}
                          </Stack>
                        );
                      },
                    }}
                    disabled={saving}
                    sx={textFieldSx}
                    helperText={mode === 'edit' ? 'เลือกได้หลายฟาร์ม' : 'เลือกได้หลายขอบเขต'}
                  >
                    {editableFacilities.map((facility) => (
                      <MenuItem key={facility.id} value={facility.id} disabled={!facility.isActive}>
                        <Checkbox checked={selectedFacilityNodeIds.includes(facility.id)} />
                        <ListItemText primary={formatFacilityLabel(facility.pathLabel, facility.isActive)} />
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
              </Box>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={sectionPaperSx}>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2}>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                    Permission Overrides
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    กำหนดสิทธิ์พิเศษ (allow/deny) สำหรับ user นี้ ทีละรายการ
                  </Typography>
                </Box>
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  select
                  size="small"
                  label="Role"
                  value={overrideRoleFilter}
                  onChange={(event) => {
                    setOverrideRoleFilter(event.target.value ? Number(event.target.value) : '');
                    setOverrideFacilityFilter('');
                  }}
                  sx={{ minWidth: 180, ...textFieldSx }}
                >
                  <MenuItem value="">
                    <em>— เลือกบทบาท —</em>
                  </MenuItem>
                  {workspace.roles
                    .filter((role) => selectedRoleIds.includes(role.id))
                    .map((role) => (
                      <MenuItem key={role.id} value={role.id}>
                        {role.name}
                      </MenuItem>
                    ))}
                </TextField>
                <TextField
                  select
                  size="small"
                  label={mode === 'edit' ? 'Farm' : 'Scope'}
                  value={overrideFacilityFilter}
                  onChange={(event) => {
                    setOverrideFacilityFilter(event.target.value ? Number(event.target.value) : '');
                  }}
                  disabled={!overrideRoleFilter}
                  sx={{ minWidth: 180, ...textFieldSx }}
                >
                  <MenuItem value="">
                    <em>— เลือกฟาร์ม —</em>
                  </MenuItem>
                  {editableFacilities
                    .filter((f) => selectedFacilityNodeIds.includes(f.id))
                    .map((facility) => (
                      <MenuItem key={facility.id} value={facility.id} disabled={!facility.isActive}>
                        {facility.pathLabel}
                      </MenuItem>
                    ))}
                </TextField>
              </Stack>

              {!overrideFacilityFilter ? (
                <Paper
                  variant="outlined"
                  sx={{
                    borderRadius: 10,
                    borderColor: alpha(theme.palette.warning.main, 0.4),
                    bgcolor: alpha(theme.palette.warning.main, 0.04),
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <VpnKeyIcon fontSize="small" sx={{ color: theme.palette.warning.main }} />
                  <Typography variant="body2" color="text.secondary">
                    เลือก Role และ Farm เพื่อโหลดรายการ permission
                  </Typography>
                </Paper>
              ) : overridePermissionsLoading ? (
                <Stack spacing={1.5}>
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} variant="rounded" height={44} sx={{ borderRadius: 10}} />
                  ))}
                </Stack>
              ) : (
                <TableContainer
                  sx={{
                    maxHeight: 520,
                    borderRadius: 10,
                    border: '1px solid',
                    borderColor: alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.65 : 0.9),
                  }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ ...tableHeaderSx, width: 44 }}>#</TableCell>
                        <TableCell sx={{ ...tableHeaderSx, minWidth: 220 }}>Permission</TableCell>
                        <TableCell sx={{ ...tableHeaderSx, minWidth: 120 }}>Effect</TableCell>
                        <TableCell sx={{ ...tableHeaderSx, minWidth: 140 }}>Note</TableCell>
                        <TableCell sx={{ ...tableHeaderSx, width: 48 }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {overridePermissions
                        .filter((p) => {
                          const q = normalizeQuery(permissionSearch);
                          if (!q) return true;
                          return (
                            matchesQuery(p.permissionCode, permissionSearch) ||
                            matchesQuery(p.description, permissionSearch) ||
                            matchesQuery(p.resource, permissionSearch) ||
                            matchesQuery(p.action, permissionSearch)
                          );
                        })
                        .map((permission, index) => {
                          const existingOverride = findExistingOverride(permission.permissionId);
                          const isAllowed = existingOverride
                            ? existingOverride.effect === 'allow'
                            : permission.isEffectiveAllowed;
                          const isChanged = !!existingOverride;

                          return (
                            <TableRow
                              key={permission.permissionId}
                              hover
                              sx={{
                                bgcolor: isChanged
                                  ? alpha(theme.palette.warning.main, 0.04)
                                  : 'transparent',
                              }}
                            >
                              <TableCell sx={{ color: 'text.secondary', fontWeight: 700 }}>
                                {index + 1}
                              </TableCell>

                              {/* Permission */}
                              <TableCell>
                                <Stack spacing={0.25}>
                                  <Stack direction="row" spacing={0.75} alignItems="center">
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 600, fontSize: '13px', fontFamily: 'monospace' }}
                                    >
                                      {permission.permissionCode}
                                    </Typography>
                                    {permission.hasUserAllow && !isChanged && (
                                      <Chip size="small" label="Allow" color="success" variant="outlined" sx={{ height: 18, fontSize: '10px', fontWeight: 700 }} />
                                    )}
                                    {permission.hasUserDeny && !isChanged && (
                                      <Chip size="small" label="Deny" color="error" variant="outlined" sx={{ height: 18, fontSize: '10px', fontWeight: 700 }} />
                                    )}
                                    {isChanged && (
                                      <Chip size="small" label="เปลี่ยน" color="warning" sx={{ height: 18, fontSize: '10px', fontWeight: 700 }} />
                                    )}
                                  </Stack>
                                  {permission.description && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {permission.description}
                                    </Typography>
                                  )}
                                </Stack>
                              </TableCell>

                              {/* Effect */}
                              <TableCell>
                                <Stack direction="row" spacing={0.5}>
                                  <Chip
                                    size="small"
                                    label="Allow"
                                    color={isAllowed ? 'success' : 'default'}
                                    variant={isAllowed ? 'filled' : 'outlined'}
                                    clickable={!saving}
                                    onClick={() => handleTogglePermissionEffect(permission, 'allow')}
                                    sx={{ fontWeight: 700 }}
                                  />
                                  <Chip
                                    size="small"
                                    label="Deny"
                                    color={!isAllowed ? 'error' : 'default'}
                                    variant={!isAllowed ? 'filled' : 'outlined'}
                                    clickable={!saving}
                                    onClick={() => handleTogglePermissionEffect(permission, 'deny')}
                                    sx={{ fontWeight: 700 }}
                                  />
                                </Stack>
                              </TableCell>

                              {/* Note */}
                              <TableCell>
                                <TextField
                                  size="small"
                                  fullWidth
                                  value={existingOverride?.note ?? ''}
                                  onChange={(event) =>
                                    handlePermissionNoteChange(permission.permissionId, event.target.value)
                                  }
                                  disabled={saving || !isChanged}
                                  placeholder={isChanged ? 'หมายเหตุ' : '—'}
                                  sx={textFieldSx}
                                />
                              </TableCell>

                              {/* Action */}
                              <TableCell>
                                {isChanged && (
                                  <IconButton
                                    size="small"
                                    onClick={() => handleResetPermission(permission.permissionId)}
                                    disabled={saving}
                                    title="รีเซ็ตเป็นค่าเริ่มต้น"
                                    sx={{ color: 'text.secondary', '&:hover': { color: theme.palette.warning.main } }}
                                  >
                                    <RestartAlt fontSize="small" />
                                  </IconButton>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={`${form?.permissionOverrides.length ?? 0} overrides`} sx={chipSx} />
                <Chip label={`${baselinePermissionCount} baseline permissions`} sx={chipSx} />
                {overridePermissions.length > 0 && (
                  <Chip label={`${overridePermissions.length} loaded for this combo`} sx={chipSx} />
                )}
              </Stack>
            </Stack>
          </Paper>

          <Paper variant="outlined" sx={sectionPaperSx}>
            <Stack spacing={1.5}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                  Effective Access Preview
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  สรุปสถานะสิทธิ์ก่อนบันทึก เพื่อเช็กความครบถ้วนได้รวดเร็ว
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={`${selectedRoleNames.length} roles`} sx={chipSx} />
                <Chip
                  label={`${form?.selectedFacilityNodeIds.length ?? 0} ${mode === 'edit' ? 'farms' : 'scopes'}`}
                  sx={chipSx}
                />
                <Chip label={`${form?.permissionOverrides.length ?? 0} overrides`} sx={chipSx} />
                <Chip label={`${baselinePermissionCount} baseline permissions`} sx={chipSx} />
              </Stack>
              <Alert severity="info">
                Separate role, scope, and override selections are kept in the form and saved together as one assignment payload.
              </Alert>
              {preview && (
                <Alert severity={preview.isAllowed ? 'success' : 'warning'}>
                  {preview.permissionCode}: {preview.decisionReason}
                </Alert>
              )}
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: { xs: 2, md: 3 },
          py: 2,
          gap: 1,
          flexDirection: { xs: 'column-reverse', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          justifyContent: { sm: 'space-between' },
          borderTop: '1px solid',
          borderColor: alpha(theme.palette.divider, theme.palette.mode === 'dark' ? 0.7 : 1),
          bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === 'dark' ? 0.9 : 1),
        }}
      >
        <Button startIcon={<RestartAlt />} onClick={onClose} disabled={saving} sx={{ minHeight: 40 }}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || !form} sx={{ minHeight: 40, fontWeight: 700 }}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
