import { Suspense } from 'react';
import AccessSelectionPage from '@/features/auth/components/AccessSelectionPage';

export default function Page() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'sans-serif',
            color: '#475569',
          }}
        >
          Loading access context...
        </main>
      }
    >
      <AccessSelectionPage />
    </Suspense>
  );
}
