'use client';

import AccessGuard, { type AccessGuardProps } from '@/components/guards/AccessGuard';

/**
 * @deprecated Use AccessGuard directly.
 * Kept as compatibility wrapper for existing imports.
 */
export default function RoleContext(props: AccessGuardProps) {
  return <AccessGuard {...props} />;
}
