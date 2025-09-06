"use client";

import React from 'react';
import { ClientLayoutWrapper } from '@/components/layout/ClientLayoutWrapper';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { ProtectedLayout } from '@/components/layout';

export default function ApiDocsPage() {
  const src = 'https://redocly.github.io/redoc/?url=/api/docs/openapi.json';
  return (
    <ClientLayoutWrapper>
      <AuthProvider>
        <ProtectedLayout>
          <div className="flex flex-col h-screen">
            <header className="p-4 border-b">
              <h1 className="text-xl font-semibold">API Documentation</h1>
              <p className="text-sm text-gray-600">Powered by OpenAPI at /api/docs/openapi.json</p>
            </header>
            <main className="flex-1">
              <iframe
                title="OpenAPI Docs"
                src={src}
                className="w-full h-full border-0"
              />
            </main>
          </div>
        </ProtectedLayout>
      </AuthProvider>
    </ClientLayoutWrapper>
  );
}
