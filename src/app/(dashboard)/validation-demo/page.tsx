import { CustomerFormExample } from '@/components/examples/CustomerFormExample';
// import { ProductFormExample } from '@/components/examples/ProductFormExample'; // Temporarily disabled due to TypeScript issues
import { Card } from '@/components/ui/Card';

export default function ValidationDemoPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Validation Library Demo</h1>
          <p className="text-lg text-gray-600">
            Test the new reusable validation library with real-time feedback
          </p>
        </div>

        {/* Demo Forms */}
        <div className="grid lg:grid-cols-1 gap-8">
          <CustomerFormExample />
          {/* <ProductFormExample /> {/* Temporarily disabled due to TypeScript issues */}
        </div>

        {/* Features Overview */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Validation Library Features
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-800">Real-time Validation</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Immediate feedback on field changes</li>
                  <li>• Visual error indicators (red borders)</li>
                  <li>• Clear error messages below fields</li>
                  <li>• Form-level error summary</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-800">User Experience</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Disabled submit button when invalid</li>
                  <li>• Touch-based validation (on blur)</li>
                  <li>• Consistent error message format</li>
                  <li>• Actionable error guidance</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-800">Developer Experience</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Reusable validation schemas</li>
                  <li>• Type-safe validation rules</li>
                  <li>• Built-in validation patterns</li>
                  <li>• Easy integration with forms</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-medium text-gray-800">Performance</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Optimized validation timing</li>
                  <li>• Debounced validation support</li>
                  <li>• Efficient error state management</li>
                  <li>• Minimal re-renders</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>

        {/* Usage Instructions */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">How to Test</h2>
            <div className="space-y-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">1. Required Fields</h4>
                <p>
                  Try leaving the Company Name or Email fields empty and click Save. You should see
                  validation errors.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">2. Format Validation</h4>
                <p>
                  Enter invalid formats in Email (e.g., "invalid"), Phone (e.g., "abc"), or Website
                  (e.g., "not-a-url") fields.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">3. Numeric Validation</h4>
                <p>
                  Try entering negative numbers or zero in Annual Revenue or Employee Count fields.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">4. Real-time Feedback</h4>
                <p>
                  Watch how errors appear immediately as you type and disappear when you fix them.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">5. Form State</h4>
                <p>Notice how the Save button is disabled when there are validation errors.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
