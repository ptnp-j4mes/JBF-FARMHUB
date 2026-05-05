import { describe, expect, it } from 'vitest';
import type { UserInfoResponse } from '@/features/auth/types';
import type { AccessAssignmentContext } from '@/lib/access-context';
import { resolveAccessContextForFacility } from '../access-context-sync.service';

function buildAssignment(
  assignmentId: string,
  scopeNodeId: number | null,
  roleName = 'ผู้ดูแลระบบ',
): AccessAssignmentContext {
  return {
    assignmentId,
    roleName,
    roleCode: '',
    scopeType: 'farm',
    scopeNodeId,
    scopeLabel: scopeNodeId ? `Farm ${scopeNodeId}` : 'System',
    scopeCode: scopeNodeId ? `FARM-${scopeNodeId}` : null,
    permissionCodes: ['warehouse.stock_adjustment_request.view'],
    permissionCount: 1,
  };
}

function buildUser(): UserInfoResponse {
  return {
    id: 1,
    username: 'admin',
    firstName: 'Admin',
    lastName: 'User',
    roles: ['ผู้ดูแลระบบ'],
    roleCodes: ['admin'],
    permissions: ['warehouse.stock_adjustment_request.view'],
    permissionScopes: [],
    scopes: [1, 9],
    scopeNodes: [
      {
        facilityNodeId: 1,
        facilityCode: 'FARM-1',
        facilityName: 'Farm 1',
        facilityType: 'farm',
      },
      {
        facilityNodeId: 9,
        facilityCode: 'FARM-9',
        facilityName: 'Farm 9',
        facilityType: 'farm',
      },
    ],
    accessibleFarmNodes: [
      {
        facilityNodeId: 1,
        facilityCode: 'FARM-1',
        facilityName: 'Farm 1',
        facilityType: 'farm',
      },
      {
        facilityNodeId: 9,
        facilityCode: 'FARM-9',
        facilityName: 'Farm 9',
        facilityType: 'farm',
      },
    ],
    isSuperAdmin: false,
  } as UserInfoResponse;
}

describe('resolveAccessContextForFacility', () => {
  it('replaces a stale access context with the matching facility assignment', () => {
    const assignments = [
      buildAssignment(':9', 9),
      buildAssignment(':1', 1),
    ];

    const result = resolveAccessContextForFacility({
      user: buildUser(),
      assignments,
      currentFacilityId: 1,
      storedContext: assignments[0],
    });

    expect(result.reason).toBe('matched-current-facility');
    expect(result.resolvedContext?.assignmentId).toBe(':1');
    expect(result.resolvedContext?.scopeNodeId).toBe(1);
  });

  it('clears the selected access when the current facility has no matching assignment', () => {
    const assignments = [buildAssignment(':9', 9)];

    const result = resolveAccessContextForFacility({
      user: buildUser(),
      assignments,
      currentFacilityId: 1,
      storedContext: assignments[0],
    });

    expect(result.reason).toBe('cleared-stale-selection');
    expect(result.resolvedContext).toBeNull();
  });

  it('keeps the stored access when there is no active facility context', () => {
    const assignments = [buildAssignment(':9', 9)];

    const result = resolveAccessContextForFacility({
      user: buildUser(),
      assignments,
      currentFacilityId: null,
      storedContext: assignments[0],
    });

    expect(result.reason).toBe('kept-stored');
    expect(result.resolvedContext?.assignmentId).toBe(':9');
  });
});
