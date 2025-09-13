'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ClientLayoutWrapper } from '@/components/layout/ClientLayoutWrapper';
import PrintDatasheets from '@/components/proposals/print/PrintDatasheets';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { Button } from '@/components/ui/forms/Button';
import { useApiClient } from '@/hooks/useApiClient';
import { CheckCircleIcon, DocumentIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
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
}

interface LoadingState {
  isLoading: boolean;
  isHydrating: boolean;
  hasError: boolean;
  errorMessage?: string;
}

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Loading skeleton component with shimmer animation
const SkeletonLoader = ({ className = '' }: { className?: string }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded ${className}`}
    style={{ animation: 'shimmer 1.5s ease-in-out infinite' }}
  />
);

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
  const [autoPrint, setAutoPrint] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedDatasheets, setSelectedDatasheets] = useState<Set<string>>(new Set());
  const [showDatasheetSelector, setShowDatasheetSelector] = useState<boolean>(false);
  const [previewDatasheet, setPreviewDatasheet] = useState<string | null>(null);
  const [printReady, setPrintReady] = useState<boolean>(false);
  const apiClient = useApiClient();

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

  // Handle datasheet selection
  const toggleDatasheet = (productId: string) => {
    setSelectedDatasheets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const selectAllDatasheets = () => {
    setSelectedDatasheets(new Set(availableDatasheets.map(ds => ds.productId)));
  };

  const clearAllDatasheets = () => {
    setSelectedDatasheets(new Set());
  };

  useEffect(() => {
    const loadProposalData = async () => {
      try {
        // First try to get proposal ID from URL params
        const urlParams = new URLSearchParams(window.location.search);
        const proposalId = urlParams.get('id');

        if (proposalId) {
          // Fetch from API
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
        console.error('Failed to load proposal data:', error);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadProposalData();
  }, [apiClient]);

  // Hydrate missing product names/prices for nicer preview (batch request)
  useEffect(() => {
    const hydrateProducts = async () => {
      // Only hydrate legacy products array for backward compatibility
      if (!data || !Array.isArray(data.products) || data.products.length === 0) return;
      const needsHydration = data.products.filter(
        (p: any) => !p?.name || p.name.toLowerCase() === 'unknown product' || !p.unitPrice
      );
      if (needsHydration.length === 0) return;

      const startTime = performance.now();
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
                <div className="max-w-4xl mx-auto">
                  {/* Header + Actions */}
                  <div className="mb-6 flex items-start justify-between gap-4 print:block proposal-header">
                    <div>
                      <div className="flex items-start justify-between mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 print:text-4xl">
                          {data.proposal.title}
                        </h1>
                        <div className="flex items-center gap-2 text-sm text-gray-500 print:hidden">
                          <CheckCircleIcon className="h-5 w-5 text-green-500" />
                          Ready to Preview
                        </div>
                      </div>
                      {data.proposal.description && (
                        <p className="mt-1 text-gray-700">{data.proposal.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 print:hidden">
                      <Button
                        type="button"
                        onClick={() => window.print()}
                        variant="primary"
                        aria-label="Print or save as PDF"
                        title="Print or save as PDF"
                      >
                        Print / Save PDF
                      </Button>
                    </div>
                  </div>

                  {/* Company / Contact */}
                  <motion.div
                    className="rounded-xl border border-gray-200 bg-white p-8 mb-6 print:shadow-none shadow-sm company-info"
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: 0.1 }}
                  >
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full" />
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
                        <span className="font-medium text-gray-500 min-w-[90px]">Description:</span>
                        <span className="text-gray-900">{data.proposal.description || '-'}</span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Sections with Products */}
                  {data.sections && data.sections.length > 0
                    ? data.sections
                        .filter(section => section.products.length > 0) // Only show sections with products
                        .map((section, sectionIdx) => {
                          // Calculate running total up to this section
                          const runningTotal =
                            data.sections
                              ?.slice(0, sectionIdx + 1)
                              .reduce((sum, s) => sum + s.total, 0) || 0;

                          return (
                            <motion.div
                              key={section.id}
                              className="rounded-xl border border-gray-200 bg-white p-8 mb-6 print:shadow-none shadow-sm section-container"
                              variants={fadeInUp}
                              initial="initial"
                              animate="animate"
                              transition={{ delay: 0.1 * sectionIdx }}
                            >
                              <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                  <div className="w-2 h-2 bg-purple-600 rounded-full" />
                                  {section.title}
                                </h2>
                                <div className="text-sm text-gray-500">
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
                                          {idx + 1}
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
                                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 mt-1">
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
                  {data.unassignedProducts && data.unassignedProducts.length > 0 && (
                    <motion.div
                      className="rounded-xl border border-gray-200 bg-white p-8 mb-6 print:shadow-none shadow-sm section-container"
                      variants={fadeInUp}
                      initial="initial"
                      animate="animate"
                      transition={{ delay: 0.2 }}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-600 rounded-full" />
                          Additional Products
                        </h2>
                        <div className="text-sm text-gray-500">
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
                                <td className="px-4 py-4 text-gray-900 font-medium">{idx + 1}</td>
                                <td className="px-4 py-4 text-gray-700 font-mono text-xs break-all">
                                  <div>{product.productId}</div>
                                  <div className="text-gray-500 text-xs mt-1">
                                    SKU: {product.sku}
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="text-gray-900 font-medium">{product.name}</div>
                                  {product.category && (
                                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 mt-1">
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

                  {/* Legacy Products Section (for backward compatibility) */}
                  {data.products &&
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
                          <div className="text-sm text-gray-500">
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
                                        <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 mt-1">
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
                    <motion.div
                      className="rounded-xl border border-gray-200 bg-white p-8 mb-6 print:shadow-none shadow-sm"
                      variants={fadeInUp}
                      initial="initial"
                      animate="animate"
                      transition={{ delay: 0.3 }}
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <DocumentIcon className="h-5 w-5 text-blue-600" />
                            Product Datasheets
                          </h2>
                          <p className="text-sm text-gray-600 mt-1">
                            Select datasheets to include in the PDF print (only products with
                            datasheet URLs are shown)
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={selectAllDatasheets}
                            className="print:hidden"
                          >
                            Select All
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearAllDatasheets}
                            className="print:hidden"
                          >
                            Clear All
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {availableDatasheets.map(datasheet => (
                          <div
                            key={datasheet.productId}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id={`datasheet-${datasheet.productId}`}
                                checked={selectedDatasheets.has(datasheet.productId)}
                                onChange={() => toggleDatasheet(datasheet.productId)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded print:hidden"
                              />
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">
                                  {datasheet.productName}
                                </div>
                                <div className="text-sm text-gray-500">SKU: {datasheet.sku}</div>
                                <div className="text-xs text-blue-600 mt-1 break-all">
                                  📄 {datasheet.datasheetPath}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPreviewDatasheet(datasheet.datasheetPath)}
                                className="print:hidden"
                              >
                                <EyeIcon className="h-4 w-4 mr-1" />
                                Preview
                              </Button>
                              <span className="text-sm text-gray-500">
                                {selectedDatasheets.has(datasheet.productId)
                                  ? 'Selected'
                                  : 'Not selected'}
                              </span>
                              <DocumentIcon className="h-4 w-4 text-gray-400" />
                            </div>
                          </div>
                        ))}
                      </div>

                      {selectedDatasheets.size > 0 && (
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center gap-2 text-blue-800">
                            <DocumentIcon className="h-4 w-4" />
                            <span className="font-medium">
                              {selectedDatasheets.size} datasheet
                              {selectedDatasheets.size !== 1 ? 's' : ''} selected
                            </span>
                          </div>
                          <p className="text-sm text-blue-700 mt-1">
                            Selected datasheets will be included as additional pages in the PDF
                            print.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      className="rounded-xl border border-gray-200 bg-gray-50 p-8 mb-6 print:shadow-none shadow-sm"
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

                  {/* Enhanced Grand Total Section */}
                  <motion.div
                    className="rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-8 mb-6 shadow-sm"
                    variants={fadeInUp}
                    initial="initial"
                    animate="animate"
                    transition={{ delay: 0.4 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Grand Total</h3>
                        <div className="text-sm text-gray-600">
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

                    {/* Additional metrics */}
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-green-200">
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

                  {/* Selected Datasheets for Print */}
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

                  {/* Enhanced Terms and Conditions */}
                  {data.terms?.length ? (
                    <motion.div
                      className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm"
                      variants={fadeInUp}
                      initial="initial"
                      animate="animate"
                      transition={{ delay: 0.4 }}
                    >
                      <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-600 rounded-full" />
                        Terms and Conditions
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
