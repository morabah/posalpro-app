/**
 * PosalPro MVP2 - Root Layout
 * Global layout with error boundaries and providers
 */

import { ToastProvider } from '@/components/feedback/Toast/ToastProvider';
import { ClientLayoutWrapper } from '@/components/layout/ClientLayoutWrapper';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { SharedAnalyticsProvider } from '@/components/providers/SharedAnalyticsProvider';
import { WebVitalsProvider } from '@/components/providers/WebVitalsProvider';
import '@/styles/globals.css';
import { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'PosalPro - AI-Powered Proposal Management',
  description:
    'Streamline your proposal process with AI-powered automation and collaboration tools.',
  keywords: 'proposal management, AI automation, business proposals, collaboration tools',
  authors: [{ name: 'PosalPro Team' }],
  creator: 'PosalPro',
  publisher: 'PosalPro',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'PosalPro - AI-Powered Proposal Management',
    description:
      'Streamline your proposal process with AI-powered automation and collaboration tools.',
    url: '/',
    siteName: 'PosalPro',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PosalPro - AI-Powered Proposal Management',
    description:
      'Streamline your proposal process with AI-powered automation and collaboration tools.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <WebVitalsProvider>
          <SharedAnalyticsProvider>
            <ClientLayoutWrapper>
              <QueryProvider>
                <ToastProvider position="top-right" maxToasts={5}>
                  <AuthProvider>{children}</AuthProvider>
                </ToastProvider>
              </QueryProvider>
            </ClientLayoutWrapper>
          </SharedAnalyticsProvider>
        </WebVitalsProvider>
      </body>
    </html>
  );
}
