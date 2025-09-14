/**
 * Server-side PDF generation for Proposal Preview
 * Renders the existing preview page with print styles and streams a PDF.
 *
 * This uses dynamic imports for puppeteer-core and @sparticuz/chromium so
 * the route does not crash if dependencies are not installed. In that case,
 * it returns 501 with setup instructions.
 */

import { proposalService } from '@/lib/services/proposalService';
import { buildStrictHtml, escapeHtml } from '@/server/pdf/strictTemplate';
import {
  getTemplateInfo,
  isTemplateAvailable,
  TEMPLATE_REGISTRY,
} from '@/server/pdf/templateRegistry';
import { NextRequest } from 'next/server';

function getIdFromPath(req: NextRequest): string | null {
  const parts = new URL(req.url).pathname.split('/').filter(Boolean);
  const idx = parts.indexOf('proposals');
  const id = idx >= 0 ? parts[idx + 1] : undefined;
  return id || null;
}

function getOrigin(req: NextRequest): string {
  const url = new URL(req.url);
  const proto = req.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || url.host;
  return `${proto}://${host}`;
}

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const id = getIdFromPath(req);
  if (!id) {
    return new Response(JSON.stringify({ ok: false, message: 'Missing proposal id' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const urlObj = new URL(req.url);
  const sp = urlObj.searchParams;
  const template = sp.get('template') || 'preview';

  // Validate template availability
  if (!isTemplateAvailable(template)) {
    const templateInfo = getTemplateInfo(template);
    const availableTemplates = Object.keys(TEMPLATE_REGISTRY).filter(id => isTemplateAvailable(id));

    return new Response(
      JSON.stringify({
        ok: false,
        code: 'TEMPLATE_NOT_AVAILABLE',
        message: `Template '${template}' is not available`,
        hint: templateInfo ? templateInfo.description : 'Template not found',
        availableTemplates,
      }),
      {
        status: 400,
        headers: { 'content-type': 'application/json' },
      }
    );
  }

  const isStrict = template === 'strict' || sp.get('strict') === '1' || sp.get('mode') === 'strict';

  try {
    // Compose preview URL and capture cookies
    const origin = getOrigin(req);
    const previewUrl = `${origin}/proposals/preview?id=${encodeURIComponent(id)}`;
    const cookieHeader = req.headers.get('cookie') || '';

    // Helper to call the Netlify PDF function
    async function renderPdfViaFunction(payload: Record<string, any>): Promise<Uint8Array> {
      const url = `${origin}/.netlify/functions/pdf`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`PDF function failed: ${res.status} ${text}`);
      }
      return new Uint8Array(await res.arrayBuffer());
    }

    if (isStrict) {
      // Strict server-rendered PDF (bypass UI)
      const orderParam = sp.get('order') || '';
      const order = orderParam
        .split(',')
        .map(s => s.trim())
        .filter(Boolean) as any;

      // Parse productOrder parameter (for arranging content within products section)
      const productOrderParam = sp.get('productOrder') || '';
      const productOrder = productOrderParam
        .split(',')
        .map(s => s.trim())
        .filter(Boolean) as ('tables' | 'datasheets' | 'totals')[];

      const include = {
        header: sp.get('header') !== '0',
        footer: sp.get('footer') !== '0',
        company: sp.get('company') !== '0' || order.includes('company'),
        totals: sp.get('totals') !== '0' || order.includes('totals'),
        terms: sp.get('terms') !== '0' || order.includes('terms'),
        sectionAssignment:
          sp.get('sectionAssignment') !== '0' || order.includes('sectionAssignment'),
      } as const;
      const requestedDatasheets = (sp.get('datasheets') || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const selectedStep5 = new Set(
        (sp.get('step5') || '')
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      );

      const proposal = await proposalService.getProposalWithDetails(id);
      if (!proposal) {
        return new Response(JSON.stringify({ ok: false, message: 'Proposal not found' }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        });
      }

      const company = {
        name: proposal.customer.name,
        industry: undefined as string | undefined,
        contactPerson: proposal.customer.contacts?.[0]?.name || undefined,
        contactEmail:
          proposal.customer.contacts?.[0]?.email || proposal.customer.email || undefined,
        contactPhone: undefined as string | undefined,
      };
      const proposalInfo = {
        title: proposal.title,
        description: proposal.description || '',
        dueDate: proposal.dueDate || null,
        priority: proposal.priority || 'MEDIUM',
        rfpReferenceNumber: undefined as string | undefined,
      };
      const sections = proposal.sections.map(section => {
        const sectionProducts = proposal.products.filter(p => p.sectionId === section.id);
        const total = sectionProducts.reduce((sum, p) => sum + Number(p.total || 0), 0);
        return {
          id: section.id,
          title: section.title,
          content: section.content,
          order: section.order,
          products: sectionProducts.map(p => ({
            id: p.id,
            productId: p.productId,
            name: p.product.name,
            sku: p.product.sku,
            quantity: p.quantity || 1,
            unitPrice: Number(p.unitPrice || p.product.price),
            total: Number(p.total || 0),
            category: p.product.category?.[0] || 'General',
            datasheetPath: p.product.datasheetPath,
          })),
          total,
        };
      });
      const unassignedProducts = proposal.products
        .filter(p => !p.sectionId)
        .map(p => ({
          id: p.id,
          productId: p.productId,
          name: p.product.name,
          sku: p.product.sku,
          quantity: p.quantity || 1,
          unitPrice: Number(p.unitPrice || p.product.price),
          total: Number(p.total || 0),
          category: p.product.category?.[0] || 'General',
          datasheetPath: p.product.datasheetPath,
        }));
      const grandTotal = proposal.products.reduce((s, p) => s + Number(p.total || 0), 0);
      let step5Sections = proposal.sections
        .filter(s => (s as any).type !== 'PRODUCTS')
        .map(s => ({
          id: s.id,
          title: s.title,
          content: s.content,
          order: s.order,
          type: (s as any).type,
        }));
      if (selectedStep5.size > 0) {
        step5Sections = step5Sections.filter(s => selectedStep5.has(s.id));
      }

      const html = buildStrictHtml({
        company,
        proposal: proposalInfo as any,
        sections,
        unassignedProducts,
        grandTotal,
        step5Sections,
        include,
        order,
        productOrder,
      });
      const headerTemplate = include.header
        ? `<div style="font-size:8px;width:100%;text-align:center;padding:4px 10px;border-bottom:1px solid #999;">${escapeHtml(company.name)} — ${escapeHtml(proposalInfo.title)}</div>`
        : '<span></span>';
      const footerTemplate = include.footer
        ? `<div style="font-size:8px;width:100%;text-align:center;padding:4px 10px;border-top:1px solid #999;"><span class="pageNumber"></span> of <span class="totalPages"></span> | ${escapeHtml(proposalInfo.title)}</div>`
        : '<span></span>';
      let pdfBuffer = await renderPdfViaFunction({
        mode: 'html',
        html,
        displayHeaderFooter: include.header || include.footer,
        headerTemplate,
        footerTemplate,
        margin: {
          top: include.header ? '0.5in' : '0.2in',
          right: '0.3in',
          bottom: include.footer ? '0.5in' : '0.2in',
          left: '0.3in',
        },
      });

      // Optionally append selected datasheets to the end when pdf-lib is available
      if (requestedDatasheets.length) {
        try {
          const { PDFDocument } = await import('pdf-lib');
          const merged = await PDFDocument.create();
          const main = await PDFDocument.load(pdfBuffer);
          const mainPages = await merged.copyPages(main, main.getPageIndices());
          mainPages.forEach(p => merged.addPage(p));

          // Collect datasheet URLs from proposal
          const byProductId = new Map<string, string>();
          for (const p of proposal.products) {
            if (p.productId && p.product.datasheetPath) {
              byProductId.set(p.productId, p.product.datasheetPath);
            }
          }
          for (const pid of requestedDatasheets) {
            const ds = byProductId.get(pid);
            if (!ds) continue;
            const url = ds.startsWith('http')
              ? ds
              : `${origin}${ds.startsWith('/') ? '' : '/'}${ds}`;
            const res = await fetch(url, {
              headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
            });
            if (!res.ok) continue;
            const bytes = new Uint8Array(await res.arrayBuffer());
            try {
              const doc = await PDFDocument.load(bytes);
              const pages = await merged.copyPages(doc, doc.getPageIndices());
              pages.forEach(p => merged.addPage(p));
            } catch (error) {
              console.error('Failed to merge PDF page:', error);
            }
          }
          pdfBuffer = await merged.save();
        } catch (error) {
          // pdf-lib not available; keep main pdf only
          console.error('PDF merge failed:', error);
        }
      }

      return new Response(Buffer.from(pdfBuffer), {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': `inline; filename="proposal-${id}.pdf"`,
          'cache-control': 'no-store',
        },
      });
    }

    // For preview template, use strict template with preview styling
    if (template === 'preview') {
      // Fetch proposal data for preview template
      const proposalInfo = await proposalService.getProposalById(id);
      if (!proposalInfo) {
        return new Response(JSON.stringify({ ok: false, message: 'Proposal not found' }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        });
      }

      const company = {
        name: (proposalInfo as any).company?.name || 'Company Name',
        industry: (proposalInfo as any).company?.industry || '',
        contactPerson: (proposalInfo as any).company?.contactPerson || '',
        contactEmail: (proposalInfo as any).company?.contactEmail || '',
        contactPhone: (proposalInfo as any).company?.contactPhone || '',
      };

      const sections = (proposalInfo as any).sections || [];
      const unassignedProducts = (proposalInfo as any).unassignedProducts || [];
      const step5Sections = (proposalInfo as any).step5Sections || [];
      const grandTotal = (proposalInfo as any).totals?.amount || 0;

      // Parse include flags for preview template
      const include = {
        header: sp.get('header') === '1',
        footer: sp.get('footer') === '1',
        company: sp.get('company') === '1',
        totals: sp.get('totals') === '1',
        terms: sp.get('terms') === '1',
        sectionAssignment: sp.get('sectionAssignment') === '1',
      };

      // Parse order and productOrder for preview template
      const orderParam = sp.get('order') || '';
      const order = orderParam
        .split(',')
        .map(s => s.trim())
        .filter(Boolean) as (
        | 'company'
        | 'products'
        | 'sections'
        | 'additional'
        | 'sectionAssignment'
        | 'totals'
        | 'terms'
      )[];

      const productOrderParam = sp.get('productOrder') || '';
      const productOrder = productOrderParam
        .split(',')
        .map(s => s.trim())
        .filter(Boolean) as ('tables' | 'datasheets' | 'totals')[];

      // Auto-enable sections that are in the order
      if (order.includes('company')) include.company = true;
      if (order.includes('totals')) include.totals = true;
      if (order.includes('terms')) include.terms = true;
      if (order.includes('sectionAssignment')) include.sectionAssignment = true;

      const html = buildStrictHtml({
        company,
        proposal: proposalInfo as any,
        sections,
        unassignedProducts,
        grandTotal,
        step5Sections,
        include,
        order,
        productOrder,
      });

      const pdfBuffer = await renderPdfViaFunction({
        mode: 'html',
        html,
        displayHeaderFooter: false,
      });

      return new Response(Buffer.from(pdfBuffer), {
        status: 200,
        headers: {
          'content-type': 'application/pdf',
          'content-disposition': `inline; filename="proposal-${id}.pdf"`,
          'cache-control': 'no-store',
        },
      });
    } else {
      // Default: render the existing preview UI
      try {
        const pdfBuffer = await renderPdfViaFunction({
          mode: 'url',
          url: previewUrl,
          cookies: cookieHeader || undefined,
          waitForSelector: '.proposal-header h1',
          timeoutMs: 60_000,
          displayHeaderFooter: false,
        });

        return new Response(Buffer.from(pdfBuffer), {
          status: 200,
          headers: {
            'content-type': 'application/pdf',
            'content-disposition': `inline; filename="proposal-${id}.pdf"`,
            'cache-control': 'no-store',
          },
        });
      } catch (error) {
        console.error('PDF generation error:', error);
        throw new Error(
          `Failed to load preview page: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return new Response(
      JSON.stringify({
        ok: false,
        code: 'PDF_GENERATION_FAILED',
        message: 'Failed to generate PDF',
        error: error.message,
      }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
