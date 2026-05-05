import type { MasterQueryParams } from '../types/master.query';

export const masterQueryKeys = {
  all: ['master'] as const,
  list: (params: MasterQueryParams) => ['master', 'list', params] as const,
};
