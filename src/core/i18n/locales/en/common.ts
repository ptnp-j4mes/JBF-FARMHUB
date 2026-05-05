import type { TranslationTree } from '@/core/i18n/types';

export const commonEn: TranslationTree = {
  actions: {
    search: 'Search',
    save: 'Save',
    cancel: 'Cancel',
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    add: 'Add',
    close: 'Close',
    confirm: 'Confirm',
  },
  status: {
    active: 'Active',
    inactive: 'Inactive',
  },
  labels: {
    rowsPerPage: 'Rows per page',
    loading: 'Loading data...',
    noData: 'No data found',
    displayedRows: '{from}-{to} of {count}',
  },
  language: {
    thai: 'Thai',
    english: 'English',
  },
  theme: {
    auto: 'System',
    light: 'Light',
    dark: 'Dark',
  },
};
