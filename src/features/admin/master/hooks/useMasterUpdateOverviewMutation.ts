'use client';

import { useCallback, useMemo, useState } from 'react';
import type { MasterModel } from '../types/master.model';
import { masterService } from '../services/master.service';

export type MasterUpdateOverviewMutationState = {
  isPending: boolean;
  mutate: (mutation?: () => Promise<void>) => Promise<void>;
  refreshOverview: () => Promise<MasterModel[]>;
};

export function useMasterUpdateOverviewMutation(): MasterUpdateOverviewMutationState {
  const [isPending, setIsPending] = useState(false);

  const mutate = useCallback(async (mutation?: () => Promise<void>) => {
    if (!mutation) {
      return;
    }

    setIsPending(true);
    try {
      await mutation();
    } finally {
      setIsPending(false);
    }
  }, []);

  const refreshOverview = useCallback(async (): Promise<MasterModel[]> => {
    setIsPending(true);
    try {
      return await masterService.refreshOverview();
    } finally {
      setIsPending(false);
    }
  }, []);

  return useMemo(
    () => ({
      isPending,
      mutate,
      refreshOverview,
    }),
    [isPending, mutate, refreshOverview],
  );
}
