'use client';

import HelpdeskWidget from '@/components/widget/HelpdeskWidget';
import TicketNotifications from '@/components/TicketNotifications';
import { useAuthStore } from '@/lib/auth-store';

export default function WidgetWrapper() {
  const { user, token } = useAuthStore();
  if (!user || !token) return null;
  return (
    <>
      <HelpdeskWidget user={{ id: user.id, name: user.name, token }} />
      <TicketNotifications token={token} userRole={user.role?.name ?? ''} />
    </>
  );
}
