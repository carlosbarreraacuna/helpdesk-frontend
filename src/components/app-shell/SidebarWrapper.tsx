'use client';

import { Sidebar } from './sidebar';
import { useSidebar } from './SidebarContext';

export default function SidebarWrapper() {
  const { isOpen, toggle } = useSidebar();
  return <Sidebar isOpen={isOpen} onToggle={toggle} />;
}
