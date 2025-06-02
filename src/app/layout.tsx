/**
 * PosalPro MVP2 - Root Layout
 * Global layout with error boundaries and providers
 */

import { ToastProvider } from '@/components/feedback/Toast/ToastProvider';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ErrorBoundary } from '@/components/providers/ErrorBoundary';
import '@/styles/globals.css';
import { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PosalPro - AI-Powered Proposal Management',
  description: 'Streamline your proposal process with intelligent automation',
  keywords: ['proposals', 'business development', 'automation', 'AI'],
  authors: [{ name: 'PosalPro Team' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <ErrorBoundary enableReporting={process.env.NODE_ENV === 'production'}>
          <ToastProvider position="top-right" maxToasts={5}>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
