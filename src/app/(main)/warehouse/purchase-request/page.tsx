/**
 * Purchase Request Page Wrapper
 * 
 * This page wraps the PurchasePage feature component
 */

import { PurchasePage } from '@/features/production/purchase/PurchasePage';
import type { PurchaseRequestResponse } from '@/features/production/purchase/types';
import { serverGetJson } from '@/lib/server-http';

export const dynamic = 'force-dynamic';

type SearchParams = {
  documentNumber?: string | string[];
  searchTerm?: string | string[];
};

function firstSearchValue(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value.find((item) => Boolean(item?.trim()))?.trim() ?? '';
  }

  return value?.trim() ?? '';
}

export default async function PurchaseRequestPageWrapper({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  let initialRequests: PurchaseRequestResponse[] = [];
  const resolvedSearchParams = (await searchParams) ?? {};
  const initialSearchTerm =
    firstSearchValue(resolvedSearchParams.documentNumber) ||
    firstSearchValue(resolvedSearchParams.searchTerm);

  try {
    initialRequests = await serverGetJson<PurchaseRequestResponse[]>('/api/PurchaseRequests/my');
  } catch {
    initialRequests = [];
  }
  return <PurchasePage initialRequests={initialRequests} initialSearchTerm={initialSearchTerm} />;
}
