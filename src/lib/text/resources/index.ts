import type { TextTree } from '@/lib/text/types';
import { commonTh } from './common';
import { layoutTh } from './layout';
import { adminUsersTh } from './features/admin/user-assignment';
import { productionStockTh } from './features/production/stock';

export const thaiTextResources: TextTree = {
  common: commonTh,
  layout: layoutTh,
  features: {
    admin: {
      users: adminUsersTh,
    },
    production: {
      stock: productionStockTh,
    },
  },
};
