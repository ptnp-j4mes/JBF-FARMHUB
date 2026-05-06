'use client';

import { EmptyState } from '@/design-system';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <EmptyState
        title="เกิดข้อผิดพลาดระหว่างแสดงผลหน้า"
        message="ระบบจะไม่ปิดการทำงาน คุณสามารถลองใหม่ได้ทันที"
        actionLabel="ลองใหม่"
        onAction={reset}
      />
    </div>
  );
}
