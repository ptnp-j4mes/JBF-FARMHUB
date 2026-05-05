const ACTION_SEGMENT_PATTERN = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;

export function normalizePermissionAction(
  value: string | null | undefined,
): string {
  return (value ?? '').trim();
}

export function isPermissionActionCode(value: string | null | undefined): boolean {
  return ACTION_SEGMENT_PATTERN.test(normalizePermissionAction(value));
}

export function collectPermissionActions(
  values: Iterable<string | null | undefined>,
): string[] {
  const seen = new Set<string>();
  const actions: string[] = [];

  for (const value of values) {
    const normalized = normalizePermissionAction(value);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    actions.push(normalized);
  }

  return actions;
}

export function buildPermissionActionOrder(
  values: Iterable<string | null | undefined>,
): Map<string, number> {
  return new Map(collectPermissionActions(values).map((action, index) => [action, index]));
}

export function formatPermissionActionLabel(value: string | null | undefined): string {
  const normalized = normalizePermissionAction(value);
  if (!normalized) {
    return '';
  }

  return normalized
    .split('_')
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}
