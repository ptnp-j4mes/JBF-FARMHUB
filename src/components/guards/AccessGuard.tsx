'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/features/auth/services/auth.service';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import { hasPermission } from '@/lib/access/check-permission';

export interface AccessGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  allowedPermissions?: string[];
  permissionMode?: 'any' | 'all';
  unauthenticatedRedirect?: string;
  unauthorizedRedirect?: string;
}

function normalizeList(values: string[] | undefined): string[] {
  if (!values || values.length === 0) return [];
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

export default function AccessGuard({
  children,
  allowedRoles = [],
  allowedPermissions = [],
  permissionMode = 'any',
  unauthenticatedRedirect = '/auth/login',
  unauthorizedRedirect = '/operations/dashboard',
}: AccessGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  const normalizedRoles = useMemo(
    () => normalizeList(allowedRoles).map((role) => role.toLowerCase()),
    [allowedRoles],
  );
  const normalizedPermissions = useMemo(
    () => normalizeList(allowedPermissions).map((permission) => permission.toLowerCase()),
    [allowedPermissions],
  );

  useEffect(() => {
    const checkAccess = () => {
      if (!authService.isAuthenticated()) {
        router.replace(unauthenticatedRedirect);
        setAuthorized(false);
        setLoading(false);
        return;
      }

      const user = authService.getUser();
      if (!user) {
        router.replace(unauthenticatedRedirect);
        setAuthorized(false);
        setLoading(false);
        return;
      }

      const userRoles = new Set((user.roles ?? []).map((role) => role.toLowerCase()));
      const hasRole =
        normalizedRoles.length === 0 ||
        normalizedRoles.some((requiredRole) => userRoles.has(requiredRole));

      let hasRequiredPermission = true;
      if (normalizedPermissions.length > 0) {
        hasRequiredPermission = hasPermission({
          requiredPermissions: normalizedPermissions,
          mode: permissionMode,
        });
      }

      if (hasRole && hasRequiredPermission) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
        router.replace(unauthorizedRedirect);
      }
      setLoading(false);
    };

    checkAccess();
  }, [
    router,
    permissionMode,
    unauthenticatedRedirect,
    unauthorizedRedirect,
    normalizedRoles,
    normalizedPermissions,
  ]);

  if (loading) {
    return <LoadingOverlay open message="กำลังโหลดข้อมูล..." />;
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
