export const USER_ASSIGNMENT_ROUTE_BASE = '/admin/user-assignment' as const;

export const USER_ASSIGNMENT_TAB_KEYS = [
  'assignment',
  'user',
  'organization',
  'role',
  'permission-pool',
] as const;

export type UserAssignmentTabKey = (typeof USER_ASSIGNMENT_TAB_KEYS)[number];

export function isUserAssignmentTabKey(
  value: string | null | undefined,
): value is UserAssignmentTabKey {
  return Boolean(value && USER_ASSIGNMENT_TAB_KEYS.includes(value as UserAssignmentTabKey));
}

export function buildUserAssignmentTabHref(tabKey: UserAssignmentTabKey): string {
  return `${USER_ASSIGNMENT_ROUTE_BASE}?tab=${encodeURIComponent(tabKey)}`;
}
