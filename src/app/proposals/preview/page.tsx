'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { CollapsibleDatasheetSection } from '@/components/datasheets/CollapsibleDatasheetSection';
import { ClientLayoutWrapper } from '@/components/layout/ClientLayoutWrapper';
import PrintDatasheets from '@/components/proposals/print/PrintDatasheets';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/forms/Button';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useApiClient } from '@/hooks/useApiClient';
import { processError } from '@/lib/errors/ErrorHandlingService';
import { logError, logInfo } from '@/lib/logger';
import { CheckCircleIcon, DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import './print-styles.css';

interface PreviewData {
  company: {
    name: string;
    industry?: string;
    contactPerson?: string;
    contactEmail?: string;
    contactPhone?: string;
  };
  proposal: {
    title: string;
    description?: string;
    dueDate?: string | Date | null;
    priority?: string;
    rfpReferenceNumber?: string;
  };
  sections?: Array<{
    id: string;
    title: string;
    content: string;
    order: number;
    products: Array<{
      id: string;
      productId: string;
      name: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      total: number;
      category: string;
      datasheetPath?: string | null;
    }>;
    total: number;
  }>;
  unassignedProducts?: Array<{
    id: string;
    productId: string;
    name: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    total: number;
    category: string;
    datasheetPath?: string | null;
  }>;
  // Legacy products array for backward compatibility
  products?: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice?: number;
    category?: string;
  }>;
  totals: { currency: string; amount: number };
  terms: Array<{ title: string; section: string; content: string }>;
  step5Sections?: Array<{
    id: string;
    title: string;
    content: string;
    order: number;
    type?: string;
  }>;
}

// interface LoadingState {
//   isLoading: boolean;
//   isHydrating: boolean;
//   hasError: boolean;
//   errorMessage?: string;
// }

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

// const staggerChildren = {
//   animate: {
//     transition: {
//       staggerChildren: 0.1,
//     },
//   },
// };

// Loading skeleton component with shimmer animation
// const SkeletonLoader = ({ className = '' }: { className?: string }) => (
//   <div
//     className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded ${className}`}
//     style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}
//   />
// );

// Add shimmer keyframes to document
if (typeof document !== 'undefined' && !document.getElementById('shimmer-styles')) {
  const style = document.createElement('style');
  style.id = 'shimmer-styles';
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: -200px 0; }
      100% { background-position: calc(200px + 100%) 0; }
    }
  `;
  document.head.appendChild(style);
}

export default function ProposalPreviewPage() {
  const [data, setData] = useState<PreviewData | null>(null);
  const [proposalId, setProposalId] = useState<string | null>(null);
  const [autoPrint, setAutoPrint] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDatasheets, setSelectedDatasheets] = useState<Set<string>>(new Set());
  // const [showDatasheetSelector, setShowDatasheetSelector] = useState<boolean>(false);
  const [previewDatasheet, setPreviewDatasheet] = useState<string | null>(null);
  const [printReady, setPrintReady] = useState<boolean>(false);
  const [selectedStep5Ids, setSelectedStep5Ids] = useState<Set<string>>(new Set());
  const apiClient = useApiClient();
  const analytics = useAnalytics();
  type SectionKey = 'company' | 'products' | 'sectionAssignment';
  type ProductSubKey = 'tables' | 'datasheets' | 'totals';
  type TemplateType = 'preview' | 'strict' | 'minimal' | 'detailed';

  type PrintOptions = {
    companyInfo: boolean;
    products: boolean;
    header: boolean;
    footer: boolean;
    sectionAssignment: boolean;
    order: SectionKey[];
    productOrder: ProductSubKey[];
    template: TemplateType;
    totals: boolean;
    terms: boolean;
  };
  const [printOptions, setPrintOptions] = useState<PrintOptions>({
    companyInfo: true,
    products: true,
    header: true,
    footer: true,
    sectionAssignment: true,
    order: ['company', 'products', 'sectionAssignment'],
    productOrder: ['tables', 'datasheets', 'totals'],
    template: 'strict',
    totals: true,
    terms: true,
  });
  const visibleSections = useMemo(
    () =>
      (data?.sections || [])
        .filter(section => section.products && section.products.length > 0)
        .sort((a, b) => a.order - b.order),
    [data]
  );

  // Component Traceability Matrix - Track component usage
  useEffect(() => {
    analytics.track('proposal_preview_viewed', {
      component: 'ProposalPreviewPage',
      userStory: 'US-4.1',
      hypothesis: 'H6',
      proposalId: proposalId || 'unknown',
    });
  }, [analytics, proposalId]);

  const pdfQuery = useMemo(() => {
    const params = new URLSearchParams({
      template: printOptions.template,
      header: printOptions.header ? '1' : '0',
      footer: printOptions.footer ? '1' : '0',
      company: printOptions.companyInfo ? '1' : '0',
      sectionAssignment: printOptions.sectionAssignment ? '1' : '0',
    });

    // For strict template, add mode parameter for backward compatibility
    if (printOptions.template === 'strict') {
      params.set('mode', 'strict');
    }

    if (printOptions.order?.length) {
      const effective = printOptions.order.filter(
        k =>
          (k === 'company' && printOptions.companyInfo) ||
          (k === 'products' && printOptions.products) ||
          (k === 'sectionAssignment' && printOptions.sectionAssignment)
      );
      params.set('order', effective.join(','));
    }

    if (printOptions.productOrder?.length) {
      params.set('productOrder', printOptions.productOrder.join(','));
    }

    if (selectedDatasheets.size > 0)
      params.set('datasheets', Array.from(selectedDatasheets).join(','));
    if (selectedStep5Ids.size > 0) params.set('step5', Array.from(selectedStep5Ids).join(','));
    return params.toString();
  }, [printOptions, selectedDatasheets, selectedStep5Ids]);

  // Initialize selectedStep5Ids to ALL by default when data loads
  useEffect(() => {
    if (data?.step5Sections && data.step5Sections.length > 0) {
      setSelectedStep5Ids(prev => (prev.size ? prev : new Set(data.step5Sections!.map(s => s.id))));
    }
  }, [data?.step5Sections]);

  // Collect all available datasheets from the proposal (only products with actual datasheet URLs)
  const availableDatasheets = useMemo(() => {
    if (!data) return [];

    const datasheets: Array<{
      productId: string;
      productName: string;
      sku: string;
      datasheetPath: string;
    }> = [];

    // Check sections - only include products with non-empty datasheet paths
    data.sections?.forEach(section => {
      section.products.forEach(product => {
        if (product.datasheetPath && product.datasheetPath.trim() !== '') {
          datasheets.push({
            productId: product.productId,
            productName: product.name,
            sku: product.sku,
            datasheetPath: product.datasheetPath,
          });
        }
      });
    });

    // Check unassigned products - only include products with non-empty datasheet paths
    data.unassignedProducts?.forEach(product => {
      if (product.datasheetPath && product.datasheetPath.trim() !== '') {
        datasheets.push({
          productId: product.productId,
          productName: product.name,
          sku: product.sku,
          datasheetPath: product.datasheetPath,
        });
      }
    });

    return datasheets;
  }, [data]);

  // Load persisted print options
  useEffect(() => {
    try {
      const raw = localStorage.getItem('proposal-print-options');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setPrintOptions(prev => ({ ...prev, ...parsed }));
        }
      }
    } catch (error) {
      console.error('Failed to load print options:', error);
    }
  }, []);

  // Persist print options
  useEffect(() => {
    try {
      localStorage.setItem('proposal-print-options', JSON.stringify(printOptions));
    } catch (error) {
      console.error('Failed to save print options:', error);
    }
  }, [printOptions]);

  // Reorder helpers for print blocks
  // const movePrintBlock = (key: SectionKey, dir: 'up' | 'down') => {
  //   setPrintOptions(prev => {
  //     const order = [...(prev.order || [])];
  //     const i = order.indexOf(key);
  //     if (i < 0) return prev;
  //     const j = dir === 'up' ? i - 1 : i + 1;
  //     if (j < 0 || j >= order.length) return prev;
  //     [order[i], order[j]] = [order[j], order[i]];
  //     return { ...prev, order };
  //   });
  // };

  // Handle datasheet selection
  const toggleDatasheet = (productId: string) => {
    setSelectedDatasheets(prev => {
      const newSet = new Set(prev);
      const wasSelected = newSet.has(productId);
      if (wasSelected) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }

      // Track datasheet selection for analytics
      analytics.track('datasheet_toggled', {
        component: 'ProposalPreviewPage',
        operation: 'toggleDatasheet',
        productId,
        action: wasSelected ? 'deselected' : 'selected',
        userStory: 'US-4.1',
        hypothesis: 'H6',
      });

      return newSet;
    });
  };

  const selectAllDatasheets = () => {
    setSelectedDatasheets(new Set(availableDatasheets.map(ds => ds.productId)));

    // Track bulk datasheet selection
    analytics.track('datasheets_selected_all', {
      component: 'ProposalPreviewPage',
      operation: 'selectAllDatasheets',
      count: availableDatasheets.length,
      userStory: 'US-4.1',
      hypothesis: 'H6',
    });
  };

  const clearAllDatasheets = () => {
    setSelectedDatasheets(new Set());

    // Track bulk datasheet deselection
    analytics.track('datasheets_cleared_all', {
      component: 'ProposalPreviewPage',
      operation: 'clearAllDatasheets',
      userStory: 'US-4.1',
      hypothesis: 'H6',
    });
  };

  useEffect(() => {
    const loadProposalData = async () => {
      try {
        // First try to get proposal ID from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const proposalId = urlParams.get('id');

        if (proposalId) {
          setProposalId(proposalId);
          logInfo('Loading proposal preview data', {
            component: 'ProposalPreviewPage',
            operation: 'loadProposalData',
            proposalId,
          });

          // Use API client for preview endpoint (service layer doesn't have preview method yet)
          const response = await apiClient.get(`/api/proposals/${proposalId}/preview`);
          if (
            response &&
            typeof response === 'object' &&
            'ok' in response &&
            response.ok &&
            'data' in response &&
            response.data
          ) {
            setData(response.data as PreviewData);
            logInfo('Proposal preview data loaded successfully', {
              component: 'ProposalPreviewPage',
              operation: 'loadProposalData',
              proposalId,
              sectionsCount: (response.data as PreviewData).sections?.length || 0,
            });
            setIsLoading(false);
            return;
          }
        }

        // Fallback to localStorage for backward compatibility
        const raw = localStorage.getItem('proposal-preview-data');
        if (!raw) {
          setData(null);
          setIsLoading(false);
          return;
        }
        const parsed: unknown = JSON.parse(raw);
        // Safe shape guard
        const isPreviewData = (v: unknown): v is PreviewData => {
          if (!v || typeof v !== 'object') return false;
          const obj = v as Record<string, unknown>;
          const companyOk =
            !!obj.company &&
            typeof obj.company === 'object' &&
            typeof (obj.company as any).name === 'string';
          const proposalOk =
            !!obj.proposal &&
            typeof obj.proposal === 'object' &&
            typeof (obj.proposal as any).title === 'string';
          const sectionsOk = Array.isArray(obj.sections);
          const productsOk = Array.isArray(obj.products) || Array.isArray(obj.unassignedProducts);
          const totalsOk = !!obj.totals && typeof obj.totals === 'object';
          const termsOk = Array.isArray(obj.terms);
          return companyOk && proposalOk && (sectionsOk || productsOk) && totalsOk && termsOk;
        };
        if (isPreviewData(parsed)) {
          setData(parsed);
        } else {
          setData(null);
        }
      } catch (error) {
        const processedError = processError(
          error,
          'Failed to load proposal data',
          'PROPOSAL_PREVIEW_LOAD_FAILED'
        );
        logError('Failed to load proposal data', {
          component: 'ProposalPreviewPage',
          operation: 'loadProposalData',
          error: processedError.message,
          errorCode: processedError.code,
          proposalId: proposalId || 'unknown',
        });
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadProposalData();
  }, [apiClient, proposalId]);

  // Hydrate missing product names/prices for nicer preview (batch request)
  useEffect(() => {
    const hydrateProducts = async () => {
      // Only hydrate legacy products array for backward compatibility
      if (!data || !Array.isArray(data.products) || data.products.length === 0) return;
      const needsHydration = data.products.filter(
        (p: any) => !p?.name || p.name.toLowerCase() === 'unknown product' || !p.unitPrice
      );
      if (needsHydration.length === 0) return;

      // const startTime = performance.now();
      try {
        const ids = needsHydration.map((p: any) => p.id).join(',');
        interface BatchProduct {
          id: string;
          name?: string;
          price?: number;
          currency?: string;
        }
        const res = await apiClient.get<{ success?: boolean; data?: BatchProduct[]; meta?: any }>(
          `/api/products?ids=${encodeURIComponent(ids)}&fields=id,name,price,currency`
        );
        const list: BatchProduct[] = (res as any)?.data ?? (res as unknown as BatchProduct[]);
        const byId = new Map<string, BatchProduct>();
        for (const item of list || []) byId.set(item.id, item);

        const updated = data.products.map((prod: any) => {
          const hydrate = byId.get(prod.id);
          if (!hydrate) return prod;
          const nextUnit = typeof hydrate.price === 'number' ? hydrate.price : prod.unitPrice;
          return {
            ...prod,
            name: hydrate.name || prod.name,
            unitPrice: nextUnit,
            totalPrice: prod.totalPrice ?? (prod.quantity || 1) * nextUnit,
          };
        });

        setData(prev => (prev ? { ...prev, products: updated } : prev));
      } catch {
        // ignore hydration errors
      }
    };
    hydrateProducts();
    // Intentionally depend only on data to avoid unstable apiClient dependency loops
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // If query param print=1 is present, trigger auto print after load
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('print') === '1') {
      setAutoPrint(true);
    }
  }, []);

  useEffect(() => {
    if (!autoPrint || !data) return;
    const hasSelectedDatasheets = selectedDatasheets.size > 0;
    // If datasheets are selected, wait until rendered before printing
    if (hasSelectedDatasheets && !printReady) return;
    const id = setTimeout(() => window.print(), 300);
    return () => clearTimeout(id);
  }, [autoPrint, data, printReady, selectedDatasheets.size]);

  const totalAmount = useMemo(() => {
    if (!data) return 0;

    // Calculate from sections
    const sectionsTotal = data.sections?.reduce((sum, section) => sum + section.total, 0) || 0;

    // Calculate from unassigned products
    const unassignedTotal = data.unassignedProducts?.reduce((sum, p) => sum + p.total, 0) || 0;

    // Fallback to legacy products array for backward compatibility
    const legacyTotal =
      data.products?.reduce(
        (sum: number, p: any) => sum + (p.totalPrice || p.quantity * p.unitPrice),
        0
      ) || 0;

    return sectionsTotal + unassignedTotal + legacyTotal;
  }, [data]);

  const productsSummary = useMemo(() => {
    if (!data) return { totalItems: 0, categories: new Set(), avgPrice: 0 };

    // Collect all products from sections and unassigned
    const allProducts = [
      ...(data.sections?.flatMap(section => section.products) || []),
      ...(data.unassignedProducts || []),
      // Fallback to legacy products array
      ...(data.products || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        total: p.totalPrice || p.quantity * p.unitPrice,
        category: p.category || 'General',
      })),
    ];

    const categories = new Set(allProducts.map(p => p.category).filter(Boolean));
    const totalItems = allProducts.reduce((sum, p) => sum + p.quantity, 0);
    const avgPrice = totalAmount / (totalItems || 1);
    return { totalItems, categories, avgPrice };
  }, [data, totalAmount]);

  return (
    <ClientLayoutWrapper>
      <AuthProvider>
        <ProtectedRoute>
          {isLoading ? (
            <div className="min-h-screen bg-gray-50 px-6 py-8">
              <div className="max-w-3xl mx-auto">
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            </div>
          ) : !data ? (
            <div className="min-h-screen bg-gray-50 px-6 py-8">
              <div className="max-w-3xl mx-auto">
                <div className="rounded-lg border border-gray-200 bg-white p-6">
                  <h1 className="text-xl font-semibold text-gray-900">Proposal Preview</h1>
                  <p className="mt-2 text-gray-600">
                    No preview data found. Return to the wizard and click "Preview Proposal" again.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <AnimatePresence>
              <div className="min-h-screen bg-gray-50 p-6 print:p-0 print:bg-white">
                {/* Print-only header and footer for PDF customization */}
                {printOptions.header && (
                  <div className="print-only print-header-bar">
                    <div className="flex items-center gap-2">
                      <Image src="/icons/icon.svg" alt="Logo" className="print-logo" width={24} height={24} />
                      <span className="text-xs text-gray-700">
                        {data.company?.name || 'Proposal'}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600">{data.proposal?.title}</div>
                  </div>
                )}
                {printOptions.footer && (
                  <div className="print-only print-footer">
                    <div
                      className="text-xs page-number"
                      data-title={data.proposal?.title || 'Proposal'}
                    />
                  </div>
                )}
                <div className="max-w-4xl mx-auto flex flex-col">
                  {/* Header + Actions */}
                  <div className="mb-6 flex items-start justify-between gap-4 print:block proposal-header">
                    <div>
                      <div className="flex items-start justify-between mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 print:text-4xl">
                          {data.proposal.title}
                        </h1>
                        <div className="flex items-center gap-2 text-sm text-gray-500 no-print">
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          Ready to Preview
                        </div>
                      </div>

                      {data.step5Sections && data.step5Sections.length > 0 && (
                        <div className="mt-3 border-t pt-3">
                          <div className="text-gray-900 font-medium mb-2">
                            Section Assignment (Strict PDF)
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <label className="inline-flex items-center gap-2 text-xs">
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                checked={selectedStep5Ids.size === data.step5Sections.length}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setSelectedStep5Ids(
                                      new Set(data.step5Sections!.map(s => s.id))
                                    );
                                  } else {
                                    setSelectedStep5Ids(new Set());
                                  }
                                }}
                              />
                              <span>Select All</span>
                            </label>
                            {data.step5Sections.map(s => (
                              <label key={s.id} className="inline-flex items-center gap-2 text-xs">
                                <input
                                  type="checkbox"
                                  className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                  checked={selectedStep5Ids.has(s.id)}
                                  onChange={e => {
                                    setSelectedStep5Ids(prev => {
                                      const next = new Set(prev);
                                      if (e.target.checked) next.add(s.id);
                                      else next.delete(s.id);
                                      return next;
                                    });
                                  }}
                                />
                                <span>{s.title}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      {data.proposal.description && (
                        <p className="mt-1 text-gray-700">{data.proposal.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 no-print">
                      <Button
                        type="button"
                        onClick={() => {
                          analytics.track('proposal_print_initiated', {
                            component: 'ProposalPreviewPage',
                            operation: 'print',
                            template: printOptions.template,
                            userStory: 'US-4.1',
                            hypothesis: 'H6',
                          });
                          window.print();
                        }}
                        variant="primary"
                        aria-label="Print or save as PDF"
                        title="Print or save as PDF"
                      >
                        Print / Save PDF
                      </Button>
                      {proposalId && (
                        <>
                          <a
                            href={`/api/proposals/${proposalId}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200"
                          >
                            Download PDF
                          </a>
                          <a
                            href={`/api/proposals/${proposalId}/pdf?${pdfQuery}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200"
                            title={`${printOptions.template === 'strict' ? 'Strict' : printOptions.template === 'preview' ? 'Preview' : 'Custom'} PDF respects your Print Options`}
                          >
                            {printOptions.template === 'strict'
                              ? 'Strict PDF'
                              : printOptions.template === 'preview'
                                ? 'Preview PDF'
                                : 'Custom PDF'}
                          </a>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Print options panel (screen-only) */}
                  <div className="no-print mb-4">
                    <div className="rounded-md border border-gray-200 bg-white p-3 text-sm shadow-sm">
                      <div className="font-medium text-gray-900 mb-2">Print Options</div>

                      {/* Template Selection */}
                      <div className="mb-3 border-b pb-3">
                        <div className="text-gray-900 font-medium mb-2">PDF Template</div>
                        <div className="flex flex-wrap gap-3">
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="radio"
                              name="template"
                              value="preview"
                              className="h-4 w-4 text-blue-600 border-gray-300"
                              checked={printOptions.template === 'preview'}
                              onChange={e =>
                                setPrintOptions(p => ({
                                  ...p,
                                  template: e.target.value as TemplateType,
                                }))
                              }
                            />
                            <span className="text-sm">
                              <span className="font-medium">Preview</span>
                              <span className="text-gray-500 ml-1">(Browser print styles)</span>
                            </span>
                          </label>
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="radio"
                              name="template"
                              value="strict"
                              className="h-4 w-4 text-blue-600 border-gray-300"
                              checked={printOptions.template === 'strict'}
                              onChange={e =>
                                setPrintOptions(p => ({
                                  ...p,
                                  template: e.target.value as TemplateType,
                                }))
                              }
                            />
                            <span className="text-sm">
                              <span className="font-medium">Strict</span>
                              <span className="text-gray-500 ml-1">
                                (Custom layout, page breaks)
                              </span>
                            </span>
                          </label>
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="radio"
                              name="template"
                              value="minimal"
                              className="h-4 w-4 text-blue-600 border-gray-300"
                              checked={printOptions.template === 'minimal'}
                              onChange={e =>
                                setPrintOptions(p => ({
                                  ...p,
                                  template: e.target.value as TemplateType,
                                }))
                              }
                              disabled
                            />
                            <span className="text-sm text-gray-400">
                              <span className="font-medium">Minimal</span>
                              <span className="ml-1">(Coming soon)</span>
                            </span>
                          </label>
                          <label className="inline-flex items-center gap-2">
                            <input
                              type="radio"
                              name="template"
                              value="detailed"
                              className="h-4 w-4 text-blue-600 border-gray-300"
                              checked={printOptions.template === 'detailed'}
                              onChange={e =>
                                setPrintOptions(p => ({
                                  ...p,
                                  template: e.target.value as TemplateType,
                                }))
                              }
                              disabled
                            />
                            <span className="text-sm text-gray-400">
                              <span className="font-medium">Detailed</span>
                              <span className="ml-1">(Coming soon)</span>
                            </span>
                          </label>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            checked={printOptions.companyInfo}
                            onChange={e =>
                              setPrintOptions(p => ({ ...p, companyInfo: e.target.checked }))
                            }
                          />
                          <span>Company Info</span>
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            checked={printOptions.products}
                            onChange={e =>
                              setPrintOptions(p => ({ ...p, products: e.target.checked }))
                            }
                          />
                          <span>Products</span>
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            checked={printOptions.sectionAssignment}
                            onChange={e =>
                              setPrintOptions(p => ({ ...p, sectionAssignment: e.target.checked }))
                            }
                          />
                          <span>Section Assignment</span>
                        </label>
                        <div className="mx-2 w-px h-5 bg-gray-200" />
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            checked={printOptions.header}
                            onChange={e =>
                              setPrintOptions(p => ({ ...p, header: e.target.checked }))
                            }
                          />
                          <span>Print Header</span>
                        </label>
                        <label className="inline-flex items-center gap-2">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                            checked={printOptions.footer}
                            onChange={e =>
                              setPrintOptions(p => ({ ...p, footer: e.target.checked }))
                            }
                          />
                          <span>Print Footer</span>
                        </label>
                      </div>
                      <div className="mt-3 border-t pt-3">
                        <div className="text-gray-900 font-medium mb-2">Arrange Sections</div>
                        <ul className="flex flex-wrap gap-2" onDragOver={e => e.preventDefault()}>
                          {printOptions.order.map((k, idx) => (
                            <li
                              key={k}
                              draggable
                              onDragStart={e => e.dataTransfer.setData('text/plain', k)}
                              onDrop={e => {
                                const fromKey = e.dataTransfer.getData('text/plain') as SectionKey;
                                if (!fromKey || fromKey === k) return;
                                setPrintOptions(prev => {
                                  const arr = [...prev.order];
                                  const from = arr.indexOf(fromKey);
                                  const to = arr.indexOf(k);
                                  if (from === -1 || to === -1) return prev;
                                  arr.splice(to, 0, arr.splice(from, 1)[0]);
                                  return { ...prev, order: arr };
                                });
                              }}
                              className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded px-2 py-1 cursor-move select-none"
                              title="Drag to reorder"
                            >
                              <span className="text-xs text-gray-600">{idx + 1}.</span>
                              <span className="text-sm font-medium text-gray-800 capitalize">
                                {k === 'company'
                                  ? 'Company Info'
                                  : k === 'products'
                                    ? 'Products'
                                    : 'Section Assignment'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Arrange Products Content */}
                      {printOptions.products && (
                        <div className="mt-3 border-t pt-3">
                          <div className="text-gray-900 font-medium mb-2">
                            Arrange Products Content
                          </div>
                          <ul className="flex flex-wrap gap-2" onDragOver={e => e.preventDefault()}>
                            {printOptions.productOrder.map((k, idx) => (
                              <li
                                key={k}
                                draggable
                                onDragStart={e => e.dataTransfer.setData('text/plain', k)}
                                onDrop={e => {
                                  const fromKey = e.dataTransfer.getData(
                                    'text/plain'
                                  ) as ProductSubKey;
                                  if (!fromKey || fromKey === k) return;
                                  setPrintOptions(prev => {
                                    const arr = [...prev.productOrder];
                                    const from = arr.indexOf(fromKey);
                                    const to = arr.indexOf(k);
                                    if (from === -1 || to === -1) return prev;
                                    arr.splice(to, 0, arr.splice(from, 1)[0]);
                                    return { ...prev, productOrder: arr };
                                  });
                                }}
                                className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded px-2 py-1 cursor-move select-none"
                                title="Drag to reorder"
                              >
                                <span className="text-xs text-gray-600">{idx + 1}.</span>
                                <span className="text-sm font-medium text-gray-800 capitalize">
                                  {k === 'tables'
                                    ? 'Products Tables'
                                    : k === 'datasheets'
                                      ? 'Datasheets'
                                      : 'Totals'}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Company / Contact */}
                  {printOptions.companyInfo && (
                    <motion.div
                      style={{ order: printOptions.order.indexOf('company') + 1 || 1 }}
                      className="rounded-xl border border-gray-200 bg-white p-8 mb-6 print:shadow-none shadow-sm company-info"
                      variants={fadeInUp}
                      initial="initial"
                      animate="animate"
                      transition={{ delay: 0.1 }}
                    >
                      <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full no-print" />
                        Company Information
                      </h2>
                      <div className="grid md:grid-cols-2 gap-8">
                        <div className="flex items-start gap-3">
                          <span className="font-medium text-gray-500 min-w-[80px]">Company:</span>
                          <span className="text-gray-900 font-medium">{data.company.name}</span>
                        </div>
                        <div>
                          <span className="font-medium">Industry:</span>{' '}
                          {data.company.industry || '-'}
                        </div>
                        <div>
                          <span className="font-medium">Contact Person:</span>{' '}
                          {data.company.contactPerson || '-'}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span>{' '}
                          {data.company.contactEmail || '-'}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span>{' '}
                          {data.company.contactPhone || '-'}
                        </div>
                        <div>
                          <span className="font-medium">RFP Ref:</span>{' '}
                          {data.proposal.rfpReferenceNumber || '-'}
                        </div>
                        <div>
                          <span className="font-medium">Due Date:</span>{' '}
                          {data.proposal.dueDate
                            ? new Date(data.proposal.dueDate).toLocaleDateString()
                            : '-'}
                        </div>
                        <div className="flex items-start gap-3">
                          <span className="font-medium text-gray-500 min-w-[90px]">
                            Description:
                          </span>
                          <span className="text-gray-900">{data.proposal.description || '-'}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Products Block Wrapper */}
                  {printOptions.products && (
                    <div
                      className="products-block"
                      style={{ order: printOptions.order.indexOf('products') + 1 || 2 }}
                    >
                      {/* Sections with Products */}
                      {printOptions.products && visibleSections && visibleSections.length > 0
                        ? visibleSections.map((section, sectionIdx) => {
                            // Calculate running total up to this section
                            const runningTotal = visibleSections
                              .slice(0, sectionIdx + 1)
                              .reduce((sum, s) => sum + s.total, 0);
                            const sectionNumber = sectionIdx + 1;

                            return (
                              <motion.div
                                key={section.id}
                                style={{ order: printOptions.order.indexOf('products') + 1 || 2 }}
                                className="rounded-xl border border-gray-200 bg-white p-8 mb-6 print:shadow-none shadow-sm section-container"
                                variants={fadeInUp}
                                initial="initial"
                                animate="animate"
                                transition={{ delay: 0.1 * sectionIdx }}
                              >
                                <div className="flex items-center justify-between mb-6">
                                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-purple-600 rounded-full no-print" />
                                    <span>
                                      {sectionNumber}. {section.title}
                                    </span>
                                  </h2>
                                  <div className="text-sm text-gray-500 no-print">
                                    {section.products.length} items
                                  </div>
                                </div>

                                {section.content && (
                                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                    <p className="text-gray-700 text-sm">{section.content}</p>
                                  </div>
                                )}

                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200 text-sm compact-table">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 print:bg-white">
                                      <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700 rounded-tl-lg">
                                          #
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                          Part Number
                                        </th>
                                        <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                          Description
                                        </th>
                                        <th className="px-4 py-3 text-center font-semibold text-gray-700">
                                          Qty
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold text-gray-700">
                                          Unit Price
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold text-gray-700 rounded-tr-lg">
                                          Total
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {section.products.map((product, idx) => (
                                        <motion.tr
                                          key={product.id}
                                          className="hover:bg-gray-50 transition-colors duration-150 align-top"
                                          variants={fadeInUp}
                                          initial="initial"
                                          animate="animate"
                                          transition={{ delay: 0.05 * idx }}
                                        >
                                          <td className="px-4 py-4 text-gray-900 font-medium">
                                            {sectionNumber}.{idx + 1}
                                          </td>
                                          <td className="px-4 py-4 text-gray-700 font-mono text-xs break-all">
                                            <div>{product.productId}</div>
                                            <div className="text-gray-500 text-xs mt-1">
                                              SKU: {product.sku}
                                            </div>
                                          </td>
                                          <td className="px-4 py-4">
                                            <div className="text-gray-900 font-medium">
                                              {product.name}
                                            </div>
                                            {product.category && (
                                              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 mt-1 no-print">
                                                {product.category}
                                              </div>
                                            )}
                                          </td>
                                          <td className="px-4 py-4 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-900 font-semibold">
                                              {product.quantity}
                                            </span>
                                          </td>
                                          <td className="px-4 py-4 text-right text-gray-900 font-medium">
                                            ${product.unitPrice.toLocaleString()}
                                          </td>
                                          <td className="px-4 py-4 text-right font-bold text-green-700 text-lg">
                                            ${product.total.toLocaleString()}
                                          </td>
                                        </motion.tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                {/* Section Total */}
                                <div className="mt-4 pt-4 border-t border-gray-200 subtotal-section">
                                  <div className="flex justify-between items-center">
                                    <span className="text-lg font-semibold text-gray-900">
                                      Sub total {section.title}:
                                    </span>
                                    <span className="text-xl font-bold text-green-700">
                                      ${section.total.toLocaleString()}
                                    </span>
                                  </div>
                                </div>

                                {/* Running Total */}
                                <div className="mt-2 pt-2 border-t border-gray-100 subtotal-section">
                                  <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-600">
                                      Total to this point:
                                    </span>
                                    <span className="text-lg font-semibold text-blue-700">
                                      ${runningTotal.toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })
                        : null}

                      {/* Unassigned Products */}
                      {printOptions.products &&
                        data.unassignedProducts &&
                        data.unassignedProducts.length > 0 && (
                          <motion.div
                            style={{ order: printOptions.order.indexOf('products') + 1 || 2 }}
                            className="rounded-xl border border-gray-200 bg-white p-8 mb-6 print:shadow-none shadow-sm section-container"
                            variants={fadeInUp}
                            initial="initial"
                            animate="animate"
                            transition={{ delay: 0.2 }}
                          >
                            <div className="flex items-center justify-between mb-6">
                              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <div className="w-2 h-2 bg-orange-600 rounded-full no-print" />
                                <span>{visibleSections.length + 1}. Additional Products</span>
                              </h2>
                              <div className="text-sm text-gray-500 no-print">
                                {data.unassignedProducts.length} items
                              </div>
                            </div>

                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200 text-sm compact-table">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 print:bg-white">
                                  <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700 rounded-tl-lg">
                                      #
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                      Part Number
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                      Description
                                    </th>
                                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                                      Qty
                                    </th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-700">
                                      Unit Price
                                    </th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-700 rounded-tr-lg">
                                      Total
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {data.unassignedProducts.map((product, idx) => (
                                    <motion.tr
                                      key={product.id}
                                      className="hover:bg-gray-50 transition-colors duration-150 align-top"
                                      variants={fadeInUp}
                                      initial="initial"
                                      animate="animate"
                                      transition={{ delay: 0.05 * idx }}
                                    >
                                      <td className="px-4 py-4 text-gray-900 font-medium">
                                        {visibleSections.length + 1}.{idx + 1}
                                      </td>
                                      <td className="px-4 py-4 text-gray-700 font-mono text-xs break-all">
                                        <div>{product.productId}</div>
                                        <div className="text-gray-500 text-xs mt-1">
                                          SKU: {product.sku}
                                        </div>
                                      </td>
                                      <td className="px-4 py-4">
                                        <div className="text-gray-900 font-medium">
                                          {product.name}
                                        </div>
                                        {product.category && (
                                          <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 mt-1 no-print">
                                            {product.category}
                                          </div>
                                        )}
                                      </td>
                                      <td className="px-4 py-4 text-center">
                                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-900 font-semibold">
                                          {product.quantity}
                                        </span>
                                      </td>
                                      <td className="px-4 py-4 text-right text-gray-900 font-medium">
                                        ${product.unitPrice.toLocaleString()}
                                      </td>
                                      <td className="px-4 py-4 text-right font-bold text-green-700 text-lg">
                                        ${product.total.toLocaleString()}
                                      </td>
                                    </motion.tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>

                            {/* Unassigned Products Total */}
                            <div className="mt-4 pt-4 border-t border-gray-200 subtotal-section">
                              <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold text-gray-900">
                                  Additional Products Total:
                                </span>
                                <span className="text-xl font-bold text-green-700">
                                  $
                                  {data.unassignedProducts
                                    .reduce((sum, p) => sum + p.total, 0)
                                    .toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}

                      {/* Section Assignment (Step 5) */}
                      {printOptions.sectionAssignment &&
                        data.step5Sections &&
                        data.step5Sections.length > 0 && (
                          <motion.div
                            style={{
                              order: printOptions.order.indexOf('sectionAssignment') + 1 || 3,
                            }}
                            className="rounded-xl border border-gray-200 bg-white p-8 mb-6 print:shadow-none shadow-sm section-container"
                            variants={fadeInUp}
                            initial="initial"
                            animate="animate"
                            transition={{ delay: 0.35 }}
                          >
                            {(() => {
                              const sectionAssignmentNumber =
                                (visibleSections?.length || 0) +
                                (data.unassignedProducts && data.unassignedProducts.length > 0
                                  ? 1
                                  : 0) +
                                1;
                              return (
                                <div className="flex items-center justify-between mb-4">
                                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <div className="w-2 h-2 bg-indigo-600 rounded-full no-print" />
                                    <span>{sectionAssignmentNumber}. Section Assignment</span>
                                  </h2>
                                  <div className="text-sm text-gray-500 no-print">
                                    {data.step5Sections.length} sections
                                  </div>
                                </div>
                              );
                            })()}

                            <div className="space-y-3">
                              {data.step5Sections
                                .sort((a, b) => (a.order || 0) - (b.order || 0))
                                .map((s, idx) => (
                                  <div key={s.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                      <div className="font-medium text-gray-900">
                                        {idx + 1}. {s.title}
                                      </div>
                                      <div className="text-xs text-gray-500">Order: {s.order}</div>
                                    </div>
                                    {s.content && (
                                      <p className="text-sm text-gray-700 mt-2">{s.content}</p>
                                    )}
                                  </div>
                                ))}
                            </div>
                          </motion.div>
                        )}

                      {/* Legacy Products Section (for backward compatibility) */}
                      {printOptions.products &&
                        data.products &&
                        data.products.length > 0 &&
                        (!data.sections || data.sections.length === 0) && (
                          <motion.div
                            className="rounded-xl border border-gray-200 bg-white p-8 mb-6 print:shadow-none shadow-sm section-container"
                            variants={fadeInUp}
                            initial="initial"
                            animate="animate"
                            transition={{ delay: 0.2 }}
                          >
                            <div className="flex items-center justify-between mb-6">
                              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-600 rounded-full" />
                                Selected Products
                              </h2>
                              <div className="text-sm text-gray-500 no-print">
                                {data.products.length} items • {productsSummary.categories.size}{' '}
                                categories
                              </div>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200 text-sm compact-table">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 print:bg-white">
                                  <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700 rounded-tl-lg">
                                      #
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                      Part Number
                                    </th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-700">
                                      Description
                                    </th>
                                    <th className="px-4 py-3 text-center font-semibold text-gray-700">
                                      Qty
                                    </th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-700">
                                      Unit Price
                                    </th>
                                    <th className="px-4 py-3 text-right font-semibold text-gray-700 rounded-tr-lg">
                                      Total
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {data.products.map((p: any, idx: number) => {
                                    const lineTotal = p.totalPrice ?? p.quantity * p.unitPrice;
                                    return (
                                      <motion.tr
                                        key={p.id}
                                        className="hover:bg-gray-50 transition-colors duration-150 align-top"
                                        variants={fadeInUp}
                                        initial="initial"
                                        animate="animate"
                                        transition={{ delay: 0.1 * idx }}
                                      >
                                        <td className="px-4 py-4 text-gray-900 font-medium">
                                          {idx + 1}
                                        </td>
                                        <td className="px-4 py-4 text-gray-700 font-mono text-xs break-all">
                                          {p.id}
                                        </td>
                                        <td className="px-4 py-4">
                                          <div className="text-gray-900 font-medium">{p.name}</div>
                                          {p.category && (
                                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 mt-1 no-print">
                                              {p.category}
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-900 font-semibold">
                                            {p.quantity}
                                          </span>
                                        </td>
                                        <td className="px-4 py-4 text-right text-gray-900 font-medium">
                                          ${p.unitPrice.toLocaleString()}
                                        </td>
                                        <td className="px-4 py-4 text-right font-bold text-green-700 text-lg">
                                          ${lineTotal.toLocaleString()}
                                        </td>
                                      </motion.tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </motion.div>
                        )}

                      {/* Datasheet Selection Section */}
                      {availableDatasheets.length > 0 ? (
                        <div
                          className="no-print"
                          style={{
                            order: printOptions.productOrder.indexOf('datasheets') + 1 || 1,
                          }}
                        >
                          <CollapsibleDatasheetSection
                            datasheets={availableDatasheets}
                            selectedDatasheets={selectedDatasheets}
                            onToggleDatasheet={toggleDatasheet}
                            onSelectAllDatasheets={selectAllDatasheets}
                            onClearAllDatasheets={clearAllDatasheets}
                            onPreviewDatasheet={url => setPreviewDatasheet(url)}
                          />
                        </div>
                      ) : (
                        <motion.div
                          className="rounded-xl border border-gray-200 bg-gray-50 p-8 mb-6 print:shadow-none shadow-sm no-print"
                          variants={fadeInUp}
                          initial="initial"
                          animate="animate"
                          transition={{ delay: 0.3 }}
                        >
                          <div className="text-center">
                            <DocumentIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              No Datasheets Available
                            </h3>
                            <p className="text-sm text-gray-600">
                              None of the products in this proposal have datasheet URLs configured.
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              To include datasheets, add Network URLs to products in the Product
                              Management section.
                            </p>
                          </div>
                        </motion.div>
                      )}

                      {/* Selected Datasheets for Print (moved inside Products wrapper) */}
                      {selectedDatasheets.size > 0 && (
                        <PrintDatasheets
                          items={availableDatasheets
                            .filter(ds => selectedDatasheets.has(ds.productId))
                            .map(ds => ({
                              productName: ds.productName,
                              sku: ds.sku,
                              url: ds.datasheetPath,
                            }))}
                          onReady={() => setPrintReady(true)}
                        />
                      )}

                      {printOptions.totals && (
                        <motion.div
                          className="rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-8 mb-6 shadow-sm section-container"
                          variants={fadeInUp}
                          initial="initial"
                          animate="animate"
                          transition={{ delay: 0.4 }}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                Grand Total
                              </h3>
                              <div className="text-sm text-gray-600 no-print">
                                {productsSummary.totalItems} items • Avg: $
                                {productsSummary.avgPrice.toLocaleString()}/item
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold text-green-700">
                                ${totalAmount.toLocaleString()}
                              </div>
                              <div className="text-sm text-gray-600">
                                {data.totals?.currency || 'USD'}
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-green-200 no-print">
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-900">
                                {data.sections?.length || 0}
                              </div>
                              <div className="text-sm text-gray-600">Sections</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-900">
                                {productsSummary.totalItems}
                              </div>
                              <div className="text-sm text-gray-600">Total Qty</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-semibold text-gray-900">
                                {productsSummary.categories.size}
                              </div>
                              <div className="text-sm text-gray-600">Categories</div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Enhanced Terms and Conditions */}
                  {printOptions.terms && data.terms?.length ? (
                    <motion.div
                      className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm section-container"
                      variants={fadeInUp}
                      initial="initial"
                      animate="animate"
                      transition={{ delay: 0.4 }}
                    >
                      <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-600 rounded-full no-print" />
                        <span>
                          {(visibleSections?.length || 0) +
                            (data.unassignedProducts?.length ? 1 : 0) +
                            (data.step5Sections && data.step5Sections.length > 0 ? 1 : 0) +
                            1}
                          . Terms and Conditions
                        </span>
                      </h2>
                      <div className="space-y-6">
                        {data.terms.map((t, idx) => (
                          <motion.div
                            key={`${t.title}-${idx}`}
                            className="border-l-4 border-blue-200 pl-4 py-2"
                            variants={fadeInUp}
                            initial="initial"
                            animate="animate"
                            transition={{ delay: 0.1 * idx }}
                          >
                            <div className="font-semibold text-gray-900 mb-2">{t.title}</div>
                            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                              {t.content || 'No content specified'}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  ) : null}
                </div>
              </div>
            </AnimatePresence>
          )}
        </ProtectedRoute>
      </AuthProvider>

      {/* Datasheet Preview Modal */}
      {previewDatasheet && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-white rounded-lg w-full max-w-6xl h-5/6 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Datasheet Preview</h3>
              <Button variant="outline" size="sm" onClick={() => setPreviewDatasheet(null)}>
                <XMarkIcon className="h-4 w-4 mr-1" />
                Close
              </Button>
            </div>
            <div className="flex-1 p-4">
              <iframe
                src={`${previewDatasheet}#toolbar=1&navpanes=1&scrollbar=1&view=FitH`}
                className="w-full h-full border border-gray-300 rounded"
                title="Datasheet Preview"
                onError={e => {
                  console.error('Failed to load PDF in preview:', previewDatasheet);
                  // Show fallback message
                  const container = e.currentTarget.parentElement;
                  if (container) {
                    container.innerHTML = `
                      <div class="flex items-center justify-center h-full bg-gray-50 rounded">
                        <div class="text-center p-8">
                          <div class="text-gray-400 mb-4">📄</div>
                          <h3 class="text-lg font-semibold text-gray-700 mb-2">PDF Preview Unavailable</h3>
                          <p class="text-gray-600 mb-4">The PDF could not be loaded due to security restrictions.</p>
                          <a href="${previewDatasheet}" target="_blank" rel="noopener noreferrer"
                             class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            📄 Open in New Tab
                          </a>
                        </div>
                      </div>
                    `;
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </ClientLayoutWrapper>
  );
}
