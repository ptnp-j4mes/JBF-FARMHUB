'use client';

import { useEffect, useState } from 'react';
import { loadUserAssignmentDetail } from '../services/user-assignment.api';
import type { UserAssignmentDetail, UserAssignmentWorkspace } from '../types';

type DetailState = {
  detail: UserAssignmentDetail | null;
  loading: boolean;
  error: string | null;
};

export function useUserAssignmentDetail(
  userId: number | null | undefined,
  workspace: UserAssignmentWorkspace | null,
  enabled = true,
) {
  const [state, setState] = useState<DetailState>({
    detail: null,
    loading: Boolean(enabled && userId),
    error: null,
  });

  useEffect(() => {
    if (!enabled || !userId || !workspace) {
      setState({ detail: null, loading: false, error: null });
      return;
    }

    let active = true;
    setState({ detail: null, loading: true, error: null });

    loadUserAssignmentDetail(userId, workspace)
      .then((detail) => {
        if (active) {
          setState({ detail, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (active) {
          const message =
            error instanceof Error ? error.message : 'Failed to load user assignment detail.';
          setState({ detail: null, loading: false, error: message });
        }
      });

    return () => {
      active = false;
    };
  }, [enabled, userId, workspace]);

  return {
    detail: state.detail,
    loading: state.loading,
    error: state.error,
  } as const;
}
