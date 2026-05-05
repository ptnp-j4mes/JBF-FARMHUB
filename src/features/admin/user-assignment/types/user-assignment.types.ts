/**
 * Admin Module - User Assignment Types
 *
 * Contracts for Users/AuthModels/Facilities APIs and view models
 * used by the user-assignment module UI.
 */

import type { ElementType } from 'react';

export type IsoDateString = string;
export type UserPermissionEffect = 'allow' | 'deny';
export type FacilityNodeType = 'farm' | 'zone' | 'house' | 'pen';

export interface IncludeInactiveQuery {
  includeInactive?: boolean;
}

export interface MenuTreeNodeResponse {
  id: number;
  code: string;
  labelTh: string;
  nodeType: string;
  sortOrder: number;
  isActive: boolean;
  parentId: number | null;
  requiredPermissionCodes?: string[];
  children?: MenuTreeNodeResponse[];
}
export type MenuTreeGroupResponse = MenuTreeNodeResponse;
export type MenuTreeItemResponse = MenuTreeNodeResponse;

// ---------------------------------------------------------------------------
// Users API
// ---------------------------------------------------------------------------
export interface UserResponse {
  id: number;
  username: string;
  email: string;
  prefix?: string | null;
  firstName: string;
  lastName: string;
  companyId: number;
  companyName: string;
  isActive: boolean;
  createdDate: IsoDateString;
  roles: string[];
}

export interface CreateUserRequest {
  username: string;
  password: string;
  email: string;
  prefix?: string | null;
  firstName: string;
  lastName: string;
  companyId: number;
  roleIds?: number[];
}

export interface UpdateUserRequest {
  email?: string;
  prefix?: string | null;
  firstName?: string;
  lastName?: string;
  companyId?: number;
  isActive?: boolean;
  roleIds?: number[];
}

export interface ResetPasswordRequest {
  newPassword: string;
  confirmNewPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export type UsersDataSource = 'server';
export type UsersWorkspaceMode = 'full' | 'scope';
export type ScopeNodeType = 'farm' | 'zone' | 'house' | 'pen';

export interface SaveUserAssignmentPayload {
  id?: number;
  userId?: number;
  avatar?: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  organization: OrganizationInfo;
  roleScopes: RoleScope[];
  permissionOverrides?: ScopePermissionOverrideItem[];
}

export interface SaveRolePayload {
  id?: string;
  code?: string;
  name: string;
  description: string;
}

export interface SaveFarmPayload {
  id?: number;
  name: string;
  code: string;
  location: string;
  status: ScopeStatus;
}

export interface SaveZonePayload {
  id?: number;
  name: string;
  farmId: number;
  status: ScopeStatus;
}

export interface SaveHousePayload {
  id?: number;
  name: string;
  farmId: number;
  zoneId?: number;
  status: ScopeStatus;
}

export interface SavePenPayload {
  id?: number;
  name: string;
  houseId: number;
  status: ScopeStatus;
}

export interface SaveSiloPayload {
  id?: number;
  code: string;
  name: string;
  farmId: number;
  houseId: number;
  capacityKg: number;
  status: ScopeStatus;
}

// ---------------------------------------------------------------------------
// AuthModels API - Companies / Roles / Permissions
// ---------------------------------------------------------------------------
export interface CompanyResponse {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
  createdDate: IsoDateString;
  activeUserCount: number;
}

export interface CompanyUpsertRequest {
  code: string;
  name: string;
}

export interface RoleResponse {
  id: number;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  createdDate: IsoDateString;
  userCount: number;
  permissionCount: number;
}

export interface RoleUpsertRequest {
  code?: string;
  name: string;
  description?: string;
  permissionIds?: number[];
}

export interface PermissionResponse {
  id: number;
  module: string;
  resource: string | null;
  resourcePath: string;
  action: string;
  code: string;
  description: string;
  isActive: boolean;
  createdDate: IsoDateString;
  roleCount: number;
}

export interface PermissionUpsertRequest {
  resource: string;
  action: string;
  description?: string;
  roleIds?: number[];
}

export interface RolePermissionResponse {
  roleId: number;
  roleName: string;
  permissionId: number;
  permissionCode: string;
  description: string;
}

export interface SetRolePermissionsRequest {
  permissionIds: number[];
}

export interface UserRoleResponse {
  userId: number;
  username: string;
  roleId: number;
  roleName: string;
  roleIsActive: boolean;
}

export interface SetUserRolesRequest {
  roleIds: number[];
}

export interface UserRoleAssignRequest {
  roleId: number;
}

export interface AccessPreviewRequest {
  userId: number;
  permissionId: number;
  facilityNodeId?: number | null;
}

export interface AccessPreviewResponse {
  userId: number;
  username: string;
  permissionId: number;
  permissionCode: string;
  facilityNodeId: number | null;
  inScope: boolean;
  hasRolePermission: boolean;
  hasUserAllow: boolean;
  hasUserDeny: boolean;
  isAllowed: boolean;
  decisionReason: string;
}

export interface UserAssignmentPermissionQueryRequest {
  roleIds: number[];
  facilityNodeId: number;
  search?: string;
  actions?: string[];
  includeUserOverrides?: boolean;
  includeCandidatePermissions?: boolean;
  page?: number;
  pageSize?: number;
}

export interface UserAssignmentPermissionQueryRoleInfo {
  roleId: number;
  roleCode: string;
  roleName: string;
  roleIsActive: boolean;
}

export interface UserAssignmentPermissionQueryRow {
  permissionId: number;
  permissionCode: string;
  resource: string;
  action: string;
  description: string;
  isAssignable: boolean;
  fromSelectedRole: boolean;
  sourceRoleIds: number[];
  sourceRoleNames: string[];
  hasUserAllow: boolean;
  hasUserDeny: boolean;
  userPermissionAllowId?: number | null;
  userPermissionDenyId?: number | null;
  isEffectiveAllowed: boolean;
  decisionReason: string;
  overrideFacilityNodeId?: number | null;
  overrideFacilityName?: string | null;
  note?: string | null;
}

export interface UserAssignmentPermissionQueryResponse {
  userId: number;
  facilityNodeId: number;
  facilityCode: string;
  facilityName: string;
  facilityType: string;
  facilityPath: string;
  roles: UserAssignmentPermissionQueryRoleInfo[];
  permissions: UserAssignmentPermissionQueryRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  queryMode: string;
}

// ---------------------------------------------------------------------------
// Facilities API
// ---------------------------------------------------------------------------
export interface FacilityNodeResponse {
  id: number;
  parentId: number | null;
  parentName?: string | null;
  code: string;
  name: string;
  description: string;
  type: FacilityNodeType;
  isActive: boolean;
  childrenCount: number;
}

export interface FacilityTreeResponse extends FacilityNodeResponse {
  children: FacilityTreeResponse[];
}

export interface FacilityNodeRequest {
  parentId?: number | null;
  code: string;
  name: string;
  description?: string;
  type: FacilityNodeType;
}

export interface FacilitiesQuery {
  type?: FacilityNodeType;
  includeInactive?: boolean;
}

export interface FeedSiloResponse {
  id: number;
  facilityNodeId: number;
  facilityNodeCode: string;
  facilityNodeName: string;
  zoneId?: number | null;
  zoneCode?: string | null;
  zoneName?: string | null;
  houseId: number;
  houseCode: string;
  houseName: string;
  code: string;
  name: string;
  description: string;
  capacityKg: number;
  isActive: boolean;
}

export interface FeedSiloUpsertRequest {
  facilityNodeId: number;
  houseId: number;
  code: string;
  name: string;
  description?: string;
  capacityKg: number;
}

// ---------------------------------------------------------------------------
// Users module UI view-model types
// ---------------------------------------------------------------------------
export type AdminScopeStatus = 'Active' | 'Inactive';

export interface AdminRole {
  id: string;
  code: string;
  name: string;
  description: string;
  permissionCount: number;
  isActive: boolean;
}

export interface AdminFarm {
  id: number;
  name: string;
  code: string;
  location: string;
  status: AdminScopeStatus;
}

export interface AdminZone {
  id: number;
  name: string;
  farmId: number;
  farmName: string;
  status: AdminScopeStatus;
}

export interface AdminHouse {
  id: number;
  name: string;
  zoneId: number;
  zoneName: string;
  farmName: string;
  status: AdminScopeStatus;
}

export interface AdminPen {
  id: number;
  name: string;
  houseId: number;
  houseName: string;
  zoneName: string;
  farmName: string;
  status: AdminScopeStatus;
}

export interface AdminSilo {
  id: number;
  code: string;
  name: string;
  facilityNodeId: number;
  farmName: string;
  zoneName: string;
  houseId: number;
  houseName: string;
  capacityKg: number;
  status: AdminScopeStatus;
}

export interface AdminRoleScope {
  assignmentId?: number | null;
  role: string;
  roleId?: number;
  farm: string;
  zone: string;
  house: string;
  facilityNodeId?: number | null;
}

export interface AdminOrganizationInfo {
  company: string;
}

export interface AdminUserAssignment {
  id: number;
  userId: number;
  username: string;
  prefix?: string | null;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  avatar: string;
  organization: AdminOrganizationInfo;
  roleScopes: AdminRoleScope[];
  permissionOverrides: UserAssignmentPermissionOverrideItem[];
}

export type AdminPermissionByFeature = Record<string, Record<string, boolean>>;
export type AdminRolePermissions = Record<string, AdminPermissionByFeature>;

export interface AdminScopeCatalog {
  farms: AdminFarm[];
  zones: AdminZone[];
  houses: AdminHouse[];
  pens: AdminPen[];
  silos: AdminSilo[];
}

export interface UserAssignmentWorkspaceData extends AdminScopeCatalog {
  roles: AdminRole[];
  assignments: AdminUserAssignment[];
  rolePermissions: AdminRolePermissions;
}

export interface UserAssignmentScopeItem {
  assignmentId?: number | null;
  roleId: number;
  roleName?: string;
  facilityNodeId: number | null;
  facilityCode?: string | null;
  facilityName?: string | null;
  remark?: string | null;
}

export interface UserAssignmentPermissionOverrideItem {
  assignmentId?: number | null;
  roleId: number;
  roleName?: string;
  facilityNodeId: number | null;
  facilityCode?: string | null;
  facilityName?: string | null;
  permissionId: number;
  permissionCode?: string;
  effect: UserPermissionEffect;
  remark?: string | null;
}

export interface UserAssignmentAggregateResponse {
  userId: number;
  username?: string;
  phoneNumber?: string | null;
  roleScopes: UserAssignmentScopeItem[];
  permissionOverrides: UserAssignmentPermissionOverrideItem[];
}

export interface UserAssignmentAggregateUpsertRequest {
  phoneNumber?: string | null;
  roleScopes: UserAssignmentScopeItem[];
  permissionOverrides: UserAssignmentPermissionOverrideItem[];
}

// ---------------------------------------------------------------------------
// Users module UI-local types / helpers
// ---------------------------------------------------------------------------
export type ScopeStatus = AdminScopeStatus;
export type Farm = AdminFarm;
export type Zone = AdminZone;
export type House = AdminHouse;
export type Pen = AdminPen;
export type Silo = AdminSilo;
export type RoleScope = AdminRoleScope;
export type OrganizationInfo = AdminOrganizationInfo;
export type UserAssignment = AdminUserAssignment;
export type RoleItem = AdminRole;
export type RoleFormState = Omit<RoleItem, 'id'>;

export type FilterState = {
  company: string;
  role: string;
  farm: string;
  zone: string;
  house: string;
};

export type RoleCatalogItem = {
  name: string;
  code: string;
  permissionCount: number;
};

export type FarmCatalogItem = {
  name: string;
  location: string;
  status: string;
};

export type ZoneCatalogItem = {
  name: string;
  farmName: string;
  status: string;
};

export type HouseCatalogItem = {
  name: string;
  farmName: string;
  zoneName: string;
  status: string;
};

export type FarmFormData = {
  name: string;
  code: string;
  location: string;
  status: ScopeStatus;
};

export type ZoneFormData = {
  name: string;
  farmId: number;
  status: ScopeStatus;
};

export type HouseFormData = {
  name: string;
  farmId: number;
  zoneId: number;
  status: ScopeStatus;
};

export type PenFormData = {
  name: string;
  houseId: number;
  status: ScopeStatus;
};

export type SiloFormData = {
  code: string;
  name: string;
  farmId: number;
  houseId: number;
  capacityKg: number;
  status: ScopeStatus;
};

export type ScopePermissionOverrideInput = {
  allowPermissionCodes: string[];
  denyPermissionCodes: string[];
};

export type ScopePermissionOverrideItem = RoleScope & ScopePermissionOverrideInput;

export type AssignmentDialogPayload = {
  id?: number;
  userId?: number;
  avatar?: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  organization: OrganizationInfo;
  roleScopes: RoleScope[];
  permissionOverrides: ScopePermissionOverrideItem[];
};

export type UserAssignmentUserSummary = {
  id: number;
  username: string;
  email: string;
  prefix?: string | null;
  firstName: string;
  lastName: string;
  displayName: string;
  companyId: number;
  companyName: string;
  isActive: boolean;
  createdDate: IsoDateString;
  roleNames: string[];
};

export type UserAssignmentCompanyOption = {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
};

export type UserAssignmentRoleOption = {
  id: number;
  code: string;
  name: string;
  description: string;
  isActive: boolean;
  permissionCount: number;
};

export type UserAssignmentPermissionOption = {
  id: number;
  code: string;
  resource: string;
  resourcePath: string;
  action: string;
  description: string;
  isActive: boolean;
};

export type UserAssignmentFacilityOption = {
  id: number;
  parentId: number | null;
  code: string;
  name: string;
  type: FacilityNodeType;
  isActive: boolean;
  pathLabel: string;
};

export type UserAssignmentWorkspace = {
  users: UserAssignmentUserSummary[];
  companies: UserAssignmentCompanyOption[];
  roles: UserAssignmentRoleOption[];
  facilities: UserAssignmentFacilityOption[];
};

export type UserAssignmentDetailRoleScope = {
  roleId: number;
  roleName: string;
  facilityNodeId: number | null;
  facilityName: string | null;
  remark?: string | null;
};

export type UserAssignmentDetailPermissionOverride = {
  id?: number;
  roleId: number;
  roleName: string;
  permissionId: number;
  permissionCode: string;
  effect: UserPermissionEffect;
  facilityNodeId: number | null;
  facilityName: string | null;
  note: string;
};

export type UserAssignmentDetail = {
  user: UserAssignmentUserSummary;
  roleScopes: UserAssignmentDetailRoleScope[];
  permissionOverrides: UserAssignmentDetailPermissionOverride[];
};

export type UserAssignmentPermissionOverrideFormItem = {
  localId: string;
  id?: number;
  roleId: number | null;
  permissionId: number | null;
  effect: UserPermissionEffect;
  facilityNodeId: number | null;
  note: string;
};

export type UserAssignmentEditorFormState = {
  mode: 'create' | 'edit';
  userId?: number;
  identity: {
    username: string;
    password: string;
    email: string;
    prefix: string;
    firstName: string;
    lastName: string;
    companyId: number | null;
    isActive: boolean;
  };
  selectedRoleIds: number[];
  selectedFacilityNodeIds: number[];
  permissionOverrides: UserAssignmentPermissionOverrideFormItem[];
};

export type UserAssignmentSavePayload = {
  userId?: number;
  mode: 'create' | 'edit';
  identity: UserAssignmentEditorFormState['identity'];
  selectedRoleIds: number[];
  selectedFacilityNodeIds: number[];
  permissionOverrides: UserAssignmentPermissionOverrideFormItem[];
};

// ---------------------------------------------------------------------------
// Permission matrix config
// ---------------------------------------------------------------------------
export type UsersPermissionFeatureItem = {
  id: string;
  name: string;
  sysName: string;
  icon: ElementType;
};

export type UsersPermissionGroupItem = {
  groupId: string;
  groupName: string;
  features: UsersPermissionFeatureItem[];
};

export type UsersPermissionState = Record<string, Record<string, boolean>>;
