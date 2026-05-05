'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authService } from '@/features/auth/services/auth.service';
import { loadAccessAssignmentsForUser } from '@/features/auth/services/access-context.service';
import {
  syncCurrentAccessContextForFacility,
} from '@/features/auth/services/access-context-sync.service';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import {
  readCurrentAccessContext,
  type AccessAssignmentContext,
} from '@/lib/access-context';
import { getCurrentFacilityId } from '@/lib/facility-context';

const DEFAULT_POST_ACCESS_PATH = '/operations/dashboard';

function buildNextPath(pathname: string): string | null {
  if (typeof window === 'undefined') {
    return pathname && pathname !== '/' ? pathname : null;
  }

  const nextParams = new URLSearchParams(window.location.search);
  nextParams.delete('_rsc');
  const nextQuery = nextParams.toString();
  const nextPath = `${pathname}${nextQuery ? `?${nextQuery}` : ''}`;
  if (!nextPath || nextPath === '/' || nextPath === '/access') {
    return null;
  }

  return nextPath;
}

function buildAccessRedirectPath(pathname: string): string {
  const nextPath = buildNextPath(pathname);
  if (!nextPath) {
    return '/access';
  }

  return `/access?next=${encodeURIComponent(nextPath)}`;
}

function buildLoginRedirectPath(pathname: string): string {
  const nextPath = buildNextPath(pathname);
  if (!nextPath) {
    return '/auth/login';
  }

  return `/auth/login?next=${encodeURIComponent(nextPath)}`;
}

export default function AccessBootstrapGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const initialPathRef = useRef(pathname);

  useEffect(() => {
    let active = true;

    const bootstrapAccess = async () => {
      if (!authService.isAuthenticated()) {
        router.replace(buildLoginRedirectPath(initialPathRef.current));
        return;
      }

      const user = await authService.hydrateUser();
      if (!active) {
        return;
      }

      if (!user) {
        authService.logout();
        router.replace(buildLoginRedirectPath(initialPathRef.current));
        return;
      }

      const assignments = await loadAccessAssignmentsForUser(user).catch(
        () => [] as AccessAssignmentContext[],
      );
      if (!active) {
        return;
      }

      const syncResult = await syncCurrentAccessContextForFacility({
        user,
        assignments,
        currentFacilityId: getCurrentFacilityId(),
        storedContext: readCurrentAccessContext(),
      });
      if (!active) {
        return;
      }

      if (!syncResult.resolvedContext && getCurrentFacilityId() == null) {
        router.replace(buildAccessRedirectPath(initialPathRef.current));
        return;
      }

      if (initialPathRef.current === '/' || initialPathRef.current === '') {
        router.replace(DEFAULT_POST_ACCESS_PATH);
        return;
      }

      if (active) {
        setReady(true);
      }
    };

    void bootstrapAccess();

    return () => {
      active = false;
    };
  }, [router]);

  if (!ready) {
    return <LoadingOverlay open message="กำลังโหลดข้อมูล..." />;
  }

  return <>{children}</>;
}
