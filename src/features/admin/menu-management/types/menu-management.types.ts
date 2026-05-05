export type IsoDateString = string;

export interface MenuGroupResponse {
  id: number;
  menuGroupName: string;
  menuGroupSlug: string;
  createAt: IsoDateString;
  updateAt?: IsoDateString | null;
  sortOrder: number;
}

export interface MenuListResponse {
  id: number;
  code: string;
  labelTh: string;
  nodeType: string;
  parentId: number | null;
  menuGroupName?: string;
  isActive: boolean;
  createAt: IsoDateString;
  updateAt?: IsoDateString | null;
  sortOrder: number;
  path?: string | null;
  iconKey?: string | null;
  activePathPrefix?: string | null;
}

export interface MenuListUpsertRequest {
  code: string;
  labelTh: string;
  nodeType: string;
  parentId?: number | null;
  sortOrder?: number;
  path?: string | null;
  iconKey?: string | null;
  activePathPrefix?: string | null;
  isActive?: boolean;
}
