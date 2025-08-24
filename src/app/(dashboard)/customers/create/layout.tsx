import { Metadata } from 'next';

// ✅ PAGE_METADATA: Export metadata for Next.js App Router
export const metadata: Metadata = {
  title: 'Create Customer | PosalPro',
  description: "Create a new customer in PosalPro's comprehensive customer management system.",
  keywords: 'customer creation, new customer, CRM, customer management',
  openGraph: {
    title: 'Create Customer | PosalPro',
    description: "Create a new customer in PosalPro's comprehensive customer management system.",
    type: 'website',
  },
};

// ✅ SSR_OPTIMIZATION: Server-side rendering optimization
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function CustomerCreateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
