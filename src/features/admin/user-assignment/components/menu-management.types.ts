import type { MenuListResponse } from '@/features/admin/menu-management/types';

export type MenuManagementDialogMode = 'create' | 'view' | 'edit';

export type MenuManagementFormState = {
  labelTh: string;
  code: string;
  nodeType: string;
  parentId: number | null;
  sortOrder: number;
  iconKey: string;
  path: string;
  activePathPrefix: string;
};

export type MenuManagementIndex = {
  rows: MenuListResponse[];
  rowsById: Map<number, MenuListResponse>;
  folders: MenuListResponse[];
  folderIds: Set<number>;
  rootItems: MenuListResponse[];
  orphanItems: MenuListResponse[];
  childrenByParentId: Map<number, MenuListResponse[]>;
};
