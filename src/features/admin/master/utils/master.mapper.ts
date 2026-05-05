import dayjs from '@/lib/dayjs';
import type { MasterDto, MasterLifecycleDto } from '../types/master.dto';
import type { MasterLifecycleModel, MasterModel } from '../types/master.model';

function normalizeMasterStatus(status: MasterLifecycleDto | null): MasterLifecycleModel {
  const normalized = status?.trim().toLowerCase();

  if (normalized === 'draft') return 'draft';
  if (normalized === 'pending') return 'pending';
  if (normalized === 'active') return 'active';
  if (normalized === 'inactive') return 'inactive';
  if (normalized === 'archived') return 'archived';
  if (normalized === 'rejected') return 'rejected';
  if (normalized === 'completed') return 'completed';

  return 'unknown';
}

function formatMasterUpdatedAt(updatedAt: string | null): string {
  if (!updatedAt) {
    return '-';
  }

  const parsed = dayjs(updatedAt);
  if (!parsed.isValid()) {
    return '-';
  }

  return parsed.format('DD/MM/YYYY HH:mm');
}

export function mapMasterDtoToModel(dto: MasterDto): MasterModel {
  return {
    id: dto.id,
    code: dto.code?.trim() || '-',
    name: dto.name?.trim() || '-',
    ownerName: dto.owner_name?.trim() || '-',
    scopeCode: dto.scope_code?.trim() || '-',
    status: normalizeMasterStatus(dto.status),
    updatedAt: dto.updated_at,
    updatedAtLabel: formatMasterUpdatedAt(dto.updated_at),
  };
}
