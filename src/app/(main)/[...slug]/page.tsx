import Link from 'next/link';
import { Placeholder } from '@/design-system';

type RouteFallbackPageProps = {
  params: Promise<{
    slug: string[];
  }>;
};

export default async function RouteFallbackPage({ params }: RouteFallbackPageProps) {
  const { slug } = await params;
  const fullPath = `/${slug.join('/')}`;

  return (
    <main
      style={{
        minHeight: '100%',
        padding: '24px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: 720 }}>
        <Placeholder
          title="หน้านี้ยังไม่พร้อมใช้งาน"
          subtitle={`Route จาก menu database: ${fullPath}`}
        />
        <div style={{ marginTop: 24 }}>
          <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 40,
                paddingInline: 16,
                borderRadius: 999,
                background: '#2563eb',
                color: '#ffffff',
                fontWeight: 700,
              }}
            >
              Back to dashboard
            </span>
          </Link>
        </div>
      </div>
    </main>
  );
}
