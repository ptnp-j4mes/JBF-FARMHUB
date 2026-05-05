'use client';

import React, {
  useCallback,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type {
  AdminFarm,
  AdminHouse,
  AdminPen,
  AdminSilo,
  AdminZone,
  AdminRole,
  AdminRolePermissions,
  UserAssignmentWorkspaceData,
  AdminUserAssignment,
  SaveFarmPayload,
  SaveHousePayload,
  SavePenPayload,
  SaveSiloPayload,
  SaveZonePayload,
  SaveRolePayload,
  SaveUserAssignmentPayload,
  ScopeNodeType,
  UsersDataSource,
  UsersWorkspaceMode,
} from '../types';
import { usersApi } from '../services';
import { warmUserAssignmentPermissionCatalog } from '@/lib/access/modules/user-assignment.guard';

export type {
  AdminFarm,
  AdminHouse,
  AdminOrganizationInfo,
  AdminPen,
  AdminSilo,
  AdminPermissionByFeature,
  AdminZone,
  AdminRole,
  AdminRolePermissions,
  AdminRoleScope,
  AdminScopeStatus,
  AdminUserAssignment,
} from '../types';

type UserAssignmentDataContextValue = {
  dataSource: UsersDataSource;
  loadError: string | null;
  isHydrated: boolean;
  isMutating: boolean;
  roles: AdminRole[];
  setRoles: React.Dispatch<React.SetStateAction<AdminRole[]>>;
  farms: AdminFarm[];
  setFarms: React.Dispatch<React.SetStateAction<AdminFarm[]>>;
  zones: AdminZone[];
  setZones: React.Dispatch<React.SetStateAction<AdminZone[]>>;
  houses: AdminHouse[];
  setHouses: React.Dispatch<React.SetStateAction<AdminHouse[]>>;
  pens: AdminPen[];
  setPens: React.Dispatch<React.SetStateAction<AdminPen[]>>;
  silos: AdminSilo[];
  setSilos: React.Dispatch<React.SetStateAction<AdminSilo[]>>;
  assignments: AdminUserAssignment[];
  setAssignments: React.Dispatch<React.SetStateAction<AdminUserAssignment[]>>;
  rolePermissions: AdminRolePermissions;
  setRolePermissions: React.Dispatch<React.SetStateAction<AdminRolePermissions>>;
  reloadWorkspace: () => Promise<void>;
  saveUserAssignment: (payload: SaveUserAssignmentPayload) => Promise<void>;
  deleteUserAssignment: (assignmentId: number) => Promise<void>;
  saveRole: (payload: SaveRolePayload) => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;
  saveFarm: (payload: SaveFarmPayload) => Promise<void>;
  saveZone: (payload: SaveZonePayload) => Promise<void>;
  saveHouse: (payload: SaveHousePayload) => Promise<void>;
  savePen: (payload: SavePenPayload) => Promise<void>;
  saveSilo: (payload: SaveSiloPayload) => Promise<void>;
  deleteScopeNode: (type: ScopeNodeType, id: number) => Promise<void>;
  deleteSilo: (siloId: number) => Promise<void>;
};

type UserAssignmentDataPayload = Pick<
  UserAssignmentDataContextValue,
  'roles' | 'farms' | 'zones' | 'houses' | 'pens' | 'silos' | 'assignments' | 'rolePermissions'
>;

const userAssignmentDataSource: UsersDataSource = 'server';
const userAssignmentService = usersApi;
const EMPTY_ROLE_PERMISSIONS: AdminRolePermissions = {};
const workspaceCache = new Map<UsersWorkspaceMode, UserAssignmentWorkspaceData>();
const workspaceRequestCache = new Map<UsersWorkspaceMode, Promise<UserAssignmentWorkspaceData>>();

const UserAssignmentDataContext = createContext<UserAssignmentDataContextValue | null>(null);

function cacheWorkspace(mode: UsersWorkspaceMode, workspace: UserAssignmentWorkspaceData) {
  workspaceCache.set(mode, workspace);
  return workspace;
}

export function invalidateUserAssignmentWorkspaceCache(mode?: UsersWorkspaceMode): void {
  if (mode) {
    workspaceCache.delete(mode);
    workspaceRequestCache.delete(mode);
    return;
  }

  workspaceCache.clear();
  workspaceRequestCache.clear();
}

async function getWorkspaceWithCache(
  mode: UsersWorkspaceMode,
  force = false,
): Promise<UserAssignmentWorkspaceData> {
  if (!force) {
    const cached = workspaceCache.get(mode);
    if (cached) {
      return cached;
    }

    const pending = workspaceRequestCache.get(mode);
    if (pending) {
      return pending;
    }
  }

  const request = userAssignmentService
    .getWorkspaceData(mode)
    .then((workspace) => cacheWorkspace(mode, workspace))
    .finally(() => {
      workspaceRequestCache.delete(mode);
    });

  workspaceRequestCache.set(mode, request);
  return request;
}

function toDefaultPayload(): UserAssignmentDataPayload {
  return {
    roles: [],
    farms: [],
    zones: [],
    houses: [],
    pens: [],
    silos: [],
    assignments: [],
    rolePermissions: EMPTY_ROLE_PERMISSIONS,
  };
}

export default function UserAssignmentDataProvider({
  workspaceMode = 'full',
  children,
}: {
  workspaceMode?: UsersWorkspaceMode;
  children: React.ReactNode;
}) {
  const defaults = useMemo(() => toDefaultPayload(), []);
  const cachedWorkspace = workspaceCache.get(workspaceMode);
  const [roles, setRoles] = useState<AdminRole[]>(cachedWorkspace?.roles ?? defaults.roles);
  const [farms, setFarms] = useState<AdminFarm[]>(cachedWorkspace?.farms ?? defaults.farms);
  const [zones, setZones] = useState<AdminZone[]>(cachedWorkspace?.zones ?? defaults.zones);
  const [houses, setHouses] = useState<AdminHouse[]>(cachedWorkspace?.houses ?? defaults.houses);
  const [pens, setPens] = useState<AdminPen[]>(cachedWorkspace?.pens ?? defaults.pens);
  const [silos, setSilos] = useState<AdminSilo[]>(cachedWorkspace?.silos ?? defaults.silos);
  const [assignments, setAssignments] = useState<AdminUserAssignment[]>(cachedWorkspace?.assignments ?? defaults.assignments);
  const [rolePermissions, setRolePermissions] = useState<AdminRolePermissions>(
    cachedWorkspace?.rolePermissions ?? defaults.rolePermissions,
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(Boolean(cachedWorkspace));
  const [isMutating, setIsMutating] = useState(false);

  const applyWorkspace = useCallback(
    (workspace: Partial<UserAssignmentWorkspaceData> | null | undefined) => {
      setRoles(Array.isArray(workspace?.roles) ? workspace.roles : defaults.roles);
      setFarms(Array.isArray(workspace?.farms) ? workspace.farms : defaults.farms);
      setZones(Array.isArray(workspace?.zones) ? workspace.zones : defaults.zones);
      setHouses(Array.isArray(workspace?.houses) ? workspace.houses : defaults.houses);
      setPens(Array.isArray(workspace?.pens) ? workspace.pens : defaults.pens);
      setSilos(Array.isArray(workspace?.silos) ? workspace.silos : defaults.silos);
      setAssignments(
        Array.isArray(workspace?.assignments) ? workspace.assignments : defaults.assignments,
      );
    },
    [defaults],
  );

  const runWorkspaceMutation = useCallback(
    async (mutation: () => Promise<UserAssignmentWorkspaceData>) => {
      setIsMutating(true);
      try {
        const workspace = await mutation();
        cacheWorkspace(workspaceMode, workspace);
        applyWorkspace(workspace);
        setLoadError(null);
      } finally {
        setIsMutating(false);
      }
    },
    [applyWorkspace, workspaceMode],
  );

  const reloadWorkspace = useCallback(async () => {
    try {
      const workspace = await getWorkspaceWithCache(workspaceMode, true);
      applyWorkspace(workspace);
      setLoadError(null);
    } catch {
      setLoadError('ไม่สามารถโหลดข้อมูลจริงจาก API ได้ กรุณาเข้าสู่ระบบใหม่แล้วลองอีกครั้ง');
    }
  }, [applyWorkspace, workspaceMode]);

  const saveUserAssignment = useCallback(
    async (payload: SaveUserAssignmentPayload) => {
      await runWorkspaceMutation(() => userAssignmentService.saveUserAssignment(payload));
    },
    [runWorkspaceMutation],
  );

  const deleteUserAssignment = useCallback(
    async (assignmentId: number) => {
      await runWorkspaceMutation(() => userAssignmentService.deleteUserAssignment(assignmentId));
    },
    [runWorkspaceMutation],
  );

  const saveRole = useCallback(
    async (payload: SaveRolePayload) => {
      await runWorkspaceMutation(() => userAssignmentService.saveRole(payload));
    },
    [runWorkspaceMutation],
  );

  const deleteRole = useCallback(
    async (roleId: string) => {
      await runWorkspaceMutation(() => userAssignmentService.deleteRole(roleId));
    },
    [runWorkspaceMutation],
  );

  const saveFarm = useCallback(
    async (payload: SaveFarmPayload) => {
      await runWorkspaceMutation(() => userAssignmentService.saveFarm(payload));
    },
    [runWorkspaceMutation],
  );

  const saveZone = useCallback(
    async (payload: SaveZonePayload) => {
      await runWorkspaceMutation(() => userAssignmentService.saveZone(payload));
    },
    [runWorkspaceMutation],
  );

  const saveHouse = useCallback(
    async (payload: SaveHousePayload) => {
      await runWorkspaceMutation(() => userAssignmentService.saveHouse(payload));
    },
    [runWorkspaceMutation],
  );

  const savePen = useCallback(
    async (payload: SavePenPayload) => {
      await runWorkspaceMutation(() => userAssignmentService.savePen(payload));
    },
    [runWorkspaceMutation],
  );

  const saveSilo = useCallback(
    async (payload: SaveSiloPayload) => {
      await runWorkspaceMutation(() => userAssignmentService.saveSilo(payload));
    },
    [runWorkspaceMutation],
  );

  const deleteScopeNode = useCallback(
    async (type: ScopeNodeType, id: number) => {
      await runWorkspaceMutation(() => userAssignmentService.deleteScopeNode(type, id));
    },
    [runWorkspaceMutation],
  );

  const deleteSilo = useCallback(
    async (siloId: number) => {
      await runWorkspaceMutation(() => userAssignmentService.deleteSilo(siloId));
    },
    [runWorkspaceMutation],
  );

  useEffect(() => {
    const hydrate = async () => {
      try {
        const workspace = await getWorkspaceWithCache(workspaceMode, true);
        applyWorkspace(workspace);
        setLoadError(null);
      } catch {
        setLoadError('ไม่สามารถโหลดข้อมูลจริงจาก API ได้ กรุณาเข้าสู่ระบบใหม่แล้วลองอีกครั้ง');
      } finally {
        setIsHydrated(true);
      }
    };

    void hydrate();
  }, [applyWorkspace, workspaceMode]);

  useEffect(() => {
    void warmUserAssignmentPermissionCatalog();
  }, []);

  const value = useMemo<UserAssignmentDataContextValue>(
    () => ({
      dataSource: userAssignmentDataSource,
      loadError,
      isHydrated,
      isMutating,
      roles,
      setRoles,
      farms,
      setFarms,
      zones,
      setZones,
      houses,
      setHouses,
      pens,
      setPens,
      silos,
      setSilos,
      assignments,
      setAssignments,
      rolePermissions,
      setRolePermissions,
      reloadWorkspace,
      saveUserAssignment,
      deleteUserAssignment,
      saveRole,
      deleteRole,
      saveFarm,
      saveZone,
      saveHouse,
      savePen,
      saveSilo,
      deleteScopeNode,
      deleteSilo,
    }),
    [
      assignments,
      deleteRole,
      deleteScopeNode,
      deleteUserAssignment,
      farms,
      houses,
      isHydrated,
      isMutating,
      loadError,
      pens,
      silos,
      zones,
      reloadWorkspace,
      rolePermissions,
      roles,
      saveFarm,
      saveHouse,
      savePen,
      saveSilo,
      saveZone,
      saveRole,
      saveUserAssignment,
      deleteSilo,
    ],
  );

  return (
    <UserAssignmentDataContext.Provider value={value}>
      {children}
    </UserAssignmentDataContext.Provider>
  );
}

export function useUserAssignmentData() {
  const context = useContext(UserAssignmentDataContext);
  if (!context) {
    throw new Error('useUserAssignmentData must be used within UserAssignmentDataProvider');
  }
  return context;
}
