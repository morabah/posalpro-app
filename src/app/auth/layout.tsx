/**
 * Auth Layout (lightweight)
 * Wraps auth pages with minimal providers required for authentication hooks.
 */
import { QueryProvider } from '@/components/providers/QueryProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ClientLayoutWrapper } from '@/components/layout/ClientLayoutWrapper';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ClientLayoutWrapper>
        <AuthProvider>{children}</AuthProvider>
      </ClientLayoutWrapper>
    </QueryProvider>
  );
}
