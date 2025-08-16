'use client';

import { useApiClient } from '@/hooks/useApiClient';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useEffect, useMemo, useState, useCallback, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DocumentIcon, 
  PrinterIcon, 
  ShareIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowDownTrayIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
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
  products: Array<{
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
  exit: { opacity: 0, y: -20 }
};

const staggerChildren = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Loading skeleton component with shimmer animation
const SkeletonLoader = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%] rounded ${className}`} 
       style={{ animation: 'shimmer 1.5s ease-in-out infinite' }} />
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
  const apiClient = useApiClient();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('proposal-preview-data');
      if (!raw) {
        setData(null);
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
        const productsOk = Array.isArray(obj.products);
        const totalsOk = !!obj.totals && typeof obj.totals === 'object';
        const termsOk = Array.isArray(obj.terms);
        return companyOk && proposalOk && productsOk && totalsOk && termsOk;
      };
      if (isPreviewData(parsed)) {
        setData(parsed);
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    }
  }, []);

  // Hydrate missing product names/prices for nicer preview (batch request)
  useEffect(() => {
    const hydrateProducts = async () => {
      if (!data || !Array.isArray(data.products) || data.products.length === 0) return;
      const needsHydration = data.products.filter(
        p => !p?.name || p.name.toLowerCase() === 'unknown product' || !p.unitPrice
      );
      if (needsHydration.length === 0) return;

      const startTime = performance.now();
      try {
        const ids = needsHydration.map(p => p.id).join(',');
        type BatchProduct = { id: string; name?: string; price?: number; currency?: string };
        const res = await apiClient.get<{ success?: boolean; data?: Array<BatchProduct>; meta?: any }>(
          `/api/products?ids=${encodeURIComponent(ids)}&fields=id,name,price,currency`
        );
        const list: Array<BatchProduct> = (res as any)?.data ?? (res as unknown as Array<BatchProduct>);
        const byId = new Map<string, BatchProduct>();
        for (const item of list || []) byId.set(item.id, item);

        const updated = data.products.map(prod => {
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
    if (autoPrint && data) {
      setTimeout(() => window.print(), 300);
    }
  }, [autoPrint, data]);

  const totalAmount = useMemo(() => {
    if (!data?.products) return 0;
    return data.products.reduce(
      (sum, p) => sum + (p.totalPrice || p.quantity * p.unitPrice),
      0
    );
  }, [data]);

  const productsSummary = useMemo(() => {
    if (!data?.products) return { totalItems: 0, categories: new Set(), avgPrice: 0 };
    const categories = new Set(data.products.map(p => p.category).filter(Boolean));
    const totalItems = data.products.reduce((sum, p) => sum + p.quantity, 0);
    const avgPrice = totalAmount / (totalItems || 1);
    return { totalItems, categories, avgPrice };
  }, [data, totalAmount]);

  if (!data) {
    return (
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
    );
  }

  return (
    <AnimatePresence>
      <div className="min-h-screen bg-gray-50 p-6 print:p-0 print:bg-white">
        <div className="max-w-4xl mx-auto">
          {/* Header + Actions */}
          <div className="mb-6 flex items-start justify-between gap-4 print:block">
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
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                aria-label="Print or save as PDF"
                title="Print or save as PDF"
              >
                Print / Save PDF
              </button>
            </div>
          </div>

          {/* Company / Contact */}
          <motion.div 
            className="rounded-xl border border-gray-200 bg-white p-8 mb-6 print:shadow-none shadow-sm"
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
                <span className="font-medium">Industry:</span> {data.company.industry || '-'}
              </div>
              <div>
                <span className="font-medium">Contact Person:</span>{' '}
                {data.company.contactPerson || '-'}
              </div>
              <div>
                <span className="font-medium">Email:</span> {data.company.contactEmail || '-'}
              </div>
              <div>
                <span className="font-medium">Phone:</span> {data.company.contactPhone || '-'}
              </div>
              <div>
                <span className="font-medium">RFP Ref:</span>{' '}
                {data.proposal.rfpReferenceNumber || '-'}
              </div>
              <div>
                <span className="font-medium">Due Date:</span>{' '}
                {data.proposal.dueDate ? new Date(data.proposal.dueDate).toLocaleDateString() : '-'}
              </div>
              <div className="flex items-start gap-3">
                <span className="font-medium text-gray-500 min-w-[90px]">Description:</span>
                <span className="text-gray-900">{data.proposal.description || '-'}</span>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Products Section */}
          <motion.div 
            className="rounded-xl border border-gray-200 bg-white p-8 mb-6 print:shadow-none shadow-sm"
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
                {data.products?.length || 0} items • {productsSummary.categories.size} categories
              </div>
            </div>
              {data.products?.length ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100 print:bg-white">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700 rounded-tl-lg">#</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Part Number</th>
                      <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
                      <th className="px-4 py-3 text-center font-semibold text-gray-700">Qty</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700">Unit Price</th>
                      <th className="px-4 py-3 text-right font-semibold text-gray-700 rounded-tr-lg">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {data.products.map((p, idx) => {
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
                          <td className="px-4 py-4 text-gray-900 font-medium">{idx + 1}</td>
                          <td className="px-4 py-4 text-gray-700 font-mono text-xs break-all">{p.id}</td>
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
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <DocumentIcon className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-500">No products selected for this proposal.</p>
              </div>
            )}
          </motion.div>

          {/* Enhanced Totals Section */}
          <motion.div 
            className="rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-8 mb-6 shadow-sm"
            variants={fadeInUp}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Proposal Total</h3>
                <div className="text-sm text-gray-600">
                  {productsSummary.totalItems} items • Avg: ${productsSummary.avgPrice.toLocaleString()}/item
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
                <div className="text-lg font-semibold text-gray-900">{data.products?.length || 0}</div>
                <div className="text-sm text-gray-600">Products</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{productsSummary.totalItems}</div>
                <div className="text-sm text-gray-600">Total Qty</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">{productsSummary.categories.size}</div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
            </div>
          </motion.div>

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
  );
}
