'use client';

/**
 * PosalPro MVP2 - Advanced Product Creation Modal
 * Wireframe-compliant modal with all advanced features
 * User Story: US-3.2 (License requirement validation)
 * Hypothesis: H8 (Technical Configuration Validation - 50% error reduction)
 */

import { Card } from '@/components/ui/Card';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';
import { Button } from '@/components/ui/forms/Button';
import { useHybridProducts } from '@/hooks/useHybridProducts';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logError, logInfo } from '@/lib/logger';
import React, { useCallback, useState } from 'react';

// Form data structure
interface ProductFormData {
  // Basic fields
  name: string;
  productId: string;
  sku: string;
  category: string;
  subCategory: string;
  shortDescription: string;
  detailedDescription: string;

  // Pricing
  priceModel: 'Fixed Price' | 'Hourly Rate' | 'Subscription';
  basePrice: number;
  discountOptions: {
    volumeDiscount: boolean;
    annualCommitment: boolean;
    newClientDiscount: boolean;
  };

  // Customizations
  customizationOptions: Array<{
    id: string;
    name: string;
    type: 'single-select' | 'multi-select' | 'text' | 'number';
    options: Array<{
      name: string;
      modifier: number;
      description?: string;
    }>;
  }>;

  // Visibility
  status: 'Draft' | 'Active';
  showInCatalog: boolean;
  featured: boolean;
}

// Type definitions for product modal
type TabId = 'info' | 'pricing' | 'customization' | 'resources' | 'visibility';

interface ProductSuccessData {
  id: string;
  name: string;
  productId: string;
  sku: string;
  category: string;
  priceModel: 'Fixed Price' | 'Hourly Rate' | 'Subscription';
  basePrice: number;
  status: string;
  [key: string]: unknown;
}

interface CustomizationOptionUpdate {
  name?: string;
  type?: 'single-select' | 'multi-select' | 'text' | 'number';
  options?: Array<{
    name: string;
    modifier: number;
    description?: string;
  }>;
}

interface AdvancedProductModalProps {
  id?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (product: ProductSuccessData) => void;
}

export default function AdvancedProductModal({
  id,
  isOpen,
  onClose,
  onSuccess,
}: AdvancedProductModalProps) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const { calculatePricing } = useHybridProducts({
    enableMockData: true,
    includeAdvancedFeatures: true,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('info');

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    productId: '',
    sku: '',
    category: '',
    subCategory: '',
    shortDescription: '',
    detailedDescription: '',
    priceModel: 'Fixed Price',
    basePrice: 0,
    discountOptions: {
      volumeDiscount: false,
      annualCommitment: false,
      newClientDiscount: false,
    },
    customizationOptions: [],
    status: 'Draft',
    showInCatalog: true,
    featured: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generate product ID when name changes
  const generateProductId = useCallback((name: string) => {
    if (!name.trim()) return '';
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    return `${cleanName.slice(0, 3)}-${timestamp}`;
  }, []);

  const handleNameChange = useCallback(
    (name: string) => {
      setFormData(prev => ({
        ...prev,
        name,
        productId: generateProductId(name),
      }));
    },
    [generateProductId]
  );

  // Add customization option
  const addCustomizationOption = useCallback(() => {
    const newOption = {
      id: `opt_${Date.now()}`,
      name: '',
      type: 'single-select' as const,
      options: [{ name: '', modifier: 0 }],
    };

    setFormData(prev => ({
      ...prev,
      customizationOptions: [...prev.customizationOptions, newOption],
    }));
  }, []);

  // Update customization option
  const updateCustomizationOption = useCallback((index: number, updates: CustomizationOptionUpdate) => {
    setFormData(prev => ({
      ...prev,
      customizationOptions: prev.customizationOptions.map((opt, i) =>
        i === index ? { ...opt, ...updates } : opt
      ),
    }));
  }, []);

  // Remove customization option
  const removeCustomizationOption = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      customizationOptions: prev.customizationOptions.filter((_, i) => i !== index),
    }));
  }, []);

  // Calculate pricing preview
  const pricingPreview = React.useMemo(() => {
    if (!formData.basePrice) return null;

    const customizations = formData.customizationOptions.flatMap(opt =>
      opt.options
        .filter(o => o.name)
        .map(o => ({
          name: o.name,
          modifier: o.modifier,
        }))
    );

    return calculatePricing('preview', customizations);
  }, [formData.basePrice, formData.customizationOptions, calculatePricing]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);

      try {
        // Basic validation
        const newErrors: Record<string, string> = {};

        if (!formData.name.trim()) newErrors.name = 'Product name is required';
        if (!formData.category) newErrors.category = 'Category is required';
        if (!formData.basePrice || formData.basePrice <= 0) {
          newErrors.basePrice = 'Valid price is required';
        }

        if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          setIsLoading(false);
          return;
        }

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        analytics('advanced_product_created', {
          productId: formData.productId,
          category: formData.category,
          priceModel: formData.priceModel,
          hasCustomizations: formData.customizationOptions.length > 0,
          userStory: 'US-3.2',
          hypothesis: 'H8',
        });

        logInfo('Advanced product created successfully', {
          component: 'AdvancedProductModal',
          operation: 'handleSubmit',
          productId: formData.productId,
          userStory: 'US-3.2',
          hypothesis: 'H8',
        });

        onSuccess?.({ ...formData, id: `temp-${Date.now()}` });
        onClose();
      } catch (error) {
        logError('Failed to create advanced product', {
          component: 'AdvancedProductModal',
          operation: 'handleSubmit',
          error,
          userStory: 'US-3.2',
          hypothesis: 'H8',
        });

        setErrors({ submit: 'Failed to create product. Please try again.' });
      } finally {
        setIsLoading(false);
      }
    },
    [formData, analytics, onSuccess, onClose]
  );

  const dialogId = id || 'advanced-product-modal';

  // Accessibility: focus trap and escape to close
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    previouslyFocusedRef.current = (document.activeElement as HTMLElement) || null;
    const container = containerRef.current;
    if (container) {
      // focus the first focusable element within the modal, else the container
      const focusable = container.querySelector<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      (focusable || container).focus();
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Tab' && containerRef.current) {
        const focusables = Array.from(
          containerRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ).filter(el => !el.hasAttribute('disabled'));
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement;
        if (e.shiftKey) {
          if (active === first || !containerRef.current.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // restore focus
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id={`${dialogId}-backdrop`}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      aria-hidden="false"
    >
      <div
        id={dialogId}
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${dialogId}-title`}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden focus:outline-none"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 id={`${dialogId}-title`} className="text-xl font-semibold text-gray-900">
            Create Advanced Product
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b bg-gray-50">
          {[
            { id: 'info', label: 'Product Info', icon: '📝' },
            { id: 'pricing', label: 'Pricing', icon: '💰' },
            { id: 'customization', label: 'Customization', icon: '⚙️' },
            { id: 'resources', label: 'Resources', icon: '📎' },
            { id: 'visibility', label: 'Visibility', icon: '👁️' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabId)}
              className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Product Information Tab */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <Input
                    value={formData.name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="Cloud Security Suite"
                    error={errors.name}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product ID</label>
                  <Input
                    value={formData.productId}
                    readOnly
                    placeholder="Auto-generated"
                    className="bg-gray-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Category</option>
                    <option value="Security">Security</option>
                    <option value="Services">Services</option>
                    <option value="Software">Software</option>
                    <option value="Data">Data</option>
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-xs mt-1">{errors.category}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sub-Category
                  </label>
                  <Input
                    value={formData.subCategory}
                    onChange={e => setFormData(prev => ({ ...prev, subCategory: e.target.value }))}
                    placeholder="Cloud, Professional, etc."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Description
                </label>
                <Input
                  value={formData.shortDescription}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, shortDescription: e.target.value }))
                  }
                  placeholder="Brief product description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Detailed Description
                </label>
                <textarea
                  value={formData.detailedDescription}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, detailedDescription: e.target.value }))
                  }
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Detailed product description with features..."
                />
              </div>
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price Model
                  </label>
                  <select
                    value={formData.priceModel}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, priceModel: e.target.value as 'Fixed Price' | 'Hourly Rate' | 'Subscription' }))
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Fixed Price">Fixed Price</option>
                    <option value="Hourly Rate">Hourly Rate</option>
                    <option value="Subscription">Subscription</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Price *
                  </label>
                  <Input
                    type="number"
                    value={formData.basePrice}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))
                    }
                    placeholder="0.00"
                    error={errors.basePrice}
                  />
                </div>
              </div>

              <Card className="p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Discount Options</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <Checkbox
                      id="volume-discount-checkbox"
                      checked={formData.discountOptions.volumeDiscount}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          discountOptions: {
                            ...prev.discountOptions,
                            volumeDiscount: e.target.checked,
                          },
                        }))
                      }
                    />
                    <span className="text-sm text-gray-700">Volume discount available</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <Checkbox
                      id="annual-commitment-checkbox"
                      checked={formData.discountOptions.annualCommitment}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          discountOptions: {
                            ...prev.discountOptions,
                            annualCommitment: e.target.checked,
                          },
                        }))
                      }
                    />
                    <span className="text-sm text-gray-700">Annual commitment discount</span>
                  </label>

                  <label className="flex items-center gap-2">
                    <Checkbox
                      id="new-client-discount-checkbox"
                      checked={formData.discountOptions.newClientDiscount}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          discountOptions: {
                            ...prev.discountOptions,
                            newClientDiscount: e.target.checked,
                          },
                        }))
                      }
                    />
                    <span className="text-sm text-gray-700">New client discount</span>
                  </label>
                </div>
              </Card>

              {/* Pricing Preview */}
              {pricingPreview && (
                <Card className="p-4 bg-blue-50">
                  <h4 className="font-semibold text-blue-900 mb-2">Pricing Preview</h4>
                  <div className="text-sm text-blue-800">
                    <div>Base Price: ${pricingPreview.basePrice}</div>
                    <div>Total: ${pricingPreview.total}</div>
                    {pricingPreview.discountAmount > 0 && (
                      <div className="text-green-600">
                        Discount: -${pricingPreview.discountAmount}
                      </div>
                    )}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Customization Tab */}
          {activeTab === 'customization' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Customization Options</h3>
                <Button type="button" variant="outline" onClick={addCustomizationOption}>
                  Add Option
                </Button>
              </div>

              {formData.customizationOptions.length === 0 ? (
                <Card className="p-8 text-center">
                  <div className="text-gray-400 text-4xl mb-4">⚙️</div>
                  <h4 className="font-semibold text-gray-900 mb-2">No Customization Options</h4>
                  <p className="text-gray-600 mb-4">
                    Add options to make your product customizable
                  </p>
                  <Button type="button" variant="primary" onClick={addCustomizationOption}>
                    Add First Option
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {formData.customizationOptions.map((option, index) => (
                    <Card key={option.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Input
                          value={option.name}
                          onChange={e => updateCustomizationOption(index, { name: e.target.value })}
                          placeholder="Option name"
                          className="flex-1 mr-4"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeCustomizationOption(index)}
                          className="text-red-600"
                        >
                          Remove
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                          </label>
                          <select
                            value={option.type}
                            onChange={e =>
                              updateCustomizationOption(index, { type: e.target.value as 'single-select' | 'multi-select' | 'text' | 'number' })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                          >
                            <option value="single-select">Single Select</option>
                            <option value="multi-select">Multi Select</option>
                            <option value="text">Text Input</option>
                            <option value="number">Number Input</option>
                          </select>
                        </div>

                        {(option.type === 'single-select' || option.type === 'multi-select') && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Options
                            </label>
                            <div className="space-y-2">
                              {option.options.map((opt, optIndex) => (
                                <div key={optIndex} className="flex gap-2">
                                  <Input
                                    value={opt.name}
                                    onChange={e => {
                                      const newOptions = [...option.options];
                                      newOptions[optIndex] = { ...opt, name: e.target.value };
                                      updateCustomizationOption(index, { options: newOptions });
                                    }}
                                    placeholder="Option name"
                                    className="flex-1"
                                  />
                                  <Input
                                    type="number"
                                    value={opt.modifier}
                                    onChange={e => {
                                      const newOptions = [...option.options];
                                      newOptions[optIndex] = {
                                        ...opt,
                                        modifier: parseFloat(e.target.value) || 0,
                                      };
                                      updateCustomizationOption(index, { options: newOptions });
                                    }}
                                    placeholder="Price modifier"
                                    className="w-24"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              <Card className="p-8 text-center">
                <div className="text-gray-400 text-4xl mb-4">📎</div>
                <h4 className="font-semibold text-gray-900 mb-2">Resource Management</h4>
                <p className="text-gray-600 mb-4">
                  File upload and resource management would be implemented here in the full version
                </p>
                <div className="text-sm text-gray-500">
                  Demo: This would include document uploads, image galleries, and file management
                </div>
              </Card>
            </div>
          )}

          {/* Visibility Tab */}
          {activeTab === 'visibility' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h4 className="font-semibold text-gray-900 mb-4">Product Visibility</h4>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, status: e.target.value as 'Draft' | 'Active' }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Active">Active</option>
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="flex items-center gap-2">
                      <Checkbox
                        id="show-in-catalog-checkbox"
                        checked={formData.showInCatalog}
                        onChange={e =>
                          setFormData(prev => ({ ...prev, showInCatalog: e.target.checked }))
                        }
                      />
                      <span className="text-sm text-gray-700">
                        Show in proposal product catalog
                      </span>
                    </label>

                    <label className="flex items-center gap-2">
                      <Checkbox
                        id="featured-checkbox"
                        checked={formData.featured}
                        onChange={e =>
                          setFormData(prev => ({ ...prev, featured: e.target.checked }))
                        }
                      />
                      <span className="text-sm text-gray-700">Featured product</span>
                    </label>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Error Display */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Creating...</span>
                </>
              ) : (
                `Create ${formData.status === 'Draft' ? 'Draft' : 'Product'}`
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
