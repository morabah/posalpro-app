/**
 * Product Error Fallback Component
 *
 * Provides user-friendly error handling for product-related operations
 * Component Traceability: US-3.1, US-3.2, H3, H4
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { logError } from '@/lib/logger';
import { ArrowLeftIcon, ArrowPathIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProductErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  productId?: string;
  operation?: string;
}

export function ProductErrorFallback({
  error,
  resetErrorBoundary,
  productId,
  operation = 'unknown',
}: ProductErrorFallbackProps) {
  const router = useRouter();

  useEffect(() => {
    // Log the error for debugging
    logError('Product operation failed', {
      component: 'ProductErrorFallback',
      operation,
      productId,
      error: error.message,
      stack: error.stack,
    });
  }, [error, operation, productId]);

  const handleGoBack = () => {
    if (productId) {
      router.push(`/products/${productId}`);
    } else {
      router.push('/products');
    }
  };

  const handleGoToProducts = () => {
    router.push('/products');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <div className="p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Product Operation Failed</h2>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600 text-center">
              We encountered an error while{' '}
              {operation === 'update'
                ? 'updating'
                : operation === 'create'
                  ? 'creating'
                  : operation === 'delete'
                    ? 'deleting'
                    : 'processing'}{' '}
              the product. Please try again.
            </p>

            <div className="space-y-2">
              <Button onClick={resetErrorBoundary} className="w-full" variant="primary">
                <ArrowPathIcon className="h-4 w-4 mr-2" />
                Try Again
              </Button>

              {productId && (
                <Button onClick={handleGoBack} className="w-full" variant="outline">
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Product
                </Button>
              )}

              <Button onClick={handleGoToProducts} className="w-full" variant="outline">
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back to Products
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
