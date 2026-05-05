type UserNameLike = {
  prefix?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
};

function normalizePart(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function formatUserDisplayName(
  user: UserNameLike | null | undefined,
  fallback = '-',
): string {
  const parts = [
    normalizePart(user?.prefix),
    normalizePart(user?.firstName),
    normalizePart(user?.lastName),
  ].filter((part): part is string => Boolean(part));

  if (parts.length > 0) {
    return parts.join(' ');
  }

  return normalizePart(user?.username) ?? fallback;
}

export function getUserDisplayInitial(user: UserNameLike | null | undefined): string {
  const firstName = normalizePart(user?.firstName);
  if (firstName) {
    return firstName.charAt(0).toUpperCase();
  }

  const displayName = formatUserDisplayName(user, 'U');
  return displayName.charAt(0).toUpperCase();
}
