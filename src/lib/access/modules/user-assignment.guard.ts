import { PermissionAction } from '@/features/auth/types/enums';
import { createModuleGuard } from './module-guard';

const USER_ASSIGNMENT_MODULE = 'admin' as const;
const USER_ASSIGNMENT_RESOURCE = 'user_assignment' as const;
const userAssignmentGuard = createModuleGuard<typeof USER_ASSIGNMENT_RESOURCE>(
  USER_ASSIGNMENT_MODULE,
);

export async function warmUserAssignmentPermissionCatalog(): Promise<void> {
  await userAssignmentGuard.warmCatalog();
}

export function canViewUserAssignment(): boolean {
  return userAssignmentGuard.canRenderResource(USER_ASSIGNMENT_RESOURCE);
}

export function canAddUserAssignment(): boolean {
  return userAssignmentGuard.canRunResourceAction(
    USER_ASSIGNMENT_RESOURCE,
    PermissionAction.Add,
  );
}

export function canEditUserAssignment(): boolean {
  return userAssignmentGuard.canRunResourceAction(
    USER_ASSIGNMENT_RESOURCE,
    PermissionAction.Edit,
  );
}

export function canSubmitUserAssignment(): boolean {
  return userAssignmentGuard.canRunResourceAction(
    USER_ASSIGNMENT_RESOURCE,
    PermissionAction.Submit,
  );
}

export function canSoftDeleteUserAssignment(): boolean {
  return userAssignmentGuard.canRunResourceAction(
    USER_ASSIGNMENT_RESOURCE,
    PermissionAction.SoftDelete,
  );
}

export function canHardDeleteUserAssignment(): boolean {
  return userAssignmentGuard.canRunResourceAction(
    USER_ASSIGNMENT_RESOURCE,
    PermissionAction.HardDelete,
  );
}

export function canApproveUserAssignment(): boolean {
  return userAssignmentGuard.canRunResourceAction(
    USER_ASSIGNMENT_RESOURCE,
    PermissionAction.Approve,
  );
}

export function canRejectUserAssignment(): boolean {
  return userAssignmentGuard.canRunResourceAction(
    USER_ASSIGNMENT_RESOURCE,
    PermissionAction.Reject,
  );
}

export function canExportUserAssignment(): boolean {
  return userAssignmentGuard.canRunResourceAction(
    USER_ASSIGNMENT_RESOURCE,
    PermissionAction.Export,
  );
}

export function canManageUserAssignment(): boolean {
  return userAssignmentGuard.canRunResourceAction(
    USER_ASSIGNMENT_RESOURCE,
    PermissionAction.Manage,
  );
}

export function canUploadUserAssignment(): boolean {
  return userAssignmentGuard.canRunResourceAction(
    USER_ASSIGNMENT_RESOURCE,
    PermissionAction.Upload,
  );
}
