import AccessBootstrapGuard from '@/components/guards/AccessBootstrapGuard';
import { LayoutMainBar } from '@/design-system';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AccessBootstrapGuard>
      <LayoutMainBar>{children}</LayoutMainBar>
    </AccessBootstrapGuard>
  );
}
