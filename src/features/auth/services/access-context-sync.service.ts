import type { UserInfoResponse } from '@/features/auth/types';
import {
  isAccessContextApplicable,
  readCurrentAccessContext,
  setCurrentAccessContext,
  type AccessAssignmentContext,
} from '@/lib/access-context';
import {
  getCurrentFacilityCode,
  getCurrentFacilityId,
  setCurrentFacilityContext,
} from '@/lib/facility-context';
import { loadAccessAssignmentsForUser } from './access-context.service';

export type AccessContextSyncReason =
  | 'kept-stored'
  | 'matched-current-facility'
  | 'single-assignment'
  | 'cleared-stale-selection'
  | 'ambiguous';

export interface AccessContextSyncInput {
  user: UserInfoResponse | null;
  assignments?: AccessAssignmentContext[];
  currentFacilityId?: number | null;
  storedContext?: AccessAssignmentContext | null;
}

export interface AccessContextSyncResult {
  resolvedContext: AccessAssignmentContext | null;
  reason: AccessContextSyncReason;
}

function normalizeRoleName(roleName: string): string {
  return roleName.trim().toLowerCase();
}

function dedupeAssignments(
  assignments: AccessAssignmentContext[],
): AccessAssignmentContext[] {
  const unique = new Map<string, AccessAssignmentContext>();
  assignments.forEach((assignment) => {
    if (!unique.has(assignment.assignmentId)) {
      unique.set(assignment.assignmentId, assignment);
    }
  });
  return Array.from(unique.values());
}

function findAssignmentByRoleName(
  assignments: AccessAssignmentContext[],
  roleName: string,
): AccessAssignmentContext | null {
  const normalizedRoleName = normalizeRoleName(roleName);
  if (!normalizedRoleName) return null;

  return (
    assignments.find(
      (assignment) =>
        normalizeRoleName(assignment.roleName) === normalizedRoleName,
    ) ?? null
  );
}

export function resolveAccessContextForFacility(
  input: AccessContextSyncInput,
): AccessContextSyncResult {
  const assignments = dedupeAssignments(input.assignments ?? []);
  const currentFacilityId =
    typeof input.currentFacilityId === 'number' && input.currentFacilityId > 0
      ? input.currentFacilityId
      : null;
  const storedContext =
    input.storedContext && isAccessContextApplicable(input.storedContext, input.user)
      ? input.storedContext
      : null;
  const storedAssignment = storedContext
    ? assignments.find(
        (assignment) => assignment.assignmentId === storedContext.assignmentId,
      ) ?? storedContext
    : null;

  if (storedAssignment) {
    if (!currentFacilityId) {
      return {
        resolvedContext: storedAssignment,
        reason: 'kept-stored',
      };
    }

    if (
      storedAssignment.scopeNodeId === null ||
      storedAssignment.scopeNodeId === currentFacilityId
    ) {
      return {
        resolvedContext: storedAssignment,
        reason: 'kept-stored',
      };
    }
  }

  if (currentFacilityId) {
    const facilityAssignments = assignments.filter(
      (assignment) => assignment.scopeNodeId === currentFacilityId,
    );

    if (facilityAssignments.length > 0) {
      const roleMatch = findAssignmentByRoleName(
        facilityAssignments,
        storedAssignment?.roleName ?? storedContext?.roleName ?? '',
      );
      if (roleMatch) {
        return {
          resolvedContext: roleMatch,
          reason: 'matched-current-facility',
        };
      }

      if (facilityAssignments.length === 1) {
        return {
          resolvedContext: facilityAssignments[0],
          reason: 'matched-current-facility',
        };
      }
    }

    return {
      resolvedContext: null,
      reason: 'cleared-stale-selection',
    };
  }

  if (assignments.length === 1) {
    return {
      resolvedContext: assignments[0],
      reason: 'single-assignment',
    };
  }

  return {
    resolvedContext: null,
    reason: 'ambiguous',
  };
}

export async function syncCurrentAccessContextForFacility(
  input: AccessContextSyncInput,
): Promise<AccessContextSyncResult> {
  const assignments =
    input.assignments ??
    (input.user ? await loadAccessAssignmentsForUser(input.user) : []);

  const result = resolveAccessContextForFacility({
    user: input.user,
    assignments,
    currentFacilityId: input.currentFacilityId,
    storedContext: input.storedContext ?? readCurrentAccessContext(),
  });

  if (!result.resolvedContext) {
    if (readCurrentAccessContext()) {
      setCurrentAccessContext(null);
    }
    return result;
  }

  const currentAccessContext = readCurrentAccessContext();
  if (currentAccessContext?.assignmentId !== result.resolvedContext.assignmentId) {
    setCurrentAccessContext(result.resolvedContext);
  }

  if (result.resolvedContext.scopeNodeId !== null) {
    const currentFacilityId = getCurrentFacilityId();
    const currentFacilityCode = getCurrentFacilityCode();
    const nextFacilityCode = result.resolvedContext.scopeCode ?? null;
    if (
      currentFacilityId !== result.resolvedContext.scopeNodeId ||
      currentFacilityCode !== nextFacilityCode
    ) {
      setCurrentFacilityContext(
        result.resolvedContext.scopeNodeId,
        nextFacilityCode,
      );
    }
  }

  return result;
}
