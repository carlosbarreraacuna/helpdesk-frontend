import AppShell from '@/components/app-shell/AppShell';

export default function InternalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
