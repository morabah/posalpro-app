'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { AlertTriangle, ArrowLeft, Package, RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Product</h1>
        <p className="text-gray-600">Update product information and specifications</p>
      </div>

      <Card className="max-w-2xl mx-auto p-6">
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Unable to Load Product Editor</h2>
        </div>
        <div className="space-y-4">
          <p className="text-gray-600 text-center">
            We're having trouble loading the product information for editing. This might be due to
            issues fetching product data or the product may no longer exist.
          </p>

          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-500 mb-2">What you can try:</p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Check if the product still exists</li>
              <li>• Verify your internet connection</li>
              <li>• Refresh the page to reload product data</li>
              <li>• Clear your browser cache if issues persist</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleGoBack} variant="outline" className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={reset} className="flex-1" variant="primary">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button
              onClick={() => (window.location.href = '/products')}
              variant="secondary"
              className="flex-1"
            >
              <Package className="w-4 h-4 mr-2" />
              All Products
            </Button>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className="text-sm text-gray-500 cursor-pointer">
                Technical Details (Development)
              </summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {error.message}
                {error.digest && `\nDigest: ${error.digest}`}
              </pre>
            </details>
          )}
        </div>
      </Card>
    </div>
  );
}
