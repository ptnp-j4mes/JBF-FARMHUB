export function normalizePermissionPart(
  value: string | null | undefined,
): string {
  return (value ?? '').trim();
}

export function normalizePermissionResource(
  resource: string | null | undefined,
): string {
  return normalizePermissionPart(resource);
}

export function normalizePermissionCode(
  code: string | null | undefined,
): string | null {
  const normalized = normalizePermissionPart(code);
  if (!normalized) {
    return null;
  }

  const parts = normalized
    .split('.')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length < 2) {
    return normalized;
  }

  const resource = normalizePermissionResource(parts.slice(0, -1).join('.'));
  if (!resource) {
    return null;
  }

  return `${resource}.${parts[parts.length - 1]}`;
}

export function splitPermissionCode(
  code: string | null | undefined,
): { resource: string; action: string } | null {
  const normalized = normalizePermissionCode(code);
  if (!normalized) {
    return null;
  }

  const parts = normalized.split('.').filter(Boolean);
  if (parts.length < 2) {
    return null;
  }

  return {
    resource: parts.slice(0, -1).join('.'),
    action: parts[parts.length - 1],
  };
}
