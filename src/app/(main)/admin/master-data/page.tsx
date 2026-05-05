import { Suspense } from 'react';
import { MasterDataPage } from '@/features/admin/master/pages/MasterDataPage';
import { Box, CircularProgress } from '@mui/material';

export default function Page() {
  return (
    <Suspense fallback={
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh' }}>
        <CircularProgress />
      </Box>
    }>
      <MasterDataPage title="ข้อมูลหลัก" subtitle="จัดการข้อมูลพื้นฐาน" />
    </Suspense>
  );
}
