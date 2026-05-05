'use client';

import { useCallback, useEffect, useState } from 'react';
import { loadUserAssignmentWorkspace } from '../services/user-assignment.api';
import type { UserAssignmentWorkspace } from '../types';

type WorkspaceState = {
  workspace: UserAssignmentWorkspace | null;
  loading: boolean;
  error: string | null;
};

export function useUserAssignmentWorkspace(autoLoad = true) {
  const [state, setState] = useState<WorkspaceState>({
    workspace: null,
    loading: Boolean(autoLoad),
    error: null,
  });

  const reload = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const workspace = await loadUserAssignmentWorkspace();
      setState({ workspace, loading: false, error: null });
      return workspace;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load user assignment workspace.';
      setState({ workspace: null, loading: false, error: message });
      throw error;
    }
  }, []);

  useEffect(() => {
    if (!autoLoad) {
      setState({ workspace: null, loading: false, error: null });
      return;
    }

    let active = true;
    setState((current) => ({ ...current, loading: true, error: null }));

    loadUserAssignmentWorkspace()
      .then((workspace) => {
        if (active) {
          setState({ workspace, loading: false, error: null });
        }
      })
      .catch((error) => {
        if (active) {
          const message =
            error instanceof Error ? error.message : 'Failed to load user assignment workspace.';
          setState({ workspace: null, loading: false, error: message });
        }
      });

    return () => {
      active = false;
    };
  }, [autoLoad]);

  return {
    workspace: state.workspace,
    loading: state.loading,
    error: state.error,
    reload,
  } as const;
}
