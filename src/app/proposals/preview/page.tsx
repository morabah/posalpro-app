'use client';

import { useEffect, useMemo, useState } from 'react';
import { useApiClient } from '@/hooks/useApiClient';

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

export default function ProposalPreviewPage() {
  const [data, setData] = useState<PreviewData | null>(null);
  const [autoPrint, setAutoPrint] = useState(false);
  const apiClient = useApiClient();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('proposal-preview-data');
      if (raw) setData(JSON.parse(raw));
    } catch {
      setData(null);
    }
  }, []);

  // Hydrate missing product names/prices for nicer preview
  useEffect(() => {
    const hydrateProducts = async () => {
      if (!data || !Array.isArray(data.products) || data.products.length === 0) return;
      const needsHydration = data.products.filter(
        p => !p?.name || p.name.toLowerCase() === 'unknown product' || !p.unitPrice
      );
      if (needsHydration.length === 0) return;

      try {
        const updated = [...data.products];
        await Promise.all(
          needsHydration.map(async p => {
            try {
              const res = await apiClient.get<any>(`/api/products/${p.id}`);
              const prod = (res?.data || res) as { id?: string; name?: string; price?: number; description?: string };
              const idx = updated.findIndex(x => x.id === p.id);
              if (idx >= 0 && prod) {
                updated[idx] = {
                  ...updated[idx],
                  name: prod.name || updated[idx].name,
                  unitPrice: typeof prod.price === 'number' ? prod.price : updated[idx].unitPrice,
                  totalPrice:
                    updated[idx].totalPrice ?? (updated[idx].quantity || 1) * (typeof prod.price === 'number' ? prod.price : updated[idx].unitPrice),
                };
              }
            } catch {
              // ignore hydration errors per item
            }
          })
        );
        setData(prev => (prev ? { ...prev, products: updated } : prev));
      } catch {
        // ignore hydration errors
      }
    };
    hydrateProducts();
  }, [data, apiClient]);

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
    if (!data) return 0;
    if (data.totals?.amount) return data.totals.amount;
    return (data.products || []).reduce(
      (sum, p) => sum + (p.totalPrice ?? p.quantity * p.unitPrice),
      0
    );
  }, [data]);

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
    <div className="min-h-screen bg-gray-50 px-6 py-8 print:bg-white">
      <div className="max-w-4xl mx-auto">
        {/* Header + Actions */}
        <div className="mb-6 flex items-start justify-between gap-4 print:block">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{data.proposal.title}</h1>
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
        <div className="rounded-lg border border-gray-200 bg-white p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700">
            <div>
              <span className="font-medium">Company:</span> {data.company.name || '-'}
            </div>
            <div>
              <span className="font-medium">Industry:</span> {data.company.industry || '-'}
            </div>
            <div>
              <span className="font-medium">Contact Person:</span> {data.company.contactPerson || '-'}
            </div>
            <div>
              <span className="font-medium">Email:</span> {data.company.contactEmail || '-'}
            </div>
            <div>
              <span className="font-medium">Phone:</span> {data.company.contactPhone || '-'}
            </div>
            <div>
              <span className="font-medium">RFP Ref:</span> {data.proposal.rfpReferenceNumber || '-'}
            </div>
            <div>
              <span className="font-medium">Due Date:</span>{' '}
              {data.proposal.dueDate ? new Date(data.proposal.dueDate).toLocaleDateString() : '-'}
            </div>
            <div>
              <span className="font-medium">Priority:</span> {data.proposal.priority || '-'}
            </div>
          </div>
        </div>

        {/* Products - tabular layout per requested order */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 mb-6 print:shadow-none">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Selected Products</h2>
          {data.products?.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50 print:bg-white">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">No</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Product Part number</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700">Product description</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">Qty</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">Unit price</th>
                    <th className="px-3 py-2 text-right font-medium text-gray-700">Total price</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {data.products.map((p, idx) => {
                    const lineTotal = p.totalPrice ?? p.quantity * p.unitPrice;
                    return (
                      <tr key={p.id} className="align-top">
                        <td className="px-3 py-2 text-gray-900">{idx + 1}</td>
                        <td className="px-3 py-2 text-gray-900 break-all">{p.id}</td>
                        <td className="px-3 py-2 text-gray-900">{p.name}</td>
                        <td className="px-3 py-2 text-right text-gray-900">{p.quantity}</td>
                        <td className="px-3 py-2 text-right text-gray-900">${p.unitPrice.toLocaleString()}</td>
                        <td className="px-3 py-2 text-right font-semibold text-gray-900">${lineTotal.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600 text-sm">No products selected.</p>
          )}
        </div>

        {/* Totals */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 mb-6">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-green-600">
              ${totalAmount.toLocaleString()} {data.totals?.currency || 'USD'}
            </span>
          </div>
        </div>

        {/* Terms and Conditions */}
        {data.terms?.length ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Terms and Conditions</h2>
            <div className="space-y-4">
              {data.terms.map((t, idx) => (
                <div key={`${t.title}-${idx}`}>
                  <div className="font-medium text-gray-900">{t.title}</div>
                  <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                    {t.content || '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
