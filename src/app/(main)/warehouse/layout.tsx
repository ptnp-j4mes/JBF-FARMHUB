'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import { authService } from '@/features/auth/services/auth.service';
import { ACCESS_CONTEXT_CHANGED_EVENT } from '@/lib/access-context';
import {
  FACILITY_CHANGED_EVENT,
  getCurrentFacilityId,
} from '@/lib/facility-context';
import { canAccessWarehouseRoute } from '@/lib/access/modules/warehouse.guard';

export default function WarehouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const checkRouteAccess = async () => {
      if (!authService.isAuthenticated()) {
        router.replace('/auth/login');
        setAuthorized(false);
        setLoading(false);
        return;
      }

      // Refresh the user snapshot before evaluating warehouse route access so we
      // don't rely on a stale permission snapshot after DB or role changes.
      await authService.bootstrapUser().catch(() => undefined);

      const facilityId = getCurrentFacilityId();
      const routeAllowed = await canAccessWarehouseRoute(pathname, facilityId);
      if (!isActive) {
        return;
      }

      if (!routeAllowed) {
        router.replace('/operations/dashboard');
        setAuthorized(false);
        setLoading(false);
        return;
      }

      setAuthorized(true);
      setLoading(false);
    };

    setLoading(true);
    void checkRouteAccess();

    const handleAccessContextChanged = () => {
      void checkRouteAccess();
    };

    const handleFacilityChanged = () => {
      void checkRouteAccess();
    };

    window.addEventListener(ACCESS_CONTEXT_CHANGED_EVENT, handleAccessContextChanged);
    window.addEventListener(FACILITY_CHANGED_EVENT, handleFacilityChanged);
    return () => {
      isActive = false;
      window.removeEventListener(
        ACCESS_CONTEXT_CHANGED_EVENT,
        handleAccessContextChanged,
      );
      window.removeEventListener(FACILITY_CHANGED_EVENT, handleFacilityChanged);
    };
  }, [pathname, router]);

  if (loading) {
    return <LoadingOverlay open message="กำลังโหลดข้อมูล..." />;
  }

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
