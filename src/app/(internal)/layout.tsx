import AppShell from '@/components/app-shell/AppShell';
import AuthGuard from '@/components/auth/AuthGuard';

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
