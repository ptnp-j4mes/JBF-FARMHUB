'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import LoadingOverlay from '@/components/common/LoadingOverlay';
import {
  beginNavigationLoading,
  endNavigationLoading,
  getGlobalLoadingSnapshot,
  hasGlobalLoading,
  shouldSuppressGlobalLoadingForPath,
  subscribeGlobalLoading,
} from '@/lib/global-loading';

function shouldTrackAnchorNavigation(anchor: HTMLAnchorElement): boolean {
  if (anchor.target && anchor.target !== '_self') return false;
  const href = anchor.getAttribute('href');
  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return false;
  }

  const next = new URL(href, window.location.href);
  if (next.origin !== window.location.origin) return false;
  if (shouldSuppressGlobalLoadingForPath(next.pathname)) return false;

  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  const target = `${next.pathname}${next.search}${next.hash}`;
  return current !== target;
}

export default function GlobalAppLoading() {
  return
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [snapshot, setSnapshot] = useState(getGlobalLoadingSnapshot());

  useEffect(() => {
    return subscribeGlobalLoading(setSnapshot);
  }, []);

  useEffect(() => {
    endNavigationLoading();
  }, [pathname, searchParams]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as Element | null;
      const anchor = target?.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor) return;
      if (!shouldTrackAnchorNavigation(anchor)) return;

      beginNavigationLoading();
      window.setTimeout(() => endNavigationLoading(), 15000);
    };

    document.addEventListener('click', onDocumentClick, true);
    return () => {
      document.removeEventListener('click', onDocumentClick, true);
    };
  }, []);

  const open = useMemo(() => {
    if (shouldSuppressGlobalLoadingForPath(pathname)) return false;
    return hasGlobalLoading(snapshot);
  }, [snapshot, pathname]);

  return <LoadingOverlay open={open} message="กำลังโหลดข้อมูล..." />;
}
