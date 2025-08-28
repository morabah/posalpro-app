'use client';

/**
 * CRITICAL FIX: React Hooks Order Violation
 * User Story: US-3.2 (Proposal Management)
 * Hypothesis: H4 (Cross-Department Coordination)
 *
 * ✅ FIXES: "Rendered more hooks than during the previous render" error
 * ✅ FOLLOWS: Strict Rules of Hooks - ALL hooks at top level
 * ✅ PREVENTS: Conditional hooks and unstable dependencies
 */

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useApiClient } from '@/hooks/useApiClient';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { useProposal } from '@/hooks/useProposal';
import { logDebug, logError, logInfo } from '@/lib/logger';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Download, Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ProposalPreviewPageProps {
  params: Promise<{ id: string }>;
}

function ProposalPreviewContent({ proposalId }: { proposalId: string }) {
  // ✅ CRITICAL: ALL HOOKS MUST BE AT TOP LEVEL - NO CONDITIONAL LOGIC BEFORE THIS

  // Core hooks - always called in same order
  const analytics = useOptimizedAnalytics();
  const router = useRouter();
  const apiClient = useApiClient();
  const { data: proposal, isLoading, error } = useProposal(proposalId, {
    staleTime: 0,
    refetchOnMount: true,
  });

  const [isExportingPDF, setIsExportingPDF] = useState(false);

  // Stable effects - only depend on primitive values
  useEffect(() => {
    logDebug('Proposal preview page loaded', {
      component: 'ProposalPreviewPage',
      operation: 'page_load',
      proposalId,
      userStory: 'US-3.2',
      hypothesis: 'H4',
    });

    analytics.trackOptimized('proposal_preview_viewed', {
      proposalId,
      userStory: 'US-3.2',
      hypothesis: 'H4',
    });
  }, [analytics, proposalId]); // ✅ Only stable primitives

  // Mount-only hydration effect
  useEffect(() => {
    const hydrateProducts = async () => {
      if (!proposal || !Array.isArray(proposal.products) || proposal.products.length === 0) return;

      const needsHydration = proposal.products.filter(
        (p: any) => !p?.product?.name || p.product?.name?.toLowerCase() === 'unknown product'
      );

      if (needsHydration.length === 0) return;

      try {
        const ids = needsHydration.map((p: any) => p.productId).join(',');
        const res = await apiClient.get<{ items?: any[]; data?: any[] }>(
          `/api/products?ids=${encodeURIComponent(ids)}&fields=id,name,sku`
        );

        const list = (res as any)?.data ?? (res as unknown as any[]);
        const byId = new Map<string, any>();
        for (const item of list || []) byId.set(item.id, item);

        const cacheKey = `proposal-preview-${proposalId}`;
        const cacheData = {
          company: {
            name: proposal.customer?.name || 'Company Name',
            industry: (proposal.customer as any)?.industry || 'Industry',
            contactEmail: proposal.customer?.email || 'contact@example.com',
          },
          proposal: {
            title: proposal.title || 'Proposal Title',
            description: proposal.description || 'Proposal description',
            dueDate: proposal.dueDate,
            priority: proposal.priority,
          },
          products: proposal.products.map((p: any) => ({
            id: p.productId,
            name: byId.get(p.productId)?.name || p.product?.name || 'Unknown Product',
            quantity: p.quantity,
            unitPrice: p.unitPrice,
            totalPrice: p.total,
            category: byId.get(p.productId)?.category || 'General',
          })),
          totals: { currency: proposal.currency || 'USD', amount: 0 },
          terms: [],
        };

        localStorage.setItem(cacheKey, JSON.stringify(cacheData));

        logInfo('Product hydration completed', {
          component: 'ProposalPreviewPage',
          operation: 'hydrate_products',
          proposalId,
          hydratedCount: needsHydration.length,
        });
      } catch {
        // Hydration errors are non-critical
      }
    };

    hydrateProducts();
  }, [proposalId, apiClient]); // ✅ Only stable primitives

  // Stable callbacks - no dynamic dependencies
  const handlePrint = useCallback(() => {
    logInfo('Print proposal triggered', {
      component: 'ProposalPreviewPage',
      operation: 'print_proposal',
      proposalId,
      userStory: 'US-3.2',
      hypothesis: 'H4',
    });

    analytics.trackOptimized('proposal_print_initiated', {
      proposalId,
      userStory: 'US-3.2',
      hypothesis: 'H4',
    });

    window.print();
    toast.success('Print dialog opened');
  }, [analytics, proposalId]);

  const handleDownloadPDF = useCallback(async () => {
    if (!proposal) return;

    try {
      setIsExportingPDF(true);

      analytics.trackOptimized('proposal_pdf_export_started', {
        proposalId,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      const html2pdf = (await import('html2pdf.js')).default;

      const targetElement = document.getElementById('proposal-content');
      if (!targetElement) {
        throw new Error('Proposal content not found');
      }

      const clone = targetElement.cloneNode(true) as HTMLElement;

      clone.style.backgroundColor = 'white';
      clone.style.color = 'black';
      clone.style.fontFamily = 'Arial, sans-serif';
      clone.style.padding = '20px';
      clone.style.margin = '0';

      const elementsToHide = clone.querySelectorAll(
        'button, .no-print, [data-no-print], .sticky, .fixed'
      );
      elementsToHide.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });

      const pdfOptions = {
        margin: [10, 10, 10, 10],
        filename: `posalpro-proposal-${proposalId}-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
        },
        jsPDF: {
          unit: 'mm',
          format: 'a4',
          orientation: 'portrait',
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
      };

      await html2pdf().from(clone).set(pdfOptions).save();

      analytics.trackOptimized('proposal_pdf_export_success', {
        proposalId,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      toast.success('PDF downloaded successfully!');
    } catch (error) {
      logError('PDF export failed', {
        component: 'ProposalPreviewPage',
        operation: 'download_pdf',
        proposalId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      analytics.trackOptimized('proposal_pdf_export_error', {
        proposalId,
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  }, [proposal, proposalId, analytics]);

  const handleBack = useCallback(() => {
    router.push(`/proposals/${proposalId}`);
  }, [router, proposalId]);

  // ✅ EARLY RETURNS - After all hooks are defined
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading proposal preview...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <Printer className="h-12 w-12 mx-auto" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to load proposal</h2>
          <p className="text-gray-600 mb-4">{error?.message || 'Proposal not found'}</p>
          <Button onClick={handleBack} variant="outline">
            Back to Proposal
          </Button>
        </div>
      </div>
    );
  }

  // ✅ DERIVED VALUES - After early returns, NO MORE HOOKS
  const getProductData = (metadata: any) => {
    if (!metadata?.productData) return null;
    return {
      products: Array.isArray(metadata.productData.products) ? metadata.productData.products : [],
      totalValue: metadata.productData.totalValue || 0,
    };
  };

  const getTeamData = (metadata: any) => {
    if (!metadata?.teamData) return null;
    return {
      teamLead: metadata.teamData.teamLead || null,
      salesRepresentative: metadata.teamData.salesRepresentative || null,
      subjectMatterExperts: metadata.teamData.subjectMatterExperts || {},
      executiveReviewers: Array.isArray(metadata.teamData.executiveReviewers)
        ? metadata.teamData.executiveReviewers
        : [],
    };
  };

  const getSectionData = (metadata: any) => {
    if (!metadata?.sectionData) return null;
    return {
      sections: Array.isArray(metadata.sectionData.sections) ? metadata.sectionData.sections : [],
    };
  };

  const calculateTotal = (proposal: any) => {
    if (proposal?.products?.length > 0) {
      return proposal.products.reduce((sum: number, product: any) => sum + (product.total || 0), 0);
    }

    const productData = getProductData(proposal?.metadata);
    if (productData?.products?.length > 0) {
      return productData!.products.reduce((sum: number, product: any) => sum + (product.total || 0), 0);
    }

    return 0;
  };

  const getProducts = (proposal: any) => {
    if (proposal?.products?.length > 0) {
      return proposal.products;
    }

    const productData = getProductData(proposal?.metadata);
    return productData?.products || [];
  };

  const products = getProducts(proposal);
  const totalValue = calculateTotal(proposal);
  const teamData = getTeamData(proposal?.metadata);
  const sectionData = getSectionData(proposal?.metadata);

  // Summary calculation - pure functions only
  const productsSummary = {
    totalItems: products?.reduce((sum: number, p: any) => sum + (p.quantity || 1), 0) || 0,
    categories: new Set(products?.map((p: any) => p.product?.category || p.category).filter(Boolean) || []),
    avgPrice: products?.length ? totalValue / products.reduce((sum: number, p: any) => sum + (p.quantity || 1), 0) : 0,
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Action Bar - Hidden in print */}
      <div className="bg-gray-50 border-b border-gray-200 p-4 no-print print:hidden">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button onClick={handleBack} variant="outline" size="sm">
              ← Back to Proposal
            </Button>
            <div className="text-sm text-gray-600">
              Preview Mode - This page is optimized for printing
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button
              onClick={handleDownloadPDF}
              variant="primary"
              size="sm"
              disabled={isExportingPDF}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExportingPDF ? 'Exporting...' : 'Save as PDF'}
            </Button>
          </div>
        </div>
      </div>

      {/* Proposal Content - Main container for PDF export */}
      <div id="proposal-content" className="max-w-4xl mx-auto p-8 proposal-content">
        {/* Header */}
        <div className="proposal-header bg-gray-50 -mx-8 -mt-8 px-8 py-6 mb-8 border-b-2 border-blue-600">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">PROPOSAL</h1>
              <div className="text-lg text-gray-600">
                Proposal #{proposal.id?.slice(-8) || 'N/A'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {formatCurrency(totalValue)}
              </div>
              <div className="text-sm text-gray-600">Total Value</div>
              <Badge className="mt-2 bg-blue-100 text-blue-800">
                {proposal?.status ? proposal.status.replace('_', ' ') : 'Draft'}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Proposal Details</h3>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Title:</strong> {proposal.title || 'N/A'}
                </div>
                <div>
                  <strong>Description:</strong> {proposal?.description || 'N/A'}
                </div>
                <div>
                  <strong>Priority:</strong> {proposal?.priority || 'N/A'}
                </div>
                <div>
                  <strong>Currency:</strong> {proposal?.currency || 'USD'}
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Dates & Validity</h3>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Created:</strong>{' '}
                  {proposal?.createdAt ? formatDate(proposal.createdAt) : 'N/A'}
                </div>
                <div>
                  <strong>Due Date:</strong>{' '}
                  {proposal?.dueDate ? formatDate(proposal.dueDate) : 'N/A'}
                </div>
                <div>
                  <strong>Valid Until:</strong>{' '}
                  {proposal?.dueDate ? formatDate(proposal.dueDate) : 'N/A'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Information */}
        {proposal?.customer && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Information</h2>
            <Card className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Company Details</h3>
                  <div className="space-y-1 text-sm">
                    <div>
                      <strong>Name:</strong> {proposal.customer.name || 'N/A'}
                    </div>
                    <div>
                      <strong>Email:</strong> {proposal.customer.email || 'N/A'}
                    </div>
                    <div>
                      <strong>Phone:</strong> {(proposal.customer as any).phone || 'N/A'}
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Address</h3>
                  <div className="space-y-1 text-sm">
                    <div>{(proposal.customer as any).address || 'N/A'}</div>
                    <div>
                      {(proposal.customer as any).city && (proposal.customer as any).state
                        ? `${(proposal.customer as any).city}, ${(proposal.customer as any).state}`
                        : 'N/A'}
                    </div>
                    <div>{(proposal.customer as any).zipCode || ''}</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Enhanced Products Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Products & Services</h2>

          {products.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full products-table divide-y divide-gray-200 text-sm">
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
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">Qty</th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-right font-semibold text-gray-700 rounded-tr-lg">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((product: any, index: number) => {
                    const lineTotal = product.total ?? product.quantity * product.unitPrice;
                    return (
                      <tr
                        key={product.id || index}
                        className="hover:bg-gray-50 transition-colors duration-150 align-top"
                      >
                        <td className="px-4 py-4 text-gray-900 font-medium">{index + 1}</td>
                        <td className="px-4 py-4 text-gray-700 font-mono text-xs break-all">
                          {product.productId || product.id}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-gray-900 font-medium">
                            {product.product?.name || product.name || 'N/A'}
                          </div>
                          {product.product?.sku && (
                            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800 mt-1">
                              SKU: {product.product.sku}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-900 font-semibold">
                            {product.quantity || 1}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right text-gray-900 font-medium">
                          ${product.unitPrice.toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-right font-bold text-green-700 text-lg">
                          ${lineTotal.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-gray-600">No products or services specified in this proposal.</p>
            </Card>
          )}
        </div>

        {/* Enhanced Totals Section */}
        <div className="rounded-xl border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-8 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Proposal Total</h3>
              <div className="text-sm text-gray-600">
                {productsSummary.totalItems} items • {productsSummary.categories.size} categories •
                Avg: ${productsSummary.avgPrice.toLocaleString()}/item
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-700">
                ${totalValue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">{proposal?.currency || 'USD'}</div>
            </div>
          </div>

          {/* Additional metrics */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-green-200">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {products.length}
              </div>
              <div className="text-sm text-gray-600">Products</div>
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
        </div>

        {/* Team Information */}
        {teamData && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Team & Contacts</h2>
            <div className="grid grid-cols-2 gap-6">
              {teamData.teamLead && (
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Team Lead</h3>
                  <div className="text-sm">
                    <div>
                      <strong>Name:</strong> {teamData.teamLead.name || 'N/A'}
                    </div>
                    <div>
                      <strong>Email:</strong> {teamData.teamLead.email || 'N/A'}
                    </div>
                  </div>
                </Card>
              )}
              {teamData.salesRepresentative && (
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Sales Representative</h3>
                  <div className="text-sm">
                    <div>
                      <strong>Name:</strong> {teamData.salesRepresentative.name || 'N/A'}
                    </div>
                    <div>
                      <strong>Email:</strong> {teamData.salesRepresentative.email || 'N/A'}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Sections */}
        {sectionData?.sections && sectionData.sections.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Additional Sections</h2>
            <div className="space-y-6">
              {sectionData.sections.map((section: any, index: number) => (
                <Card key={index} className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {section.title || `Section ${index + 1}`}
                  </h3>
                  {section.content && (
                    <div className="prose prose-sm max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: section.content }} />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t-2 border-gray-300">
          <div className="text-center text-sm text-gray-600 space-y-2">
            <div>
              <strong>Valid for 30 days from the date of this proposal</strong>
            </div>
            <div>Payment terms: Net 30 days</div>
            <div>This proposal is confidential and intended solely for the addressee</div>
            <div className="mt-4 text-xs">
              Generated by PosalPro - Professional Proposal Management System
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Print Styles - Leveraging existing patterns */}
      <style jsx global>{`
        @media print {
          @page {
            margin: 0.75in;
            size: A4;
          }

          .no-print {
            display: none !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:bg-white {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .print\\:shadow-none {
            box-shadow: none !important;
          }

          body {
            font-size: 12pt;
            line-height: 1.4;
            color: black;
          }

          h1 { font-size: 24pt; margin-bottom: 12pt; }
          h2 { font-size: 18pt; margin-bottom: 10pt; }
          h3 { font-size: 16pt; margin-bottom: 8pt; }

          table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 20pt;
          }

          th, td {
            border: 1pt solid #ddd;
            padding: 6pt;
            text-align: left;
          }

          th {
            background-color: #f5f5f5 !important;
            font-weight: bold;
          }

          .break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }

          .total-section {
            border: 2pt solid #28a745;
            padding: 12pt;
            margin: 20pt 0;
            background-color: #f8f9fa !important;
          }

          .terms-section {
            margin-top: 30pt;
            page-break-before: avoid;
          }

          .section-spacing {
            margin-bottom: 20pt;
          }

          .print-header {
            border-bottom: 2pt solid #333;
            padding-bottom: 10pt;
            margin-bottom: 20pt;
          }

          .proposal-content {
            max-width: none !important;
            margin: 0 !important;
            padding: 20pt !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function ProposalPreviewPage({ params }: ProposalPreviewPageProps) {
  const [proposalId, setProposalId] = useState<string>('');

  useEffect(() => {
    const loadParams = async () => {
      try {
        const resolvedParams = await params;
        setProposalId(resolvedParams.id);
      } catch (error) {
        logError('Failed to load preview params', {
          component: 'ProposalPreviewPage',
          operation: 'page_load',
          error: error instanceof Error ? error.message : 'Unknown error',
          userStory: 'US-3.2',
          hypothesis: 'H4',
        });
      }
    };

    loadParams();
  }, [params]);

  if (!proposalId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading preview...</p>
        </div>
      </div>
    );
  }

  return <ProposalPreviewContent proposalId={proposalId} />;
}
