import ThemeContext from '@/contexts/ThemeContext';
import { I18nProvider } from '@/core/i18n';
import GlobalAppLoading from '@/components/common/GlobalAppLoading';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import 'viewerjs/dist/viewer.css';

const fallbackFontVariable = {
  ['--font-bai-jamjuree' as string]:
    '"Noto Sans Thai", "Noto Sans", "Segoe UI", system-ui, -apple-system, sans-serif',
} as const;

export const metadata: Metadata = {
  title: 'ระบบจัดการฟาร์มหมู',
  description: 'Smart Pig Farm Management System',
  icons: {
    icon: '/branding/LOGO-FH copy.png',
    shortcut: '/branding/LOGO-FH copy.png',
    apple: '/branding/LOGO-FH copy.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <body style={fallbackFontVariable}>
        <ThemeContext>
          <I18nProvider>
            {children}
            <Suspense fallback={null}>
              <GlobalAppLoading />
            </Suspense>
          </I18nProvider>
        </ThemeContext>
      </body>
    </html>
  );
}
