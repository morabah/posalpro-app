/**
 * ProductCreationForm Component
 *
 * Component Traceability Matrix:
 * - User Stories: US-1.2, US-3.1, US-3.2
 * - Acceptance Criteria: AC-1.2.1, AC-3.1.1, AC-3.2.1
 * - Methods: createProduct(), validateConfiguration(), trackCreation()
 * - Hypotheses: H1 (Content Discovery), H8 (Technical Validation)
 * - Test Cases: TC-H1-002, TC-H8-001, TC-H8-002
 *
 * This form serves as the foundation for all proposal management,
 * content discovery, and validation systems in PosalPro MVP2.
 */

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Check, Loader2, Settings, Sparkles, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FieldPath } from 'react-hook-form';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Alert } from '@/components/ui/feedback/Alert';
import { Button } from '@/components/ui/forms/Button';
import { cn } from '@/lib/utils';

import { CreateProductData } from '@/types/entities/product';
// import { createProductSchema } from '@/lib/validation/schemas/product';
// import { useProductAnalytics } from '@/hooks/analytics/useProductAnalytics';

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { logError } from '@/lib/logger';

// Form validation schema based on DATA_MODEL.md Product interface
const productCreationSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(200, 'Product name must be less than 200 characters'),

  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),

  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(50, 'SKU must be less than 50 characters')
    .regex(
      /^[A-Z0-9-_]+$/,
      'SKU must contain only uppercase letters, numbers, hyphens, and underscores'
    ),

  price: z.coerce
    .number()
    .min(0, 'Price must be non-negative')
    .max(1000000, 'Price must be less than 1,000,000'),

  currency: z.string().default('USD'),

  category: z.array(z.string()).min(1, 'At least one category is required'),

  tags: z.array(z.string()).optional().default([]),

  attributes: z
    .array(
      z.object({
        key: z.string().min(1, 'Attribute key is required'),
        value: z.string().min(1, 'Attribute value is required'),
        type: z.enum(['text', 'number', 'boolean', 'select']).default('text'),
      })
    )
    .optional()
    .default([]),

  images: z.array(z.string().url('Must be a valid URL')).optional().default([]),

  userStoryMappings: z.array(z.string()).optional().default([]),

  // Product configuration options
  priceModel: z
    .enum(['fixed', 'usage_based', 'subscription', 'tiered', 'custom', 'quote_required'])
    .default('fixed'),

  // Customization options
  customizationOptions: z
    .array(
      z.object({
        name: z.string().min(1, 'Option name is required'),
        type: z.enum(['boolean', 'select', 'multiselect', 'text', 'number']),
        required: z.boolean().default(false),
        values: z.array(z.string()).optional(),
        defaultValue: z.string().optional(),
      })
    )
    .optional()
    .default([]),

  // Resource attachments
  resources: z
    .array(
      z.object({
        name: z.string().min(1, 'Resource name is required'),
        type: z.enum(['document', 'image', 'video', 'link', 'specification']),
        url: z.string().url('Must be a valid URL'),
        description: z.string().optional(),
      })
    )
    .optional()
    .default([]),

  // License dependency mapping
  licenseDependencies: z
    .array(
      z.object({
        name: z.string().min(1, 'License name is required'),
        type: z.enum(['required', 'optional', 'incompatible']),
        version: z.string().optional(),
        description: z.string().optional(),
      })
    )
    .optional()
    .default([]),

  // Visibility and status settings
  isActive: z.boolean().default(true),
  isPublic: z.boolean().default(true),

  // AI-assisted description generation flag
  useAIDescription: z.boolean().default(false),
});

type ProductCreationFormData = z.infer<typeof productCreationSchema>;

interface ProductCreationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateProductData) => Promise<void>;
  initialData?: Partial<ProductCreationFormData>;
}

export function ProductCreationForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: ProductCreationFormProps) {
  // Component analytics for hypothesis validation
  // TODO: Implement analytics when base analytics hook is available
  // const {
  //   trackProductCreation,
  //   trackAIDescriptionUsage,
  //   trackValidationPerformance,
  //   trackCategorizationEfficiency
  // } = useProductAnalytics();

  // Form state management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [aiDescriptionLoading, setAiDescriptionLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const form = useForm<ProductCreationFormData>({
    resolver: zodResolver(productCreationSchema),
    defaultValues: {
      name: '',
      description: '',
      sku: '',
      price: 0,
      currency: 'USD',
      category: [],
      tags: [],
      attributes: [],
      images: [],
      userStoryMappings: [],
      priceModel: 'fixed',
      customizationOptions: [],
      resources: [],
      licenseDependencies: [],
      isActive: true,
      isPublic: true,
      useAIDescription: false,
      ...initialData,
    },
  });

  // Field arrays for dynamic sections
  const {
    fields: attributeFields,
    append: appendAttribute,
    remove: removeAttribute,
  } = useFieldArray({
    control: form.control,
    name: 'attributes',
  });

  const {
    fields: customizationFields,
    append: appendCustomization,
    remove: removeCustomization,
  } = useFieldArray({
    control: form.control,
    name: 'customizationOptions',
  });

  const {
    fields: resourceFields,
    append: appendResource,
    remove: removeResource,
  } = useFieldArray({
    control: form.control,
    name: 'resources',
  });

  const {
    fields: licenseFields,
    append: appendLicense,
    remove: removeLicense,
  } = useFieldArray({
    control: form.control,
    name: 'licenseDependencies',
  });

  // Pre-defined product categories for H1 validation
  const productCategories = [
    'Software',
    'Hardware',
    'Service',
    'License',
    'Support',
    'Consulting',
    'Training',
    'Integration',
    'Maintenance',
    'Cloud',
    'Security',
    'Database',
    'Analytics',
    'AI/ML',
    'Custom',
  ];

  // Currency options
  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY'];

  // User story mappings for Component Traceability Matrix
  const userStoryOptions = [
    'US-1.1',
    'US-1.2',
    'US-1.3',
    'US-2.1',
    'US-2.2',
    'US-2.3',
    'US-3.1',
    'US-3.2',
    'US-3.3',
    'US-4.1',
    'US-4.2',
    'US-4.3',
  ];

  // Form steps for better UX (memoized to avoid re-creating on each render)
  const formSteps = useMemo(
    () => [
      { id: 0, title: 'Basic Information', fields: ['name', 'sku', 'price'] }, // Removed optional 'description'
      { id: 1, title: 'Categorization', fields: ['category'] }, // Removed optional 'tags', 'userStoryMappings'
      { id: 2, title: 'Configuration', fields: ['priceModel'] }, // Removed optional 'attributes', 'customizationOptions'
      { id: 3, title: 'Resources & Dependencies', fields: [] }, // All fields are optional
      { id: 4, title: 'Settings & Review', fields: [] }, // All fields have defaults
    ],
    []
  );

  // AI-assisted description generation (AC-2.1.2 equivalent for products)
  const generateAIDescription = useCallback(async () => {
    const startTime = Date.now();
    setAiDescriptionLoading(true);

    try {
      const productName = form.getValues('name');
      const categories = form.getValues('category');

      if (!productName || categories.length === 0) {
        setValidationErrors([
          'Product name and at least one category are required for AI description generation',
        ]);
        return;
      }

      // Simulate AI description generation (replace with actual AI service)
      await new Promise(resolve => setTimeout(resolve, 2000));

      const aiDescription = `${productName} is a comprehensive ${categories[0].toLowerCase()} solution designed to enhance organizational efficiency and streamline operations. This product integrates seamlessly with existing systems while providing advanced features for modern business requirements.`;

      form.setValue('description', aiDescription);
      form.setValue('useAIDescription', true);

      // TODO: Track AI usage for H3 hypothesis validation when analytics available
      // trackAIDescriptionUsage({
      //   productName,
      //   categories,
      //   generationTime: Date.now() - startTime,
      //   descriptionLength: aiDescription.length,
      //   userStory: 'US-3.1',
      //   hypothesis: 'H8'
      // });
    } catch (error) {
      // ✅ ENHANCED: Use proper logger instead of console.error
      const errorHandlingService = ErrorHandlingService.getInstance();
      const standardError = errorHandlingService.processError(
        error,
        'AI description generation failed',
        ErrorCodes.AI.PROCESSING_FAILED,
        {
          component: 'ProductCreationForm',
          operation: 'generateAIDescription',
          productName: form.getValues('name'),
        }
      );

      logError('AI description generation failed', error, {
        component: 'ProductCreationForm',
        operation: 'generateAIDescription',
        productName: form.getValues('name'),
        standardError: standardError.message,
        errorCode: standardError.code,
      });

      setValidationErrors(['Failed to generate AI description. Please try again.']);
    } finally {
      setAiDescriptionLoading(false);
    }
  }, [form]);

  // Form submission with analytics tracking
  const handleSubmit = useCallback(
    async (data: ProductCreationFormData) => {
      const startTime = Date.now();
      setIsSubmitting(true);
      setValidationErrors([]);
      let productData: CreateProductData;

      try {
        // Convert form data to CreateProductData format
        productData = {
          name: data.name,
          description: data.description,
          sku: data.sku,
          price: data.price,
          currency: data.currency,
          category: data.category,
          tags: data.tags,
          attributes: data.attributes?.reduce(
            (acc, attr) => {
              acc[attr.key] = attr.value as unknown as string;
              return acc;
            },
            {} as Record<string, unknown>
          ),
          images: data.images,
          userStoryMappings: data.userStoryMappings,
        };

        // Submit the product
        await onSubmit(productData);

        // TODO: Track successful creation for hypothesis validation when analytics available
        // trackProductCreation({
        //   productData,
        //   creationTime: Date.now() - startTime,
        //   useAIDescription: data.useAIDescription,
        //   categoriesCount: data.category.length,
        //   attributesCount: data.attributes?.length || 0,
        //   userStory: 'US-3.1',
        //   hypothesis: 'H8',
        //   acceptanceCriteria: 'AC-3.1.1'
        // });

        // TODO: Track categorization efficiency for H1 validation when analytics available
        // trackCategorizationEfficiency({
        //   categoriesSelected: data.category.length,
        //   tagsAdded: data.tags?.length || 0,
        //   aiAssisted: data.useAIDescription,
        //   userStory: 'US-1.2',
        //   hypothesis: 'H1'
        // });

        // Close form on success
        onClose();
      } catch (error) {
        // ✅ ENHANCED: Use proper logger instead of console.error
        const errorHandlingService = ErrorHandlingService.getInstance();
        const standardError = errorHandlingService.processError(
          error,
          'Product creation failed',
          ErrorCodes.DATA.CREATE_FAILED,
          {
            component: 'ProductCreationForm',
            operation: 'createProduct',
            productData: JSON.stringify(data),
          }
        );

        logError('Product creation failed', error, {
          component: 'ProductCreationForm',
          operation: 'createProduct',
          productData: JSON.stringify(data),
          standardError: standardError.message,
          errorCode: standardError.code,
        });

        setValidationErrors([
          error instanceof Error ? error.message : 'Failed to create product. Please try again.',
        ]);
      } finally {
        setIsSubmitting(false);
      }
    },
    [onSubmit, onClose]
  );

  // Category toggle handler for multi-select
  const toggleCategory = useCallback(
    (category: string) => {
      const currentCategories = form.getValues('category');
      const newCategories = currentCategories.includes(category)
        ? currentCategories.filter(c => c !== category)
        : [...currentCategories, category];

      form.setValue('category', newCategories);
      form.trigger('category');
    },
    [form]
  );

  // Tag management
  const [tagInput, setTagInput] = useState('');

  const addTag = useCallback(
    (tag: string) => {
      if (tag.trim()) {
        const currentTags = form.getValues('tags') || [];
        if (!currentTags.includes(tag.trim())) {
          form.setValue('tags', [...currentTags, tag.trim()]);
        }
        setTagInput('');
      }
    },
    [form]
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      const currentTags = form.getValues('tags') || [];
      form.setValue(
        'tags',
        currentTags.filter(tag => tag !== tagToRemove)
      );
    },
    [form]
  );

  // Step navigation
  const canProceedToNextStep = useCallback(() => {
    const values = form.getValues();
    const errors = form.formState.errors;

    switch (currentStep) {
      case 0: {
        const hasBasicData =
          values.name && values.sku && values.price !== undefined && values.price >= 0;
        const hasBasicErrors = errors.name || errors.sku || errors.price;
        return hasBasicData && !hasBasicErrors;
      }
      case 1: {
        const hasCategory = values.category && values.category.length > 0;
        const hasCategoryErrors = errors.category;
        return hasCategory && !hasCategoryErrors;
      }
      case 2: {
        const hasPriceModel = values.priceModel;
        const hasPriceModelErrors = errors.priceModel;
        return hasPriceModel && !hasPriceModelErrors;
      }
      case 3: {
        return true; // This step is optional
      }
      case 4: {
        return true; // Final review step
      }
      default: {
        return false;
      }
    }
  }, [currentStep, form]);

  const nextStep = useCallback(async () => {
    // Get current step fields that need validation
    const currentStepFields = formSteps[currentStep].fields;

    console.log('NextStep called - Current step:', currentStep);
    console.log('Fields to validate:', currentStepFields);

    // If no fields to validate, proceed immediately
    if (currentStepFields.length === 0) {
      console.log('No fields to validate, proceeding...');
      if (currentStep < formSteps.length - 1) {
        setCurrentStep(prev => prev + 1);
        setValidationErrors([]);
      }
      return;
    }

    // Trigger validation for current step fields
    const validationPromises = currentStepFields.map(field =>
      form.trigger(field as keyof ProductCreationFormData)
    );

    const validationResults = await Promise.all(validationPromises);
    const isFormValid = validationResults.every(result => result);

    console.log('Validation results:', validationResults);
    console.log('Is form valid:', isFormValid);
    console.log('Can proceed:', canProceedToNextStep());

    // Check both validation results and current step validation
    if (isFormValid && canProceedToNextStep()) {
      console.log('Advancing to next step...');
      if (currentStep < formSteps.length - 1) {
        setCurrentStep(prev => prev + 1);
        setValidationErrors([]);
      }
    } else {
      console.log('Validation failed, showing errors...');
      setValidationErrors(['Please complete all required fields before proceeding.']);
    }
  }, [currentStep, canProceedToNextStep, form, formSteps]);

  const prevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
      setValidationErrors([]);
    }
  }, [currentStep]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      form.reset();
      setCurrentStep(0);
      setValidationErrors([]);
    }
  }, [isOpen, form]);

  // Watch form values and errors to update button state
  const watchedValues = form.watch();
  const formErrors = form.formState.errors;

  // Force re-render when form values or errors change
  useEffect(() => {
    // This effect will trigger re-renders when form state changes
  }, [watchedValues, formErrors, form.formState.isValid]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Create New Product</h2>
              <p className="text-sm text-gray-500">
                This would contain the full product creation form with:
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between">
            {formSteps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  'flex items-center gap-2',
                  index <= currentStep ? 'text-blue-600' : 'text-gray-400'
                )}
              >
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                    index < currentStep
                      ? 'bg-blue-600 text-white'
                      : index === currentStep
                        ? 'bg-blue-100 text-blue-600 border-2 border-blue-600'
                        : 'bg-gray-200 text-gray-500'
                  )}
                >
                  {index < currentStep ? <Check className="h-4 w-4" /> : index + 1}
                </div>
                <span className="text-sm font-medium hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={form.handleSubmit(handleSubmit)} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Error Display */}
            {validationErrors.length > 0 && (
              <Alert variant="error" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <div className="text-red-700">
                  {validationErrors.map((error, index) => (
                    <div key={index}>{error}</div>
                  ))}
                </div>
              </Alert>
            )}

            {/* Step 0: Basic Information */}
            {currentStep === 0 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Product Name */}
                  <div className="md:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      id="name"
                      type="text"
                      {...form.register('name')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter product name"
                    />
                    {form.formState.errors.name && (
                      <p className="mt-1 text-sm text-red-600">
                        {form.formState.errors.name.message}
                      </p>
                    )}
                  </div>

                  {/* SKU */}
                  <div>
                    <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-2">
                      SKU *
                    </label>
                    <input
                      id="sku"
                      type="text"
                      {...form.register('sku')}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        form.formState.errors.sku ? 'border-red-300 bg-red-50' : 'border-gray-300'
                      }`}
                      placeholder="PROD-001"
                    />
                    {form.formState.errors.sku && (
                      <p className="mt-1 text-sm text-red-600">
                        {form.formState.errors.sku.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      Only uppercase letters, numbers, hyphens (-), and underscores (_) allowed
                    </p>
                  </div>

                  {/* Price */}
                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                      Price *
                    </label>
                    <div className="relative">
                      <input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        {...form.register('price')}
                        className="w-full px-3 py-2 pr-16 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="0.00"
                      />
                      <select
                        {...form.register('currency')}
                        className="absolute right-0 top-0 h-full px-2 bg-gray-50 border-l border-gray-300 rounded-r-md text-sm"
                      >
                        {currencies.map(currency => (
                          <option key={currency} value={currency}>
                            {currency}
                          </option>
                        ))}
                      </select>
                    </div>
                    {form.formState.errors.price && (
                      <p className="mt-1 text-sm text-red-600">
                        {form.formState.errors.price.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Description
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={generateAIDescription}
                      disabled={aiDescriptionLoading}
                      className="flex items-center gap-2"
                    >
                      {aiDescriptionLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {aiDescriptionLoading ? 'Generating...' : 'AI Generate'}
                    </Button>
                  </div>
                  <textarea
                    id="description"
                    rows={4}
                    {...form.register('description')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter product description or use AI generation"
                  />
                  {form.formState.errors.description && (
                    <p className="mt-1 text-sm text-red-600">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Step 1: Categorization */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Categories */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Product Categories * (Select at least one)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {productCategories.map(category => {
                      const isSelected = form.watch('category')?.includes(category);
                      return (
                        <button
                          key={category}
                          type="button"
                          onClick={() => toggleCategory(category)}
                          className={cn(
                            'px-3 py-2 text-sm rounded-md border transition-colors',
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          )}
                        >
                          {category}
                        </button>
                      );
                    })}
                  </div>
                  {form.formState.errors.category && (
                    <p className="mt-2 text-sm text-red-600">
                      {form.formState.errors.category.message}
                    </p>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {form.watch('tags')?.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag(tagInput);
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Add a tag and press Enter"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => addTag(tagInput)}
                      disabled={!tagInput.trim()}
                    >
                      Add Tag
                    </Button>
                  </div>
                </div>

                {/* User Story Mappings */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    User Story Mappings
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {userStoryOptions.map(story => {
                      const isSelected = form.watch('userStoryMappings')?.includes(story);
                      return (
                        <button
                          key={story}
                          type="button"
                          onClick={() => {
                            const current = form.getValues('userStoryMappings') || [];
                            const newMappings = isSelected
                              ? current.filter(s => s !== story)
                              : [...current, story];
                            form.setValue('userStoryMappings', newMappings);
                          }}
                          className={cn(
                            'px-3 py-2 text-sm rounded-md border transition-colors',
                            isSelected
                              ? 'bg-green-600 text-white border-green-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          )}
                        >
                          {story}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Configuration */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Price Model */}
                <div>
                  <label
                    htmlFor="priceModel"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Pricing Model
                  </label>
                  <select
                    id="priceModel"
                    {...form.register('priceModel')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="fixed">Fixed Price</option>
                    <option value="usage_based">Usage Based</option>
                    <option value="subscription">Subscription</option>
                    <option value="tiered">Tiered Pricing</option>
                    <option value="custom">Custom</option>
                    <option value="quote_required">Quote Required</option>
                  </select>
                </div>

                {/* Product Attributes */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Product Attributes
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendAttribute({ key: '', value: '', type: 'text' })}
                    >
                      Add Attribute
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {attributeFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-3">
                          <input
                            {...form.register(`attributes.${index}.key`)}
                            placeholder="Attribute name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="col-span-4">
                          <input
                            {...form.register(`attributes.${index}.value`)}
                            placeholder="Attribute value"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="col-span-3">
                          <select
                            {...form.register(`attributes.${index}.type`)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                            <option value="boolean">Boolean</option>
                            <option value="select">Select</option>
                          </select>
                        </div>
                        <div className="col-span-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeAttribute(index)}
                            className="w-full"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {attributeFields.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No attributes added yet. Click "Add Attribute" to get started.
                      </p>
                    )}
                  </div>
                </div>

                {/* Customization Options */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Customization Options
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        appendCustomization({ name: '', type: 'boolean', required: false })
                      }
                    >
                      Add Option
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {customizationFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-4">
                          <input
                            {...form.register(`customizationOptions.${index}.name`)}
                            placeholder="Option name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="col-span-3">
                          <select
                            {...form.register(`customizationOptions.${index}.type`)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="boolean">Boolean</option>
                            <option value="select">Select</option>
                            <option value="multiselect">Multi-select</option>
                            <option value="text">Text</option>
                            <option value="number">Number</option>
                          </select>
                        </div>
                        <div className="col-span-3 flex items-center">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              {...form.register(`customizationOptions.${index}.required`)}
                              className="mr-2"
                            />
                            Required
                          </label>
                        </div>
                        <div className="col-span-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeCustomization(index)}
                            className="w-full"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {customizationFields.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No customization options added yet. Click "Add Option" to get started.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Resources & Dependencies */}
            {currentStep === 3 && (
              <div className="space-y-6">
                {/* Resources */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Resources & Documentation
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendResource({ name: '', type: 'document', url: '' })}
                    >
                      Add Resource
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {resourceFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-3">
                          <input
                            {...form.register(`resources.${index}.name`)}
                            placeholder="Resource name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <select
                            {...form.register(`resources.${index}.type`)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="document">Document</option>
                            <option value="image">Image</option>
                            <option value="video">Video</option>
                            <option value="link">Link</option>
                            <option value="specification">Specification</option>
                          </select>
                        </div>
                        <div className="col-span-5">
                          <input
                            {...form.register(`resources.${index}.url`)}
                            placeholder="Resource URL"
                            type="url"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeResource(index)}
                            className="w-full"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {resourceFields.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No resources added yet. Click "Add Resource" to get started.
                      </p>
                    )}
                  </div>
                </div>

                {/* License Dependencies */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      License Dependencies
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => appendLicense({ name: '', type: 'required' })}
                    >
                      Add License
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {licenseFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-12 gap-3 items-end">
                        <div className="col-span-4">
                          <input
                            {...form.register(`licenseDependencies.${index}.name`)}
                            placeholder="License name"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="col-span-3">
                          <select
                            {...form.register(`licenseDependencies.${index}.type`)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="required">Required</option>
                            <option value="optional">Optional</option>
                            <option value="incompatible">Incompatible</option>
                          </select>
                        </div>
                        <div className="col-span-3">
                          <input
                            {...form.register(`licenseDependencies.${index}.version`)}
                            placeholder="Version"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeLicense(index)}
                            className="w-full"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {licenseFields.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">
                        No license dependencies added yet. Click "Add License" to get started.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Settings & Review */}
            {currentStep === 4 && (
              <div className="space-y-6">
                {/* Visibility Settings */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Visibility & Status Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                          Active Status
                        </label>
                        <p className="text-sm text-gray-500">
                          Enable this product for use in proposals
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          {...form.register('isActive')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <label htmlFor="isPublic" className="text-sm font-medium text-gray-700">
                          Public Visibility
                        </label>
                        <p className="text-sm text-gray-500">
                          Make this product visible to all team members
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          {...form.register('isPublic')}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Product Summary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Product Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Name:</span>{' '}
                      {form.watch('name') || 'Not specified'}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">SKU:</span>{' '}
                      {form.watch('sku') || 'Not specified'}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Price:</span>{' '}
                      {form.watch('currency')} {form.watch('price') || '0.00'}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Price Model:</span>{' '}
                      {form.watch('priceModel')?.replace('_', ' ') || 'Fixed'}
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Categories:</span>{' '}
                      {form.watch('category')?.length || 0} selected
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Tags:</span>{' '}
                      {form.watch('tags')?.length || 0} added
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Attributes:</span>{' '}
                      {form.watch('attributes')?.length || 0} defined
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Resources:</span>{' '}
                      {form.watch('resources')?.length || 0} attached
                    </div>
                  </div>
                  {form.watch('description') && (
                    <div className="mt-4">
                      <span className="font-medium text-gray-700 block mb-1">Description:</span>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {form.watch('description')}
                      </p>
                    </div>
                  )}
                </div>

                {/* AI Description Usage */}
                {form.watch('useAIDescription') && (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-600" />
                      <span className="text-sm font-medium text-yellow-800">
                        AI-Generated Description Used
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      This product uses an AI-generated description that will be tracked for H8
                      hypothesis validation.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t">
            <div className="flex items-center gap-4">
              <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              {currentStep > 0 && (
                <Button type="button" variant="outline" onClick={prevStep} disabled={isSubmitting}>
                  Previous
                </Button>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="text-gray-600 border-gray-300"
              >
                Save Draft
              </Button>

              {currentStep < formSteps.length - 1 ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      console.log('Debug - Form Values:', form.getValues());
                      console.log('Debug - Form Errors:', form.formState.errors);
                      console.log('Debug - Can Proceed:', canProceedToNextStep());
                      console.log('Debug - Current Step:', currentStep);
                      console.log('Debug - Form Steps Length:', formSteps.length);
                      console.log('Debug - Is Submitting:', isSubmitting);
                      console.log(
                        'Debug - Button Disabled:',
                        !canProceedToNextStep() || isSubmitting
                      );

                      // Force trigger validation
                      const currentStepFields = formSteps[currentStep].fields as Array<
                        FieldPath<ProductCreationFormData>
                      >;
                      console.log('Debug - Fields to validate:', currentStepFields);

                      currentStepFields.forEach(field => {
                        void form.trigger(field);
                        const { error } = form.getFieldState(field);
                        const hasError = Boolean(error);
                        console.log(`Debug - Field ${field} has error:`, hasError);
                      });
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Debug
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      console.log('Next Step button clicked!');
                      console.log(
                        'Button disabled state:',
                        !canProceedToNextStep() || isSubmitting
                      );
                      nextStep();
                    }}
                    disabled={
                      !canProceedToNextStep() || isSubmitting || form.formState.isValidating
                    }
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {form.formState.isValidating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      'Next Step'
                    )}
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      console.log('Force Next Step clicked!');
                      setCurrentStep(prev => prev + 1);
                    }}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    Force Next
                  </Button>
                </div>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Save and Activate'
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
