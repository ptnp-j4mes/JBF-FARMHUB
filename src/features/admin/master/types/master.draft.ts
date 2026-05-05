import type { MasterFormModel } from './master.form';

export interface MasterDraftModel {
  version: number;
  updatedAt: string;
  form: Partial<MasterFormModel>;
}
