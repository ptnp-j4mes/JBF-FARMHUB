import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function StockAdjustmentPageAlias() {
  redirect('/warehouse/stock-adjustment-request');
}
