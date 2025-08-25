import { Metadata } from 'next';

// ✅ PAGE_METADATA: Export metadata for Next.js App Router
export const metadata: Metadata = {
  title: 'Customer Management | PosalPro',
  description: 'Manage your customer relationships and data with comprehensive CRM tools.',
  keywords: 'customer management, CRM, customer data, customer relationships',
  openGraph: {
    title: 'Customer Management | PosalPro',
    description: 'Manage your customer relationships and data with comprehensive CRM tools.',
    type: 'website',
  },
};

// ✅ SSR_OPTIMIZATION: Server-side rendering optimization
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function CustomersLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
