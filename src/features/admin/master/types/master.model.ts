export type MasterLifecycleModel =
  | 'draft'
  | 'pending'
  | 'active'
  | 'inactive'
  | 'archived'
  | 'rejected'
  | 'completed'
  | 'unknown';

export interface MasterModel {
  id: string;
  code: string;
  name: string;
  ownerName: string;
  scopeCode: string;
  status: MasterLifecycleModel;
  updatedAt: string | null;
  updatedAtLabel: string;
}
