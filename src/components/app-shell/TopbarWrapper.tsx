'use client';

import { Topbar } from './topbar';
import { useSidebar } from './SidebarContext';

export default function TopbarWrapper() {
  const { isOpen, toggle } = useSidebar();
  return <Topbar sidebarOpen={isOpen} onToggleSidebar={toggle} />;
}
