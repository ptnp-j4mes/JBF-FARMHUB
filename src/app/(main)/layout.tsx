import AccessBootstrapGuard from '@/components/guards/AccessBootstrapGuard';
import LayoutMainBar from '@/components/layout/LayoutMainBar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessBootstrapGuard>
      <LayoutMainBar>{children}</LayoutMainBar>
    </AccessBootstrapGuard>
  );
}
