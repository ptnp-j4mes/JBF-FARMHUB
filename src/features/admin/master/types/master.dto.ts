export type MasterLifecycleDto = 'draft' | 'pending' | 'active' | 'inactive' | 'archived' | 'rejected' | 'completed';

export interface MasterDto {
  id: string;
  code: string | null;
  name: string | null;
  owner_name: string | null;
  scope_code: string | null;
  status: MasterLifecycleDto | null;
  updated_at: string | null;
}
