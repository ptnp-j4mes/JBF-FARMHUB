import { userAssignmentEndpoints, userViewAdapter } from './user-assignment.shared';
import { usersService } from './users.service';
import { companiesService } from './companies.service';
import { rolesService } from './roles.service';
import { permissionsService } from './permissions.service';
import { rolePermissionsService } from './role-permissions.service';
import { userRolesService } from './user-roles.service';
import { userAssignmentsService } from './user-assignments.service';
import { scopeCatalogService } from './scope-catalog.service';
import { facilitiesService } from './facilities.service';
import { feedSilosService } from './feed-silos.service';
import { permissionMenusService } from './permission-menus.service';
import { createUsersApi } from './workspace.service';

export const userService = {
  users: usersService,
  companies: companiesService,
  roles: rolesService,
  permissions: permissionsService,
  rolePermissions: rolePermissionsService,
  userRoles: userRolesService,
  userAssignments: userAssignmentsService,
  accessPreview: {
    preview: userAssignmentsService.previewAccess,
  },
  scopeCatalog: scopeCatalogService,
  facilities: facilitiesService,
  feedSilos: feedSilosService,
  permissionMenus: permissionMenusService,
} as const;

export const usersApi = createUsersApi({
  users: userService.users,
  companies: userService.companies,
  roles: userService.roles,
  permissions: userService.permissions,
  userAssignments: userService.userAssignments,
  facilities: userService.facilities,
  feedSilos: userService.feedSilos,
  scopeCatalog: userService.scopeCatalog,
});

export const getUserAssignmentWorkspaceData = usersApi.getWorkspaceData;
export const getUserAssignmentScopeWorkspaceData = async () => usersApi.getWorkspaceData('scope');

export { userAssignmentEndpoints, userViewAdapter };
