import type { MasterDto } from '../types/master.dto';
import type { MasterModel } from '../types/master.model';
import type { MasterQueryParams } from '../types/master.query';
import { mapMasterDtoToModel } from '../utils/master.mapper';
import { masterApi } from './master.api';

async function loadMasterOverviewDtos(
  params: MasterQueryParams = {},
): Promise<MasterDto[]> {
  return await masterApi.getOverview(params);
}

async function getOverview(
  params: MasterQueryParams = {},
): Promise<MasterModel[]> {
  const dtos = await loadMasterOverviewDtos(params);
  return dtos.map(mapMasterDtoToModel);
}

export const masterService = {
  getOverview,
  refreshOverview: getOverview,
};
