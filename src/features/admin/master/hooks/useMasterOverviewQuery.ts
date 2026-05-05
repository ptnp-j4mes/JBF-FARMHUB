'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { MasterModel } from '../types/master.model';
import { masterService } from '../services/master.service';

export type MasterOverviewQueryState = {
  overview: MasterModel[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  refetch: () => Promise<void>;
};

export function useMasterOverviewQuery(): MasterOverviewQueryState {
  const [overview, setOverview] = useState<MasterModel[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage(null);

    try {
      const nextOverview = await masterService.getOverview();
      setOverview(nextOverview);
    } catch (error) {
      setIsError(true);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to load master overview');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return useMemo(
    () => ({
      overview,
      isLoading,
      isError,
      errorMessage,
      refetch,
    }),
    [errorMessage, isError, isLoading, overview, refetch],
  );
}
