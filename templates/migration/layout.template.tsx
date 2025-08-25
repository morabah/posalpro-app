// Layout Template for Migration from Bridge Pattern
// Provider Stack Order (CRITICAL)

import QueryProvider from '@/lib/queryClient';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';
// import AnalyticsProvider if you have one

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    // <AnalyticsProvider>
    <QueryProvider>
      <SessionProvider>
        <Toaster richColors closeButton />
        {children}
      </SessionProvider>
    </QueryProvider>
    // </AnalyticsProvider>
  );
}
