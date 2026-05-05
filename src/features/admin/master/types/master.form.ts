export interface MasterFormModel {
  code: string;
  name: string;
  ownerName: string;
  scopeCode: string;
  status: 'draft' | 'pending' | 'active' | 'inactive' | 'archived' | 'rejected' | 'completed';
}
