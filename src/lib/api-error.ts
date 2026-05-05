import { ApiError } from '@/lib/api/errors';

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function toNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatValidationErrors(errors: unknown): string | null {
  if (!isRecord(errors)) return null;

  const details = Object.entries(errors)
    .flatMap(([, values]) => {
      if (Array.isArray(values)) {
        return values
          .filter((value): value is string => typeof value === 'string')
          .map((value) => value.trim())
          .filter(Boolean);
      }
      if (typeof values === 'string') {
        const trimmed = values.trim();
        return trimmed ? [trimmed] : [];
      }
      return [];
    })
    .filter((value, index, source) => source.indexOf(value) === index);

  return details.length > 0 ? details.join(' / ') : null;
}

function formatKnownDetails(details: unknown): string | null {
  if (!isRecord(details)) return null;

  const activeUsersCount = details.activeUsersCount;
  if (typeof activeUsersCount === 'number' && activeUsersCount > 0) {
    return ` (ผู้ใช้งานที่ยังใช้งานอยู่ ${activeUsersCount} คน)`;
  }

  const assignedUserCount = details.assignedUserCount ?? details.userCount;
  if (typeof assignedUserCount === 'number' && assignedUserCount > 0) {
    return ` (ผู้ใช้งานที่อ้างอิงอยู่ ${assignedUserCount} คน)`;
  }

  const inUseByRole = details.inUseByRole;
  const inUseByUserOverride = details.inUseByUserOverride;
  const parts: string[] = [];
  if (inUseByRole === true) {
    parts.push('ถูกใช้งานใน Role');
  }
  if (inUseByUserOverride === true) {
    parts.push('ถูกใช้งานใน Override ผู้ใช้');
  }
  if (parts.length > 0) {
    return ` (${parts.join(', ')})`;
  }

  return null;
}

function translateBackendMessage(message: string): string {
  const normalized = message.trim();

  const mapping: Array<[RegExp, string]> = [
    [
      /cannot deactivate company that still has active users\.?/i,
      'ไม่สามารถระงับองค์กรได้ เนื่องจากยังมีผู้ใช้งานอ้างอิงอยู่',
    ],
    [
      /cannot deactivate a role that is assigned to users\.?/i,
      'ไม่สามารถระงับบทบาทได้ เนื่องจากมีผู้ใช้งานอ้างอิงอยู่',
    ],
    [
      /cannot deactivate a permission that is currently assigned\.?/i,
      'ไม่สามารถปิดใช้งานสิทธิได้ เนื่องจากมีการอ้างอิงอยู่',
    ],
    [
      /cannot deactivate(?: or demote)? the last active admin user\.?/i,
      'ไม่สามารถระงับผู้ใช้ Admin คนสุดท้ายได้',
    ],
  ];

  for (const [pattern, replacement] of mapping) {
    if (pattern.test(normalized)) {
      return replacement;
    }
  }

  return normalized;
}

export function extractApiErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof ApiError) {
    return error.message || fallback;
  }

  const directString = toNonEmptyString(error);
  if (directString) return directString;

  if (!isRecord(error)) {
    return fallback;
  }

  const response = isRecord(error.response) ? (error.response as UnknownRecord) : null;
  const status = response && typeof response.status === 'number' ? response.status : null;
  const data = response ? response.data : undefined;

  const dataString = toNonEmptyString(data);
  if (dataString) return dataString;

  if (isRecord(data)) {
    const message = toNonEmptyString(data.message) ?? toNonEmptyString(data.Message);
    if (message) {
      const translated = translateBackendMessage(message);
      return translated + (formatKnownDetails(data.details) ?? '');
    }

    const detail = toNonEmptyString(data.detail) ?? toNonEmptyString(data.Detail);
    if (detail) {
      return translateBackendMessage(detail) + (formatKnownDetails(data.details) ?? '');
    }

    const errorValue = data.error ?? data.Error;
    const errorString = toNonEmptyString(errorValue);
    if (errorString) {
      return translateBackendMessage(errorString) + (formatKnownDetails(data.details) ?? '');
    }
    if (isRecord(errorValue)) {
      const nestedMessage =
        toNonEmptyString(errorValue.message) ??
        toNonEmptyString(errorValue.Message) ??
        toNonEmptyString(errorValue.detail) ??
        toNonEmptyString(errorValue.Detail);
      if (nestedMessage) {
        return translateBackendMessage(nestedMessage) + (formatKnownDetails(data.details) ?? '');
      }
    }

    const title = toNonEmptyString(data.title) ?? toNonEmptyString(data.Title);
    const errors = formatValidationErrors(data.errors ?? data.Errors);
    if (title) {
      return errors ? `${title}: ${errors}` : title;
    }
    if (errors) {
      return errors;
    }
  }

  if (status === 401) return 'เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่';
  if (status === 403) return 'คุณไม่มีสิทธิ์ดำเนินการนี้';
  if (status === 404) return 'ไม่พบข้อมูลหรือ API ที่ร้องขอ';
  if (status && status >= 500) return 'ระบบขัดข้อง โปรดลองอีกครั้ง';

  const genericMessage = toNonEmptyString(error.message);
  if (genericMessage) return genericMessage;

  return fallback;
}
