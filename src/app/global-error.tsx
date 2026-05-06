'use client';

import { EmptyState } from '@/design-system';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="th">
      <body>
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <EmptyState
            title="ระบบเกิดข้อผิดพลาดชั่วคราว"
            message="ไม่จำเป็นต้องรัน dev ใหม่ ให้ลองโหลดใหม่ได้จากปุ่มด้านล่าง"
            actionLabel="โหลดใหม่"
            onAction={reset}
          />
        </div>
      </body>
    </html>
  );
}
