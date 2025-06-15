'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check, Loader2, Settings } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert } from '@/components/ui/feedback/Alert';
import { Button } from '@/components/ui/forms/Button';
import { cn } from '@/lib/utils';
import { predictiveValidation } from '@/lib/validation/PredictiveValidation';
import { validationEngine } from '@/lib/validation/ValidationEngine';

// Relationship types
export type RelationType = 'requires' | 'conflicts' | 'enhances' | 'replaces';

// Product relationship interface
export interface ProductRelationship {
  id: string;
  sourceProductId: string;
  targetProductId: string;
  type: RelationType;
  strength: number;
  metadata?: Record<string, any>;
}

// Form validation schema
const relationshipSchema = z.object({
  sourceProductId: z.string().min(1, 'Source product is required'),
  targetProductId: z.string().min(1, 'Target product is required'),
  type: z.enum(['requires', 'conflicts', 'enhances', 'replaces']),
  strength: z.number().min(0).max(1),
  metadata: z.record(z.any()).optional(),
});

type RelationshipFormData = z.infer<typeof relationshipSchema>;

interface ProductRelationshipManagerProps {
  products: Array<{
    id: string;
    name: string;
    category: string;
  }>;
  existingRelationships: ProductRelationship[];
  onUpdate: (relationships: ProductRelationship[]) => Promise<void>;
  analytics: any;
}

/**
 * ProductRelationshipManager Component
 *
 * Manages product relationships and dependencies with real-time validation.
 *
 * Component Traceability Matrix:
 * - User Stories: US-3.1, US-3.2, US-4.1
 * - Acceptance Criteria: AC-3.1.1, AC-3.2.1, AC-4.1.1
 * - Methods: manageRelationships(), validateCompatibility(), visualizeGraph()
 * - Hypotheses: H8 (Technical Validation)
 * - Test Cases: TC-H8-001, TC-H8-002, TC-H8-003
 */
export function ProductRelationshipManager({
  products,
  existingRelationships,
  onUpdate,
  analytics,
}: ProductRelationshipManagerProps) {
  // State management
  const [relationships, setRelationships] = useState<ProductRelationship[]>(existingRelationships);
  const [validationResults, setValidationResults] = useState<any>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [predictions, setPredictions] = useState<any>(null);
  const [selectedRelationship, setSelectedRelationship] = useState<string | null>(null);

  // Form handling
  const form = useForm<RelationshipFormData>({
    resolver: zodResolver(relationshipSchema),
    defaultValues: {
      sourceProductId: '',
      targetProductId: '',
      type: 'requires',
      strength: 1,
    },
  });

  // Memoized product lookup
  const productMap = useMemo(
    () =>
      products.reduce(
        (acc, product) => {
          acc[product.id] = product;
          return acc;
        },
        {} as Record<string, (typeof products)[0]>
      ),
    [products]
  );

  // Validate relationships
  const validateRelationships = useCallback(async () => {
    setIsValidating(true);
    try {
      // Validate using ValidationEngine
      const validationPromises = relationships.map(rel =>
        validationEngine.validateRelationships(rel.sourceProductId, [rel.targetProductId])
      );
      const results = await Promise.all(validationPromises);

      // Get predictive insights
      const predictions = await predictiveValidation.predictValidationIssues({
        productId: relationships[0]?.sourceProductId,
        relatedProductIds: relationships.map(r => r.targetProductId),
      });

      setValidationResults(results);
      setPredictions(predictions);

      // Track analytics
      analytics.trackEvent('relationships_validated', {
        relationshipCount: relationships.length,
        validationResults: results,
        predictions: predictions,
      });
    } catch (error) {
      console.error('Validation error:', error);
      setValidationResults({ error: 'Validation failed' });
    } finally {
      setIsValidating(false);
    }
  }, [relationships, analytics]);

  // Add new relationship
  const addRelationship = useCallback(
    async (data: RelationshipFormData) => {
      const newRelationship: ProductRelationship = {
        id: `rel_${Date.now()}`,
        ...data,
      };

      const updatedRelationships = [...relationships, newRelationship];
      setRelationships(updatedRelationships);
      await onUpdate(updatedRelationships);

      // Track analytics
      analytics.trackEvent('relationship_added', {
        relationshipId: newRelationship.id,
        type: newRelationship.type,
        products: [newRelationship.sourceProductId, newRelationship.targetProductId],
      });

      form.reset();
    },
    [relationships, onUpdate, analytics, form]
  );

  // Remove relationship
  const removeRelationship = useCallback(
    async (relationshipId: string) => {
      const updatedRelationships = relationships.filter(r => r.id !== relationshipId);
      setRelationships(updatedRelationships);
      await onUpdate(updatedRelationships);

      // Track analytics
      analytics.trackEvent('relationship_removed', {
        relationshipId,
      });
    },
    [relationships, onUpdate, analytics]
  );

  // Update relationship
  const updateRelationship = useCallback(
    async (relationshipId: string, updates: Partial<ProductRelationship>) => {
      const updatedRelationships = relationships.map(r =>
        r.id === relationshipId ? { ...r, ...updates } : r
      );
      setRelationships(updatedRelationships);
      await onUpdate(updatedRelationships);

      // Track analytics
      analytics.trackEvent('relationship_updated', {
        relationshipId,
        updates,
      });
    },
    [relationships, onUpdate, analytics]
  );

  // Validate on relationships change
  useEffect(() => {
    if (relationships.length > 0) {
      validateRelationships();
    }
  }, [relationships, validateRelationships]);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Product Relationships</h2>

        {/* Add new relationship form */}
        <form onSubmit={form.handleSubmit(addRelationship)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Source Product</label>
              <select
                {...form.register('sourceProductId')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select product...</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Target Product</label>
              <select
                {...form.register('targetProductId')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select product...</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Relationship Type</label>
              <select
                {...form.register('type')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="requires">Requires</option>
                <option value="conflicts">Conflicts</option>
                <option value="enhances">Enhances</option>
                <option value="replaces">Replaces</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Strength</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="1"
                {...form.register('strength', { valueAsNumber: true })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <Button type="submit" className="w-full">
            Add Relationship
          </Button>
        </form>

        {/* Existing relationships */}
        <div className="mt-6">
          <h3 className="text-md font-medium mb-3">Existing Relationships</h3>
          <div className="space-y-2">
            {relationships.map(relationship => (
              <div
                key={relationship.id}
                className={cn(
                  'p-4 rounded-md border',
                  selectedRelationship === relationship.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200'
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {productMap[relationship.sourceProductId]?.name} →{' '}
                      {productMap[relationship.targetProductId]?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      Type: {relationship.type}, Strength: {relationship.strength}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedRelationship(relationship.id)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeRelationship(relationship.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                {/* Validation results */}
                {validationResults && !isValidating && (
                  <div className="mt-2">
                    {validationResults
                      .find((r: any) => r.metadata.productId === relationship.sourceProductId)
                      ?.results.map((result: any, index: number) => (
                        <div
                          key={index}
                          className={cn(
                            'text-sm p-2 rounded mt-1',
                            result.isValid ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                          )}
                        >
                          <div className="flex items-center">
                            {result.isValid ? (
                              <Check className="w-4 h-4 mr-2" />
                            ) : (
                              <AlertCircle className="w-4 h-4 mr-2" />
                            )}
                            {result.message}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Validation status */}
        {isValidating && (
          <div className="mt-4 flex items-center justify-center text-gray-600">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            Validating relationships...
          </div>
        )}

        {/* Predictive insights */}
        {predictions && predictions.predictedIssues.length > 0 && (
          <div className="mt-4">
            <Alert>
              <AlertCircle className="w-4 h-4 mr-2" />
              <div>
                <h4 className="font-medium">Potential Issues Detected</h4>
                <ul className="mt-2 list-disc list-inside">
                  {predictions.predictedIssues.map((issue: any, index: number) => (
                    <li key={index} className="text-sm">
                      {issue.message} (Confidence: {Math.round(issue.confidence * 100)}%)
                    </li>
                  ))}
                </ul>
              </div>
            </Alert>
          </div>
        )}
      </div>
    </div>
  );
}
