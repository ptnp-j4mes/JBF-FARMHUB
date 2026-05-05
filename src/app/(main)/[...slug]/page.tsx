import Link from 'next/link';
import { Box, Button, Typography } from '@mui/material';

type RouteFallbackPageProps = {
  params: Promise<{
    slug: string[];
  }>;
};

export default async function RouteFallbackPage({ params }: RouteFallbackPageProps) {
  const { slug } = await params;
  const fullPath = `/${slug.join('/')}`;

  return (
    <Box
      component="main"
      sx={{
        minHeight: '100%',
        p: { xs: 2.5, md: 4 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 720,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 3,
          p: { xs: 3, md: 4 },
          boxShadow: 'none',
        }}
      >
        <Typography variant="h4" component="h1" fontWeight={800}>
          หน้านี้ยังไม่พร้อมใช้งาน
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Route จาก menu database: <strong>{fullPath}</strong>
        </Typography>
        <Link href="/" passHref style={{ textDecoration: 'none' }}>
          <Button variant="contained" sx={{ mt: 3 }}>
            Back to dashboard
          </Button>
        </Link>
      </Box>
    </Box>
  );
}
