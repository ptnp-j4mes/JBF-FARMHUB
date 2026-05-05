import type { UserInfoResponse } from '@/features/auth/types';

export const FACILITY_STORAGE_KEY = 'current_facility_id';
export const FACILITY_CODE_STORAGE_KEY = 'current_facility_code';
export const FACILITY_COOKIE_KEY = 'current_facility_id';
export const FACILITY_CHANGED_EVENT = 'jbfarmhub:facility-changed';
const ACTIVITY_DAILY_HOUSE_SELECTION_COOKIE_KEY = 'activity_daily_house_selection';
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

type ScopeNode = {
  facilityNodeId: number;
  facilityCode: string;
  facilityName: string;
  facilityType: string;
};

export type ActivityDailyHouseSelection = {
  groupId: string;
  houseCode: string;
};

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

function readCookie(cookieKey: string): string | null {
  if (!isBrowser()) return null;
  const cookies = window.document.cookie ? window.document.cookie.split('; ') : [];
  const prefix = `${cookieKey}=`;
  const entry = cookies.find((cookie) => cookie.startsWith(prefix));
  if (!entry) return null;
  const rawValue = entry.slice(prefix.length);
  try {
    return decodeURIComponent(rawValue);
  } catch {
    return rawValue;
  }
}

function writeCookie(cookieKey: string, value: string | null): void {
  if (!isBrowser()) return;
  if (value === null) {
    window.document.cookie = `${cookieKey}=; path=/; max-age=0; SameSite=Lax`;
    return;
  }

  window.document.cookie = `${cookieKey}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function getCurrentFacilityId(): number | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(FACILITY_STORAGE_KEY);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function setCurrentFacilityId(facilityId: number | null): void {
  if (!isBrowser()) return;
  if (!facilityId || facilityId <= 0) {
    window.localStorage.removeItem(FACILITY_STORAGE_KEY);
    window.localStorage.removeItem(FACILITY_CODE_STORAGE_KEY);
    document.cookie = `${FACILITY_COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
  } else {
    const value = String(facilityId);
    window.localStorage.setItem(FACILITY_STORAGE_KEY, value);
    document.cookie = `${FACILITY_COOKIE_KEY}=${value}; path=/; SameSite=Lax`;
  }

  window.dispatchEvent(new CustomEvent(FACILITY_CHANGED_EVENT, { detail: { facilityId } }));
}

export function getCurrentFacilityCode(): string | null {
  if (!isBrowser()) return null;
  const raw = window.localStorage.getItem(FACILITY_CODE_STORAGE_KEY);
  if (!raw) return null;
  const code = raw.trim();
  return code.length ? code : null;
}

export function setCurrentFacilityContext(
  facilityId: number | null,
  facilityCode?: string | null,
): void {
  if (!isBrowser()) return;
  if (!facilityId || facilityId <= 0) {
    setCurrentFacilityId(null);
    return;
  }

  const value = String(facilityId);
  window.localStorage.setItem(FACILITY_STORAGE_KEY, value);
  document.cookie = `${FACILITY_COOKIE_KEY}=${value}; path=/; SameSite=Lax`;

  const normalizedCode = (facilityCode ?? '').trim();
  if (normalizedCode.length > 0) {
    window.localStorage.setItem(FACILITY_CODE_STORAGE_KEY, normalizedCode);
  } else {
    window.localStorage.removeItem(FACILITY_CODE_STORAGE_KEY);
  }

  window.dispatchEvent(
    new CustomEvent(FACILITY_CHANGED_EVENT, {
      detail: { facilityId, facilityCode: normalizedCode || null },
    }),
  );
}

export function getUserFarmScopeNodes(user: UserInfoResponse | null): ScopeNode[] {
  if (!user) return [];

  const accessibleFarmNodes = (user.accessibleFarmNodes ?? [])
    .filter((node) => node && node.facilityNodeId > 0)
    .filter((node) => (node.facilityType || '').trim().toLowerCase() === 'farm');

  if (accessibleFarmNodes.length > 0) {
    const byId = new Map<number, ScopeNode>();
    for (const node of accessibleFarmNodes) {
      if (!byId.has(node.facilityNodeId)) {
        byId.set(node.facilityNodeId, node);
      }
    }

    return Array.from(byId.values()).sort((a, b) =>
      `${a.facilityCode} ${a.facilityName}`.localeCompare(`${b.facilityCode} ${b.facilityName}`),
    );
  }

  const scopeNodes = (user.scopeNodes ?? [])
    .filter((node) => node && node.facilityNodeId > 0)
    .filter((node) => (node.facilityType || '').trim().toLowerCase() === 'farm');

  if (scopeNodes.length > 0) {
    const byId = new Map<number, ScopeNode>();
    for (const node of scopeNodes) {
      if (!byId.has(node.facilityNodeId)) {
        byId.set(node.facilityNodeId, node);
      }
    }
    return Array.from(byId.values()).sort((a, b) =>
      `${a.facilityCode} ${a.facilityName}`.localeCompare(`${b.facilityCode} ${b.facilityName}`),
    );
  }

  return (user.scopes ?? [])
    .filter((id) => Number.isFinite(id) && id > 0)
    .map((id) => ({
      facilityNodeId: id,
      facilityCode:
        getCurrentFacilityId() === id && getCurrentFacilityCode()
          ? (getCurrentFacilityCode() as string)
          : `FARM-${id}`,
      facilityName: `Farm ${id}`,
      facilityType: 'farm',
    }));
}

export function ensureCurrentFacilityForUser(user: UserInfoResponse | null): number | null {
  const farms = getUserFarmScopeNodes(user);
  if (!farms.length) {
    setCurrentFacilityId(null);
    return null;
  }

  const current = getCurrentFacilityId();
  if (current && farms.some((farm) => farm.facilityNodeId === current)) {
    return current;
  }

  const fallback = farms[0].facilityNodeId;
  setCurrentFacilityContext(fallback, farms[0].facilityCode);
  return fallback;
}

export function getActivityDailyHouseSelection(farmCode: string): ActivityDailyHouseSelection | null {
  const normalizedFarmCode = farmCode.trim();
  if (!normalizedFarmCode) return null;

  const raw = readCookie(ACTIVITY_DAILY_HOUSE_SELECTION_COOKIE_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const entry = parsed[normalizedFarmCode];
    if (!entry || typeof entry !== 'object') return null;

    const groupId = typeof (entry as ActivityDailyHouseSelection).groupId === 'string'
      ? (entry as ActivityDailyHouseSelection).groupId.trim()
      : '';
    const houseCode = typeof (entry as ActivityDailyHouseSelection).houseCode === 'string'
      ? (entry as ActivityDailyHouseSelection).houseCode.trim()
      : '';

    if (!groupId && !houseCode) return null;
    return { groupId, houseCode };
  } catch {
    return null;
  }
}

export function setActivityDailyHouseSelection(
  farmCode: string,
  selection: ActivityDailyHouseSelection | null,
): void {
  const normalizedFarmCode = farmCode.trim();
  if (!normalizedFarmCode) return;

  const raw = readCookie(ACTIVITY_DAILY_HOUSE_SELECTION_COOKIE_KEY);
  let map: Record<string, ActivityDailyHouseSelection> = {};

  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      map = Object.entries(parsed).reduce<Record<string, ActivityDailyHouseSelection>>((accumulator, [key, value]) => {
        if (!key.trim()) return accumulator;
        if (!value || typeof value !== 'object') return accumulator;
        const groupId = typeof (value as ActivityDailyHouseSelection).groupId === 'string'
          ? (value as ActivityDailyHouseSelection).groupId.trim()
          : '';
        const houseCode = typeof (value as ActivityDailyHouseSelection).houseCode === 'string'
          ? (value as ActivityDailyHouseSelection).houseCode.trim()
          : '';
        if (!groupId && !houseCode) return accumulator;
        accumulator[key] = { groupId, houseCode };
        return accumulator;
      }, {});
    } catch {
      map = {};
    }
  }

  if (selection && (selection.groupId.trim() || selection.houseCode.trim())) {
    map[normalizedFarmCode] = {
      groupId: selection.groupId.trim(),
      houseCode: selection.houseCode.trim(),
    };
  } else {
    delete map[normalizedFarmCode];
  }

  if (Object.keys(map).length === 0) {
    writeCookie(ACTIVITY_DAILY_HOUSE_SELECTION_COOKIE_KEY, null);
    return;
  }

  writeCookie(ACTIVITY_DAILY_HOUSE_SELECTION_COOKIE_KEY, JSON.stringify(map));
}
