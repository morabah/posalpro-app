'use client';

/**
 * PosalPro MVP2 - Modern Product Selection Step
 * Built from scratch using React Query and modern patterns
 * Follows PROPOSAL_MIGRATION_ASSESSMENT.md guidelines
 */

import { useToast } from '@/components/feedback/Toast/ToastProvider';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/forms/Input';
import { Tooltip } from '@/components/ui/Tooltip';
import type { Product } from '@/features/products';
import { useUnifiedProductSelectionData } from '@/features/products/hooks';
import {
  useCreateSectionMutation,
  useDeleteSectionMutation,
  useProposalSections,
} from '@/features/proposal-sections/hooks';
import { CreateBomSectionSchema } from '@/features/proposal-sections/schemas';
import { useSectionAssignmentStore } from '@/features/proposal-sections/store';
import { useUpdateProposal, type WizardProposalUpdateData } from '@/features/proposals';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { http } from '@/lib/http';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { useProposalSetStepData, type ProposalProductData } from '@/lib/store/proposalStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, ChevronRight, GripVertical, Plus, Trash2 } from 'lucide-react';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

interface ProductSelectionStepProps {
  data?: ProposalProductData;
  onNext: () => void;
  onBack: () => void;
  onUpdate?: (data: ProposalProductData) => void;
  proposalId?: string; // ✅ ADDED: For unique localStorage keys per proposal
}

// ✅ REACT HOOK FORM SCHEMA FOR FILTER CONTROLS
const filterSchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.string().optional(),
  showSelectedOnly: z.boolean().optional(),
});

type FilterFormData = z.infer<typeof filterSchema>;

export const ProductSelectionStep = React.memo(function ProductSelectionStep({
  data,
  onNext,
  onBack,
  // onUpdate,
  proposalId,
}: ProductSelectionStepProps) {
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const setStepData = useProposalSetStepData();
  const updateProposalMutation = useUpdateProposal();
  const { data: sectionsData, refetch: refetchSections } = useProposalSections(proposalId);
  const createSection = useCreateSectionMutation(proposalId || '');
  const deleteSection = useDeleteSectionMutation(proposalId || '');
  const { setAssignment, pendingAssignments, setSectionsPending } =
    useSectionAssignmentStore();
  const sectionsPending = useSectionAssignmentStore(s => s.sectionsDirty);
  const toast = useToast();
  const sectionsCount = (sectionsData || []).length;
  const [sectionsLastUpdated, setSectionsLastUpdated] = useState<string | null>(null);

  // Local UI state for creating section
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [newSectionDesc, setNewSectionDesc] = useState('');
  const creatingRef = useRef(false);

  // State for collapsible sections
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // State for drag and drop
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);

  // Toggle section collapse state
  const toggleSectionCollapse = useCallback((sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  }, []);

  // Drag and drop handlers
  const handleDragStart = useCallback((e: React.DragEvent, sectionId: string) => {
    setDraggedSectionId(sectionId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', sectionId);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, sectionId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverSectionId(sectionId);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if we're leaving the entire section, not just moving between child elements
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverSectionId(null);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, targetSectionId: string) => {
      e.preventDefault();
      const draggedSectionId = e.dataTransfer.getData('text/plain');

      if (!draggedSectionId || draggedSectionId === targetSectionId) {
        setDraggedSectionId(null);
        setDragOverSectionId(null);
        return;
      }

      try {
        // Get current sections data
        const currentSections = sectionsData || [];

        // Handle unassigned section - it's not a real section, so we can't reorder it
        if (draggedSectionId === 'unassigned' || targetSectionId === 'unassigned') {
          toast.info('Unassigned products section cannot be reordered');
          setDraggedSectionId(null);
          setDragOverSectionId(null);
          return;
        }

        const draggedSection = currentSections.find(s => s.id === draggedSectionId);
        const targetSection = currentSections.find(s => s.id === targetSectionId);

        if (!draggedSection || !targetSection) return;

        // Calculate new order
        const sortedSections = currentSections.slice().sort((a, b) => a.order - b.order);
        const draggedIndex = sortedSections.findIndex(s => s.id === draggedSectionId);
        const targetIndex = sortedSections.findIndex(s => s.id === targetSectionId);

        if (draggedIndex === -1 || targetIndex === -1) return;

        // Remove dragged section and insert at new position
        const newSections = [...sortedSections];
        const [draggedItem] = newSections.splice(draggedIndex, 1);
        newSections.splice(targetIndex, 0, draggedItem);

        // Update order values
        const updatedSections = newSections.map((section, index) => ({
          ...section,
          order: index + 1,
        }));

        // Update sections via individual PATCH requests to /api/proposals/[id]/sections/[sectionId]
        for (const section of updatedSections) {
          await http.patch(`/api/proposals/${proposalId}/sections/${section.id}`, {
            order: section.order,
          });
        }

        // Refresh sections data
        await refetchSections();

        logInfo('Section reordered successfully', {
          component: 'ProductSelectionStep',
          operation: 'reorder_section',
          draggedSectionId,
          targetSectionId,
          newOrder: updatedSections.map(s => ({ id: s.id, order: s.order })),
          userStory: 'US-4.1',
          hypothesis: 'H6',
        });
      } catch (error) {
        logError('Failed to reorder section', {
          component: 'ProductSelectionStep',
          operation: 'reorder_section',
          error: error instanceof Error ? error.message : 'Unknown error',
          draggedSectionId,
          targetSectionId,
          userStory: 'US-4.1',
          hypothesis: 'H6',
        });

        toast.error('Failed to reorder section. Please try again.');
      } finally {
        setDraggedSectionId(null);
        setDragOverSectionId(null);
      }
    },
    [sectionsData, proposalId, refetchSections, toast]
  );

  // ✅ FIX: Removed client-side duplicate validation - API handles it gracefully
  // The API returns status 200 for existing sections (idempotent behavior)

  // Local state for form data
  const [selectedProducts, setSelectedProducts] = useState<ProposalProductData['products']>(() => {
    const initialProducts = data?.products || [];

    // Reduced logging - only in development
    if (process.env.NODE_ENV === 'development') {
      logDebug('ProductSelectionStep: Initialized', {
        component: 'ProductSelectionStep',
        operation: 'initialization',
        hasData: !!data,
        initialProductsCount: initialProducts.length,
        proposalId,
        productsData: initialProducts.map(p => ({
          id: p.id,
          productId: p.productId,
          name: p.name,
          quantity: p.quantity,
        })),
      });
    }

    return initialProducts;
  });

  // UI state: search and sorting (persisted in localStorage)
  // ✅ FIXED: Make storage key unique per proposal to prevent caching issues
  const STORAGE_KEY = useMemo(
    () => (proposalId ? `wizard:step4:products:${proposalId}` : 'wizard:step4:products'),
    [proposalId]
  );
  // ✅ REACT HOOK FORM SETUP FOR FILTER CONTROLS
  const { register, control, watch, setValue } = useForm<FilterFormData>({
    resolver: zodResolver(filterSchema),
    defaultValues: {
      search: '',
      category: '',
      sortBy: 'name',
      sortOrder: 'asc',
      showSelectedOnly: false,
    },
  });

  // Watch form values for easier access
  const search = watch('search') || '';
  const category = watch('category') || '';
  const sortBy = (watch('sortBy') as 'createdAt' | 'name' | 'price' | 'isActive') || 'name';
  const sortOrder = (watch('sortOrder') as 'asc' | 'desc') || 'asc';
  const showSelectedOnly = watch('showSelectedOnly') || false;

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as FilterFormData;
        if (saved.search !== undefined) setValue('search', saved.search);
        if (saved.sortBy) setValue('sortBy', saved.sortBy);
        if (saved.sortOrder) setValue('sortOrder', saved.sortOrder);
        if (saved.category !== undefined) setValue('category', saved.category);
        if (saved.showSelectedOnly !== undefined)
          setValue('showSelectedOnly', saved.showSelectedOnly);
      }
    } catch {
      // Ignore localStorage read failures - will use default values
    }
  }, [STORAGE_KEY, setValue]); // ✅ FIXED: Include STORAGE_KEY in dependency to re-load when proposal changes

  // ✅ FIXED: Reset UI state when proposal changes to prevent stale data
  useEffect(() => {
    if (proposalId) {
      if (process.env.NODE_ENV === 'development') {
        logDebug('ProductSelectionStep: UI state reset', {
          component: 'ProductSelectionStep',
          operation: 'reset_ui_state',
          proposalId,
        });
      }

      // Clear previous state when switching proposals
      setValue('search', '');
      setValue('sortBy', 'name');
      setValue('sortOrder', 'asc');
      setValue('category', '');
      setValue('showSelectedOnly', false);
    }
  }, [proposalId, setValue]);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ search, sortBy, sortOrder, category, showSelectedOnly })
      );
    } catch {
      // Ignore localStorage write failures - non-critical
    }
  }, [STORAGE_KEY, search, sortBy, sortOrder, category, showSelectedOnly]);

  // Debounced search for API fetch
  // const [debouncedSearch, setDebouncedSearch] = useState(search);
  // const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // useEffect(() => {
  //   if (debounceTimer.current) clearTimeout(debounceTimer.current);
  //   debounceTimer.current = setTimeout(() => setDebouncedSearch(search), 400);
  //   return () => {
  //     if (debounceTimer.current) clearTimeout(debounceTimer.current);
  //   };
  // }, [search]);

  // 🚀 OPTIMIZATION: Use unified hook for parallel loading
  const { products, categories } = useUnifiedProductSelectionData();

  // Extract products data with proper typing
  const {
    data: productsData,
    isLoading: productsLoading,
    error: productsError,
    // fetchNextPage,
    // hasNextPage,
    // isFetchingNextPage,
  } = products;

  // Extract categories data
  const { data: categoryData, isLoading: categoriesLoading } = categories;

  // Flatten the paginated data for compatibility - memoized for performance
  const flattenedProductsData: Product[] = useMemo(
    () => productsData?.pages?.flatMap((page: any) => page.items) || [],
    [productsData?.pages]
  );

  // Quick lookup sets
  const selectedSet = useMemo(
    () => new Set(selectedProducts.map(p => p.productId)),
    [selectedProducts]
  );
  const selectedCategories = useMemo(
    () => new Set((selectedProducts || []).map(p => p.category)),
    [selectedProducts]
  );

  // Displayed list supports "selected only"
  const productsMap = useMemo(
    () => new Map((flattenedProductsData || []).map(p => [p.id, p] as const)),
    [flattenedProductsData]
  );
  const displayedItems: Product[] = useMemo(() => {
    if (!showSelectedOnly) {
      const items = flattenedProductsData || [];
      if (!items.length) return items;
      const pinned = items.filter(p => selectedSet.has(p.id));
      const rest = items.filter(p => !selectedSet.has(p.id));
      return [...pinned, ...rest];
    }
    return (selectedProducts || []).map(
      sp =>
        (productsMap.get(sp.productId) as Product) ||
        ({
          id: sp.productId,
          name: sp.name,
          description: '',
          price: sp.unitPrice,
          currency: 'USD',
          sku: '',
          category: [sp.category || 'General'],
          tags: [],
          attributes: {},
          images: [],
          isActive: true,
          version: 1,
          usageAnalytics: {},
          userStoryMappings: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as Product)
    );
  }, [showSelectedOnly, selectedProducts, productsMap, flattenedProductsData, selectedSet]);

  // Compute current assignment per selected product (consider pending changes)
  const currentAssignmentByRow = useMemo(() => {
    const map: Record<string, string | null> = {};
    for (const sp of selectedProducts) {
      const pending = pendingAssignments[sp.id];
      if (pending !== undefined) map[sp.id] = pending;
      else map[sp.id] = sp.sectionId ?? null;
    }
    return map;
  }, [selectedProducts, pendingAssignments]);

  // Compute counts per section
  const sectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sp of selectedProducts) {
      const sid = currentAssignmentByRow[sp.id];
      if (!sid) continue;
      counts[sid] = (counts[sid] || 0) + 1;
    }
    return counts;
  }, [selectedProducts, currentAssignmentByRow]);

  // Group products by sections with totals
  const groupedProductsBySection = useMemo(() => {
    const grouped: Record<string, { section: any; products: any[]; total: number }> = {};
    const unassignedProducts: any[] = [];

    // Initialize sections
    (sectionsData || []).forEach(section => {
      grouped[section.id] = {
        section,
        products: [],
        total: 0,
      };
    });

    // Group products by section
    selectedProducts.forEach(product => {
      const sectionId = currentAssignmentByRow[product.id];
      if (sectionId && grouped[sectionId]) {
        grouped[sectionId].products.push(product);
        grouped[sectionId].total += product.total || 0;
      } else {
        unassignedProducts.push(product);
      }
    });

    return { grouped, unassignedProducts };
  }, [selectedProducts, currentAssignmentByRow, sectionsData]);

  // Handle section deletion
  const handleDeleteSection = useCallback(
    async (sectionId: string, sectionTitle: string) => {
      if (!proposalId) return;

      try {
        // Check if section has products assigned
        const sectionProducts = groupedProductsBySection.grouped[sectionId]?.products || [];
        if (sectionProducts.length > 0) {
          toast.error(
            `Cannot delete section "${sectionTitle}" because it has ${sectionProducts.length} assigned product(s). Please reassign or remove products first.`
          );
          return;
        }

        await deleteSection.mutateAsync(sectionId);

        analytics('section_deleted', {
          sectionId,
          sectionTitle,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        });
      } catch (error) {
        logError('ProductSelectionStep: Failed to delete section', {
          component: 'ProductSelectionStep',
          operation: 'handleDeleteSection',
          sectionId,
          sectionTitle,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },
    [proposalId, deleteSection, toast, analytics, groupedProductsBySection]
  );

  // Handle product addition
  const handleAddProduct = useCallback(
    (productId: string) => {
      if (!flattenedProductsData || productsError) return;

      const product = flattenedProductsData.find(p => p.id === productId);
      if (product && !selectedProducts.find(p => p.productId === productId)) {
        const newProduct: ProposalProductData['products'][0] = {
          id: `temp-${Date.now()}`, // Temporary ID for UI
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: product.price || 0,
          total: product.price || 0,
          discount: 0,
          category: product.category[0] || 'General',
          configuration: {},
        };

        setSelectedProducts(prev => {
          // Deduplicate by productId to avoid double-add in strict mode or double events
          if (prev.some(p => p.productId === product.id)) {
            return prev;
          }
          const next = [...prev, newProduct];

          // Reduced logging for product addition
          if (process.env.NODE_ENV === 'development') {
            logDebug('ProductSelectionStep: Product added', {
              component: 'ProductSelectionStep',
              operation: 'handleAddProduct',
              productId: product.id,
              productName: product.name,
              updatedProductsCount: next.length,
            });
          }

          return next;
        });

        analytics(
          'product_added_to_proposal',
          {
            productId: product.id,
            productName: product.name,
            userStory: 'US-3.1',
            hypothesis: 'H4',
          },
          'medium'
        );
      }
    },
    [flattenedProductsData, selectedProducts, analytics, productsError]
  );

  // Handle quantity change
  const handleQuantityChange = useCallback((productId: string, quantity: number) => {
    const q = Math.max(1, Number.isFinite(quantity) ? quantity : 1);
    setSelectedProducts(prev =>
      prev.map(product =>
        product.productId === productId
          ? { ...product, quantity: q, total: product.unitPrice * q }
          : product
      )
    );
  }, []);

  // Handle product removal
  const handleRemoveProduct = useCallback(
    (productId: string) => {
      setSelectedProducts(prev => prev.filter(p => p.productId !== productId));

      analytics(
        'product_removed_from_proposal',
        {
          productId,
          userStory: 'US-3.1',
          hypothesis: 'H4',
        },
        'medium'
      );
    },
    [analytics]
  );

  // Calculate total
  const totalAmount = useMemo(() => {
    if (!selectedProducts || selectedProducts.length === 0) return 0;
    return selectedProducts.reduce((sum, product) => sum + (product.total || 0), 0);
  }, [selectedProducts]);

  // Track last saved state to prevent unnecessary saves
  const lastSavedDataRef = useRef<string>('');
  const pendingSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Create products with section assignments
  const productsWithSections = useMemo(() => {
    return selectedProducts.map(product => ({
      ...product,
      sectionId: currentAssignmentByRow[product.id] || null,
    }));
  }, [selectedProducts, currentAssignmentByRow]);

  // Persist current step data into the store and auto-save to database with proper debouncing
  useEffect(() => {
    const freshTotal = selectedProducts.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0);

    const stepData: ProposalProductData = {
      products: productsWithSections,
      totalValue: freshTotal,
    };

    // Update store immediately (local state)
    setStepData(4, stepData);

    // Only auto-save if we have a proposalId and actual changes
    if (proposalId && selectedProducts.length > 0) {
      const currentDataString = JSON.stringify({
        products: selectedProducts.map(p => ({
          productId: p.productId,
          quantity: p.quantity,
          unitPrice: p.unitPrice,
          total: p.total,
          discount: p.discount || 0,
        })),
        totalValue: freshTotal,
      });

      // Skip if no actual changes
      if (currentDataString === lastSavedDataRef.current) {
        return;
      }

      // Clear any pending save
      if (pendingSaveTimeoutRef.current) {
        clearTimeout(pendingSaveTimeoutRef.current);
      }

      const autoSaveData = {
        value: freshTotal,
        metadata: {
          productData: {
            products: selectedProducts.map(p => ({
              productId: p.productId,
              quantity: p.quantity,
              unitPrice: p.unitPrice,
              total: p.total,
              discount: p.discount || 0,
              category: p.category,
              configuration: p.configuration || {},
            })),
            totalValue: freshTotal,
          },
        },
      };

      // Reduced logging - only log in development and at info level
      if (process.env.NODE_ENV === 'development') {
        logDebug('ProductSelectionStep: Auto-save queued', {
          component: 'ProductSelectionStep',
          operation: 'autoSave_queued',
          proposalId,
          productsCount: selectedProducts.length,
          totalValue: freshTotal,
        });
      }

      // Increased debounce to 2 seconds to reduce server load
      pendingSaveTimeoutRef.current = setTimeout(() => {
        updateProposalMutation.mutate(
          { id: proposalId, proposal: autoSaveData as WizardProposalUpdateData },
          {
            onSuccess: () => {
              // Update last saved state only on success
              lastSavedDataRef.current = currentDataString;
              if (process.env.NODE_ENV === 'development') {
                logInfo('ProductSelectionStep: Auto-save successful', {
                  component: 'ProductSelectionStep',
                  operation: 'autoSave_success',
                  proposalId,
                  totalValue: freshTotal,
                });
              }
            },
            onError: error => {
              logError('ProductSelectionStep: Auto-save failed', {
                component: 'ProductSelectionStep',
                operation: 'autoSave_error',
                proposalId,
                error: error instanceof Error ? error.message : 'Unknown error',
              });
            },
          }
        );
        pendingSaveTimeoutRef.current = null;
      }, 2000); // Increased to 2 seconds

      return () => {
        if (pendingSaveTimeoutRef.current) {
          clearTimeout(pendingSaveTimeoutRef.current);
          pendingSaveTimeoutRef.current = null;
        }
      };
    }
  }, [productsWithSections, setStepData, proposalId, updateProposalMutation, selectedProducts]);

  // Handler: create new section
  const handleCreateSection = useCallback(async () => {
    if (!proposalId) return; // cannot create without proposal context
    try {
      if (creatingRef.current || createSection.isPending || sectionsPending) return;
      creatingRef.current = true;
      setSectionsPending(true);
      const input = { title: newSectionTitle, description: newSectionDesc };
      CreateBomSectionSchema.parse(input);

      // Remove client-side duplicate check - let API handle it gracefully
      // The API returns status 200 for duplicates (idempotent operation)

      await createSection.mutateAsync(input as any);

      // Force refresh and show success toast
      let newCount = (sectionsData || []).length;
      try {
        const refreshed = await refetchSections();
        newCount = ((refreshed.data as any) || sectionsData || []).length;
      } catch (error) {
        console.warn('Error refreshing sections count:', error);
      }

      // Show success message regardless of whether it was created or already existed
      toast.success(`Section '${input.title}' ready (${newCount} total)`);
      setSectionsLastUpdated('just now');
      setNewSectionTitle('');
      setNewSectionDesc('');
      setIsAddingSection(false);
    } catch (error) {
      // Only show error for actual failures, not duplicates
      const errorMessage = error instanceof Error ? error.message : 'Failed to create section';
      if (!errorMessage.toLowerCase().includes('already exists')) {
        toast.error(errorMessage);
      } else {
        // For duplicate errors, show success instead
        toast.success(`Section '${newSectionTitle}' already exists and is ready to use`);
        setNewSectionTitle('');
        setNewSectionDesc('');
        setIsAddingSection(false);
      }
    } finally {
      setSectionsPending(false);
      creatingRef.current = false;
    }
  }, [
    proposalId,
    newSectionTitle,
    newSectionDesc,
    createSection,
    setSectionsPending,
    sectionsData,
    toast,
    refetchSections,
    sectionsPending,
  ]);

  const handleNext = useCallback(async () => {
    // Calculate fresh total to ensure accuracy
    const freshTotal = selectedProducts.reduce((sum, product) => {
      return sum + product.unitPrice * product.quantity;
    }, 0);

    // Include section assignments in step data
    const productsWithSections = selectedProducts.map(product => ({
      ...product,
      sectionId: currentAssignmentByRow[product.id] || null,
    }));

    const stepData: ProposalProductData = {
      products: productsWithSections,
      totalValue: freshTotal,
    };

    // Reduced logging for step navigation
    if (process.env.NODE_ENV === 'development') {
      logDebug('ProductSelectionStep: Step data saved with sections', {
        component: 'ProductSelectionStep',
        operation: 'handleNext',
        productsCount: selectedProducts.length,
        totalValue: freshTotal,
        sectionsAssigned: Object.values(currentAssignmentByRow).filter(Boolean).length,
      });
    }

    // ✅ FIXED: Use proper store setStepData with step number (4 for ProductSelectionStep)
    setStepData(4, stepData);

    // Track analytics
    analytics('proposal_step_data_saved', {
      userStory: 'product_selection_completion',
      hypothesis: 'saving_product_data_enables_proposal_completion',
      metadata: {
        step: 'product_selection',
        productsSelected: selectedProducts.length,
        totalValue: freshTotal,
        sectionsAssigned: Object.values(currentAssignmentByRow).filter(Boolean).length,
      },
    });

    analytics(
      'proposal_step_completed',
      {
        step: 4,
        stepName: 'Product Selection',
        productCount: selectedProducts.length,
        totalAmount: freshTotal,
        sectionsAssigned: Object.values(currentAssignmentByRow).filter(Boolean).length,
        userStory: 'US-3.1',
        hypothesis: 'H4',
      },
      'medium'
    );

    // Ensure pending assignments flushed before moving on
    try {
      if (proposalId) {
        await useSectionAssignmentStore.getState().flushPendingAssignments(proposalId);
      }
    } catch {
      // ignore here; wizard will handle errors on update/finish
    }

    onNext();
  }, [analytics, onNext, selectedProducts, setStepData, proposalId, currentAssignmentByRow]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Selection</h2>
          <p className="mt-2 text-gray-600">Choose products and assign to sections</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">Sections ({sectionsCount})</span>
          <Button
            aria-label="Add section"
            variant="outline"
            size="sm"
            onClick={() => setIsAddingSection(s => !s)}
            disabled={!proposalId}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isAddingSection && (
        <Card className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <Input
                value={newSectionTitle}
                onChange={e => setNewSectionTitle(e.target.value)}
                placeholder="e.g., Cameras"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <Input
                value={newSectionDesc}
                onChange={e => setNewSectionDesc(e.target.value)}
                placeholder="Short description"
              />
            </div>
            <div className="flex gap-2 md:col-span-3">
              <Button
                onClick={handleCreateSection}
                disabled={
                  !proposalId ||
                  !newSectionTitle.trim() ||
                  createSection.isPending ||
                  sectionsPending
                }
                aria-label="Create section"
              >
                Create Section
              </Button>
              <Button variant="outline" onClick={() => setIsAddingSection(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Sections panel */}
      <Card className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sections</h3>
        {!sectionsData || sectionsData.length === 0 ? (
          <p className="text-gray-500">No sections yet. Click + to add a header section.</p>
        ) : (
          <div className="space-y-2">
            {sectionsData.map(s => {
              const isDragging = draggedSectionId === s.id;
              const isDragOver = dragOverSectionId === s.id;

              return (
                <div
                  key={s.id}
                  className={`flex items-center justify-between p-2 border rounded bg-gray-50 transition-all duration-200 ${
                    isDragging ? 'opacity-50 scale-95' : ''
                  } ${isDragOver ? 'border-blue-400 bg-blue-50' : ''}`}
                  draggable
                  onDragStart={e => handleDragStart(e, s.id)}
                  onDragOver={e => handleDragOver(e, s.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, s.id)}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="cursor-grab hover:cursor-grabbing p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-4 h-4 text-gray-400" />
                    </div>
                    <span className="text-sm font-medium text-gray-900">{s.title}</span>
                    <span className="text-xs text-gray-500">
                      ({sectionCounts[s.id] || 0} products)
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteSection(s.id, s.title)}
                    disabled={deleteSection.isPending}
                    aria-label={`Delete section ${s.title}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
        {sectionsLastUpdated && (
          <div className="mt-2 text-xs text-gray-500">Last updated {sectionsLastUpdated}</div>
        )}
      </Card>

      {/* Search & Sort */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Products</label>
            <Input
              {...register('search')}
              value={search}
              onChange={e => setValue('search', e.target.value)}
              placeholder="Search by name, SKU, or description..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              {...register('category')}
              className="border rounded px-3 py-2 text-sm w-full"
              value={category}
              onChange={e => setValue('category', e.target.value)}
            >
              <option value="">All categories</option>
              {(categoryData?.categories || []).map(c => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <Controller
              name="sortBy"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  className="border rounded px-3 py-2 text-sm w-full"
                  value={`${sortBy}:${sortOrder}`}
                  onChange={e => {
                    const [sb, so] = e.target.value.split(':') as [typeof sortBy, typeof sortOrder];
                    setValue('sortBy', sb);
                    setValue('sortOrder', so);
                  }}
                >
                  <option value="name:asc">Name (A→Z)</option>
                  <option value="name:desc">Name (Z→A)</option>
                  <option value="price:asc">Price (Low→High)</option>
                  <option value="price:desc">Price (High→Low)</option>
                  <option value="createdAt:desc">Newest</option>
                  <option value="createdAt:asc">Oldest</option>
                </select>
              )}
            />
          </div>
          <div className="flex items-center gap-2">
            <Controller
              name="showSelectedOnly"
              control={control}
              render={({ field: { ...field } }) => (
                <input
                  {...field}
                  id="show-selected-only"
                  type="checkbox"
                  className="accent-blue-600"
                  checked={showSelectedOnly}
                  onChange={e => setValue('showSelectedOnly', e.target.checked)}
                />
              )}
            />
            <label htmlFor="show-selected-only" className="text-sm text-gray-700">
              Show selected only
            </label>
          </div>
        </div>
      </Card>

      {/* Grouped products by sections */}
      <Card className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Selected Items by Section</h3>
        {(!selectedProducts || selectedProducts.length === 0) && (
          <p className="text-gray-500">No products selected.</p>
        )}
        {selectedProducts && selectedProducts.length > 0 && (
          <div className="space-y-6">
            {/* Show sections with products */}
            {Object.values(groupedProductsBySection.grouped).map(({ section, products, total }) => {
              if (products.length === 0) return null;

              const isCollapsed = collapsedSections.has(section.id);

              const isDragging = draggedSectionId === section.id;
              const isDragOver = dragOverSectionId === section.id;

              return (
                <div
                  key={section.id}
                  className={`border border-gray-200 rounded-lg p-4 transition-all duration-200 ${
                    isDragging ? 'opacity-50 scale-95' : ''
                  } ${isDragOver ? 'border-blue-400 bg-blue-50' : ''}`}
                  draggable
                  onDragStart={e => handleDragStart(e, section.id)}
                  onDragOver={e => handleDragOver(e, section.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={e => handleDrop(e, section.id)}
                >
                  <div
                    className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 cursor-pointer hover:bg-gray-50 -m-4 p-4 rounded-t-lg transition-colors"
                    onClick={() => toggleSectionCollapse(section.id)}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="cursor-grab hover:cursor-grabbing p-1 hover:bg-gray-200 rounded transition-colors"
                        onClick={e => e.stopPropagation()}
                        title="Drag to reorder"
                      >
                        <GripVertical className="w-4 h-4 text-gray-400" />
                      </div>
                      {isCollapsed ? (
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                      <h4 className="text-lg font-semibold text-gray-900">{section.title}</h4>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {products.length} product{products.length !== 1 ? 's' : ''}
                      </div>
                      <div className="text-lg font-bold text-gray-900">${total.toFixed(2)}</div>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <div className="space-y-2">
                      {/* Header row */}
                      <div className="grid grid-cols-12 gap-4 py-2 px-3 bg-gray-50 rounded text-sm font-medium text-gray-700">
                        <div className="col-span-4">Product</div>
                        <div className="col-span-2 text-center">Quantity</div>
                        <div className="col-span-2 text-center">Unit Price</div>
                        <div className="col-span-2 text-center">Total Price</div>
                        <div className="col-span-1 text-center">Section</div>
                        <div className="col-span-1 text-center">Action</div>
                      </div>

                      {/* Product rows */}
                      {products.map(sp => (
                        <div
                          key={sp.id}
                          className="grid grid-cols-12 gap-4 py-3 px-3 border border-gray-200 rounded hover:bg-gray-50"
                        >
                          <div className="col-span-4 min-w-0">
                            <div className="font-medium text-gray-900 truncate">{sp.name}</div>
                            <div className="text-xs text-gray-500 truncate">
                              {sp.category || 'General'}
                            </div>
                          </div>
                          <div className="col-span-2 flex items-center justify-center">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleQuantityChange(sp.productId, sp.quantity - 1)}
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                value={sp.quantity}
                                onChange={e =>
                                  handleQuantityChange(sp.productId, parseInt(e.target.value) || 1)
                                }
                                className="w-12 h-6 text-center text-sm"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleQuantityChange(sp.productId, sp.quantity + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </div>
                          <div className="col-span-2 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-900">
                              ${(sp.unitPrice || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="col-span-2 flex items-center justify-center">
                            <span className="text-sm font-semibold text-gray-900">
                              ${(sp.total || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="col-span-1 flex items-center justify-center">
                            <select
                              aria-label={`Assign section for ${sp.name}`}
                              className="border rounded px-2 py-1 text-sm w-full"
                              disabled={!proposalId}
                              value={currentAssignmentByRow[sp.id] ?? ''}
                              onChange={e => setAssignment(sp.id, e.target.value || null)}
                            >
                              <option value="">Unassigned</option>
                              {(sectionsData || [])
                                .slice()
                                .sort((a, b) => a.order - b.order)
                                .map(s => (
                                  <option key={s.id} value={s.id}>
                                    {s.title}
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div className="col-span-1 flex items-center justify-center">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleRemoveProduct(sp.productId)}
                              aria-label={`Remove ${sp.name}`}
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Show unassigned products */}
            {groupedProductsBySection.unassignedProducts.length > 0 && (
              <div
                className={`border border-gray-200 rounded-lg p-4 transition-all duration-200 ${
                  draggedSectionId === 'unassigned' ? 'opacity-50 scale-95' : ''
                } ${dragOverSectionId === 'unassigned' ? 'border-blue-400 bg-blue-50' : ''}`}
                draggable
                onDragStart={e => handleDragStart(e, 'unassigned')}
                onDragOver={e => handleDragOver(e, 'unassigned')}
                onDragLeave={handleDragLeave}
                onDrop={e => handleDrop(e, 'unassigned')}
              >
                <div
                  className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200 cursor-pointer hover:bg-gray-50 -m-4 p-4 rounded-t-lg transition-colors"
                  onClick={() => toggleSectionCollapse('unassigned')}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="cursor-grab hover:cursor-grabbing p-1 hover:bg-gray-200 rounded transition-colors"
                      onClick={e => e.stopPropagation()}
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-4 h-4 text-gray-400" />
                    </div>
                    {collapsedSections.has('unassigned') ? (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                    <h4 className="text-lg font-semibold text-gray-900">Unassigned Products</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      {groupedProductsBySection.unassignedProducts.length} product
                      {groupedProductsBySection.unassignedProducts.length !== 1 ? 's' : ''}
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      $
                      {groupedProductsBySection.unassignedProducts
                        .reduce((sum, p) => sum + (p.total || 0), 0)
                        .toFixed(2)}
                    </div>
                  </div>
                </div>

                {!collapsedSections.has('unassigned') && (
                  <div className="space-y-2">
                    {/* Header row */}
                    <div className="grid grid-cols-12 gap-4 py-2 px-3 bg-gray-50 rounded text-sm font-medium text-gray-700">
                      <div className="col-span-4">Product</div>
                      <div className="col-span-2 text-center">Quantity</div>
                      <div className="col-span-2 text-center">Unit Price</div>
                      <div className="col-span-2 text-center">Total Price</div>
                      <div className="col-span-1 text-center">Section</div>
                      <div className="col-span-1 text-center">Action</div>
                    </div>

                    {/* Unassigned product rows */}
                    {groupedProductsBySection.unassignedProducts.map(sp => (
                      <div
                        key={sp.id}
                        className="grid grid-cols-12 gap-4 py-3 px-3 border border-gray-200 rounded hover:bg-gray-50"
                      >
                        <div className="col-span-4 min-w-0">
                          <div className="font-medium text-gray-900 truncate">{sp.name}</div>
                          <div className="text-xs text-gray-500 truncate">
                            {sp.category || 'General'}
                          </div>
                        </div>
                        <div className="col-span-2 flex items-center justify-center">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleQuantityChange(sp.productId, sp.quantity - 1)}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={sp.quantity}
                              onChange={e =>
                                handleQuantityChange(sp.productId, parseInt(e.target.value) || 1)
                              }
                              className="w-12 h-6 text-center text-sm"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => handleQuantityChange(sp.productId, sp.quantity + 1)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                        <div className="col-span-2 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-900">
                            ${(sp.unitPrice || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="col-span-2 flex items-center justify-center">
                          <span className="text-sm font-semibold text-gray-900">
                            ${(sp.total || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <select
                            aria-label={`Assign section for ${sp.name}`}
                            className="border rounded px-2 py-1 text-sm w-full"
                            disabled={!proposalId}
                            value={currentAssignmentByRow[sp.id] ?? ''}
                            onChange={e => setAssignment(sp.id, e.target.value || null)}
                          >
                            <option value="">Unassigned</option>
                            {(sectionsData || [])
                              .slice()
                              .sort((a, b) => a.order - b.order)
                              .map(s => (
                                <option key={s.id} value={s.id}>
                                  {s.title}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveProduct(sp.productId)}
                            aria-label={`Remove ${sp.name}`}
                          >
                            ×
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Loading State */}
      {(productsLoading || categoriesLoading) && (
        <div className="text-center py-4">
          <p className="text-gray-500">Loading products...</p>
        </div>
      )}

      {/* Error State */}
      {productsError && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="text-sm text-red-800">
            <h4 className="font-medium mb-2">Error loading products:</h4>
            <p>{(productsError as Error).message}</p>
          </div>
        </Card>
      )}
      {/* Catalog with quick add / steppers */}
      <Card className="p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-3">Catalog</h3>
        {!displayedItems || displayedItems.length === 0 ? (
          <p className="text-gray-500 py-6 text-center">
            No products found. Try a different filter.
          </p>
        ) : (
          <div className="divide-y">
            {displayedItems.map(p => {
              const isSelected = selectedSet.has(p.id);
              const compat =
                selectedCategories.size === 0 || p.category.some(c => selectedCategories.has(c))
                  ? 'compatible'
                  : 'check';
              const sp = selectedProducts.find(sp => sp.productId === p.id);
              return (
                <div key={p.id} className="py-3 flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 truncate">{p.name}</h4>
                      {p.sku ? <span className="text-xs text-gray-500">{p.sku}</span> : null}
                      {isSelected && (
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                          Selected
                        </span>
                      )}
                      <Tooltip
                        content={
                          compat === 'compatible'
                            ? 'Likely compatible with current selection'
                            : 'Compatibility not verified (non-blocking)'
                        }
                      >
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${compat === 'compatible' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {compat === 'compatible' ? 'Compatible' : 'Check'}
                        </span>
                      </Tooltip>
                    </div>
                    <div className="text-sm text-gray-600 mt-0.5">
                      {(p.category || []).join(', ')}
                    </div>
                    <div className="text-sm text-gray-900 mt-1">
                      ${(p.price ?? 0).toFixed(2)} per unit
                    </div>
                  </div>
                  {!isSelected ? (
                    <div className="shrink-0">
                      <Button size="sm" onClick={() => handleAddProduct(p.id)}>
                        Add
                      </Button>
                    </div>
                  ) : (
                    <div className="shrink-0 flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(p.id, (sp?.quantity || 1) - 1)}
                      >
                        -
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={sp?.quantity || 1}
                        onChange={e => handleQuantityChange(p.id, parseInt(e.target.value) || 1)}
                        className="w-16 text-center"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(p.id, (sp?.quantity || 1) + 1)}
                      >
                        +
                      </Button>
                      <div className="ml-3 text-sm font-medium text-gray-900">
                        ${((sp?.unitPrice || 0) * (sp?.quantity || 1)).toFixed(2)}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2 text-red-600"
                        onClick={() => handleRemoveProduct(p.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Sticky totals bar */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="text-sm text-gray-700">
            <span className="font-medium">{selectedProducts.length}</span> product
            {selectedProducts.length !== 1 ? 's' : ''} selected
          </div>
          <div className="text-lg font-semibold text-gray-900">
            Total: ${(totalAmount || 0).toFixed(2)}
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack}>
          Previous
        </Button>
        <Button onClick={handleNext} disabled={!selectedProducts || selectedProducts.length === 0}>
          Next Step
        </Button>
      </div>
    </div>
  );
});

ProductSelectionStep.displayName = 'ProductSelectionStep';
