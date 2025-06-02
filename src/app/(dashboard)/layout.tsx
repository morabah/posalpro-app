/**
 * PosalPro MVP2 - Dashboard Layout
 * Layout for all authenticated pages with full navigation system
 * Based on wireframe specifications and component structure guidelines
 */

import { ProtectedLayout } from '@/components/layout';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout>{children}</ProtectedLayout>;
}
