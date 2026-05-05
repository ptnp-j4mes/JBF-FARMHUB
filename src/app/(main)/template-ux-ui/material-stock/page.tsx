import { TemplateUxUiStockPage } from '@/features/template-ux-ui/production/stock/TemplateUxUiStockPage';
import type {
  DashboardMetricResponse,
  ItemOption,
  StockBalanceResponse,
  UomOption,
  WarehouseResponse,
} from '@/features/production/stock/types';
import { serverGetJson } from '@/lib/server-http';

export const dynamic = 'force-dynamic';

export default async function TemplateUxUiMaterialStockPage() {
  const [stockBalances, warehouses, items, uoms, dashboard] = await Promise.all([
    serverGetJson<StockBalanceResponse[]>('/api/Inventories/balance').catch(() => []),
    serverGetJson<WarehouseResponse[]>('/api/Warehouses').catch(() => []),
    serverGetJson<ItemOption[]>('/api/Items').catch(() => []),
    serverGetJson<UomOption[]>('/api/UOMs').catch(() => []),
    serverGetJson<DashboardMetricResponse>('/api/Inventories/dashboard').catch(() => null),
  ]);

  return (
    <TemplateUxUiStockPage
      initialStockBalances={stockBalances}
      initialWarehouses={warehouses}
      initialItems={items}
      initialUoms={uoms}
      initialDashboard={dashboard}
    />
  );
}
