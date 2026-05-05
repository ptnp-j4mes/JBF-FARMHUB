type GlobalLoadingSnapshot = {
  apiPendingCount: number;
  navigationPending: boolean;
};

type Listener = (snapshot: GlobalLoadingSnapshot) => void;

const GLOBAL_LOADING_SUPPRESSED_PREFIXES = [
  '/admin/master-data',
  '/admin/user-assignment',
] as const;

let snapshot: GlobalLoadingSnapshot = {
  apiPendingCount: 0,
  navigationPending: false,
};

const listeners = new Set<Listener>();

function notify(): void {
  listeners.forEach((listener) => listener(snapshot));
}

export function subscribeGlobalLoading(listener: Listener): () => void {
  listeners.add(listener);
  listener(snapshot);
  return () => {
    listeners.delete(listener);
  };
}

export function getGlobalLoadingSnapshot(): GlobalLoadingSnapshot {
  return snapshot;
}

export function beginApiLoading(): void {
  snapshot = {
    ...snapshot,
    apiPendingCount: snapshot.apiPendingCount + 1,
  };
  notify();
}

export function endApiLoading(): void {
  snapshot = {
    ...snapshot,
    apiPendingCount: Math.max(0, snapshot.apiPendingCount - 1),
  };
  notify();
}

export function beginNavigationLoading(): void {
  if (snapshot.navigationPending) return;
  snapshot = {
    ...snapshot,
    navigationPending: true,
  };
  notify();
}

export function endNavigationLoading(): void {
  if (!snapshot.navigationPending) return;
  snapshot = {
    ...snapshot,
    navigationPending: false,
  };
  notify();
}

export function hasGlobalLoading(snapshotValue: GlobalLoadingSnapshot): boolean {
  return snapshotValue.navigationPending || snapshotValue.apiPendingCount > 0;
}

export function shouldSuppressGlobalLoadingForPath(path: string | null | undefined): boolean {
  const normalizedPath = (path ?? '').trim();
  if (!normalizedPath) {
    return false;
  }

  return GLOBAL_LOADING_SUPPRESSED_PREFIXES.some((prefix) =>
    normalizedPath.startsWith(prefix),
  );
}
