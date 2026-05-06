import { I18nProvider } from '@/core/i18n';
import { AppThemeProvider, GlobalAppLoading } from '@/design-system';
import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { Suspense } from 'react';
import 'viewerjs/dist/viewer.css';

const baiJamjuree = localFont({
  variable: '--font-bai-jamjuree',
  display: 'swap',
  src: [
    { path: '../assets/fonts/BaiJamjuree-ExtraLight.ttf', weight: '200', style: 'normal' },
    { path: '../assets/fonts/BaiJamjuree-ExtraLightItalic.ttf', weight: '200', style: 'italic' },
    { path: '../assets/fonts/BaiJamjuree-Light.ttf', weight: '300', style: 'normal' },
    { path: '../assets/fonts/BaiJamjuree-LightItalic.ttf', weight: '300', style: 'italic' },
    { path: '../assets/fonts/BaiJamjuree-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../assets/fonts/BaiJamjuree-Italic.ttf', weight: '400', style: 'italic' },
    { path: '../assets/fonts/BaiJamjuree-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../assets/fonts/BaiJamjuree-MediumItalic.ttf', weight: '500', style: 'italic' },
    { path: '../assets/fonts/BaiJamjuree-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../assets/fonts/BaiJamjuree-SemiBoldItalic.ttf', weight: '600', style: 'italic' },
    { path: '../assets/fonts/BaiJamjuree-SemiBold.ttf', weight: '700', style: 'normal' },
    { path: '../assets/fonts/BaiJamjuree-BoldItalic.ttf', weight: '700', style: 'italic' },
  ],
});

export const metadata: Metadata = {
  title: 'ระบบจัดการฟาร์มหมู',
  description: 'Smart Pig Farm Management System',
  icons: {
    icon: '/branding/farmhub-logo.png',
    shortcut: '/branding/farmhub-logo.png',
    apple: '/branding/farmhub-logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={baiJamjuree.variable}>
        <AppThemeProvider>
          <I18nProvider>
            {children}
            <Suspense fallback={null}>
              <GlobalAppLoading />
            </Suspense>
          </I18nProvider>
        </AppThemeProvider>
      </body>
    </html>
  );
}
