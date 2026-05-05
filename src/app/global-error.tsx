'use client';

import { Box, Button, Stack, Typography } from '@mui/material';

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
        <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center', p: 3 }}>
          <Stack spacing={1.5} alignItems="center" sx={{ textAlign: 'center', maxWidth: 560 }}>
            <Typography variant="h6" fontWeight={800}>
              ระบบเกิดข้อผิดพลาดชั่วคราว
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ไม่จำเป็นต้องรัน dev ใหม่ ให้ลองโหลดใหม่ได้จากปุ่มด้านล่าง
            </Typography>
            <Button variant="contained" onClick={reset}>
              โหลดใหม่
            </Button>
          </Stack>
        </Box>
      </body>
    </html>
  );
}
