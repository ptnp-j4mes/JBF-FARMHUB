'use client';

import { useMemo } from 'react';
import {
  useMasterOverviewQuery,
  type MasterOverviewQueryState,
} from './useMasterOverviewQuery';
import {
  useMasterUpdateOverviewMutation,
  type MasterUpdateOverviewMutationState,
} from './useMasterUpdateOverviewMutation';

export type MasterOverviewPageState = MasterOverviewQueryState &
  MasterUpdateOverviewMutationState & {
    isReady: boolean;
    isMutating: boolean;
  };

export function useMasterOverviewPage(): MasterOverviewPageState {
  const query = useMasterOverviewQuery();
  const mutation = useMasterUpdateOverviewMutation();

  return useMemo(
    () => ({
      ...query,
      ...mutation,
      isReady: !query.isLoading && !query.isError,
      isMutating: mutation.isPending,
    }),
    [mutation, query],
  );
}
