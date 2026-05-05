'use client';

import { Box, Button, Stack, Typography } from '@mui/material';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center', p: 3 }}>
      <Stack spacing={1.5} alignItems="center" sx={{ textAlign: 'center', maxWidth: 560 }}>
        <Typography variant="h6" fontWeight={800}>
          เกิดข้อผิดพลาดระหว่างแสดงผลหน้า
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ระบบจะไม่ปิดการทำงาน คุณสามารถลองใหม่ได้ทันที
        </Typography>
        <Button variant="contained" onClick={reset}>
          ลองใหม่
        </Button>
      </Stack>
    </Box>
  );
}
