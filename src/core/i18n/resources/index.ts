import type { AppLocale, TranslationTree } from '@/core/i18n/types';
import { commonTh } from '@/core/i18n/locales/th/common';
import { commonEn } from '@/core/i18n/locales/en/common';
import { layoutTh } from '@/core/i18n/locales/th/layout';
import { layoutEn } from '@/core/i18n/locales/en/layout';
import { adminUsersTh } from '@/core/i18n/locales/th/features/admin/user-assignment';
import { adminUsersEn } from '@/core/i18n/locales/en/features/admin/user-assignment';
import { productionStockTh } from '@/core/i18n/locales/th/features/production/stock';
import { productionStockEn } from '@/core/i18n/locales/en/features/production/stock';

export const resources: Record<AppLocale, TranslationTree> = {
  th: {
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
  },
  en: {
    common: commonEn,
    layout: layoutEn,
    features: {
      admin: {
        users: adminUsersEn,
      },
      production: {
        stock: productionStockEn,
      },
    },
  },
};
