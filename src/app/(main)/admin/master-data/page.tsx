import { Suspense } from 'react';
import { GlobalAppLoading } from '@/design-system';
import { MasterDataPage } from '@/features/admin/master/pages/MasterDataPage';

export default function Page() {
  return (
    <Suspense fallback={<GlobalAppLoading />}>
      <MasterDataPage title="ข้อมูลหลัก" subtitle="จัดการข้อมูลพื้นฐาน" />
    </Suspense>
  );
}
