'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import { authService } from '@/features/auth/services/auth.service';
import { ACCESS_CONTEXT_CHANGED_EVENT } from '@/lib/access-context';
import { canAccessRoute } from '@/lib/access/guard/route.guard';

export default function ProductionLayout({
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

      const routeAllowed = await canAccessRoute(pathname);
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

    window.addEventListener(
      ACCESS_CONTEXT_CHANGED_EVENT,
      handleAccessContextChanged,
    );
    return () => {
      isActive = false;
      window.removeEventListener(
        ACCESS_CONTEXT_CHANGED_EVENT,
        handleAccessContextChanged,
      );
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
