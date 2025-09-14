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

  // Compose preview URL (no auto window.print; we render via page.pdf)
  const origin = getOrigin(req);
  const previewUrl = `${origin}/proposals/preview?id=${encodeURIComponent(id)}`;

  // Try dynamic imports so the route still loads without deps
  let chromium: any;
  let puppeteer: any;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    chromium = (await import('@sparticuz/chromium')) as any;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    puppeteer = (await import('puppeteer-core')) as any;
  } catch (e: any) {
    const message =
      'PDF rendering dependencies not installed: install puppeteer-core and @sparticuz/chromium';
    return new Response(
      JSON.stringify({
        ok: false,
        code: 'PDF_DEPS_MISSING',
        message,
        hint: 'npm i -D puppeteer-core @sparticuz/chromium',
      }),
      { status: 501, headers: { 'content-type': 'application/json' } }
    );
  }

  // Get Chromium executable path with multiple fallback strategies
  let executablePath: string | undefined;

  try {
    // Try different ways to get the executable path
    if (typeof chromium.executablePath === 'function') {
      executablePath = await chromium.executablePath();
    } else if (typeof chromium.executablePath === 'string') {
      executablePath = chromium.executablePath;
    } else if (chromium.executablePath && typeof chromium.executablePath.then === 'function') {
      executablePath = await chromium.executablePath;
    }

    // Fallback to environment variable
    if (!executablePath) {
      executablePath = process.env.CHROME_PATH;
    }

    // Final fallback - try to find Chrome/Chromium in common locations
    if (!executablePath) {
      const { execSync } = await import('child_process');
      try {
        // Try to find Chrome/Chromium in PATH
        const chromePath = execSync(
          'which google-chrome || which chromium || which chromium-browser',
          { encoding: 'utf8' }
        ).trim();
        if (chromePath) {
          executablePath = chromePath;
        }
      } catch {
        // Ignore errors from which command
      }

      // macOS specific fallback
      if (!executablePath && process.platform === 'darwin') {
        const macChromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
        try {
          const fs = await import('fs');
          if (fs.existsSync(macChromePath)) {
            executablePath = macChromePath;
          }
        } catch {
          // Ignore errors
        }
      }
    }
  } catch (error) {
    console.error('Error getting Chromium executable path:', error);
  }

  if (!executablePath) {
    return new Response(
      JSON.stringify({
        ok: false,
        code: 'CHROME_EXECUTABLE_MISSING',
        message: 'Chrome executable not found',
        hint: 'Ensure @sparticuz/chromium is properly installed or set CHROME_PATH environment variable',
      }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      headless: chromium.headless,
      executablePath,
    });

    const page = await browser.newPage();
    // Attach user cookies from the incoming request to preserve auth
    const cookieHeader = req.headers.get('cookie') || '';
    if (cookieHeader) {
      const hostname = new URL(origin).hostname;
      const secure = origin.startsWith('https://');
      const cookies = cookieHeader
        .split(';')
        .map(c => c.trim())
        .filter(Boolean)
        .map(pair => {
          const eq = pair.indexOf('=');
          const name = eq >= 0 ? pair.substring(0, eq) : pair;
          const value = eq >= 0 ? pair.substring(eq + 1) : '';
          return { name, value, domain: hostname, path: '/', secure, url: origin } as any;
        });
      if (cookies.length) {
        await page.setCookie(...cookies);
      }
    }
    // Also set header to pass cookies on first navigation (some envs require this)
    if (cookieHeader) {
      await page.setExtraHTTPHeaders({ Cookie: cookieHeader });
    }
    await page.emulateMediaType('print');

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
        proposal: proposalInfo,
        sections,
        unassignedProducts,
        grandTotal,
        step5Sections,
        include,
        order,
        productOrder,
      });
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const headerTemplate = include.header
        ? `<div style="font-size:8px;width:100%;text-align:center;padding:4px 10px;border-bottom:1px solid #999;">${escapeHtml(company.name)} — ${escapeHtml(proposalInfo.title)}</div>`
        : '<span></span>';
      const footerTemplate = include.footer
        ? `<div style="font-size:8px;width:100%;text-align:center;padding:4px 10px;border-top:1px solid #999;"><span class="pageNumber"></span> of <span class="totalPages"></span> | ${escapeHtml(proposalInfo.title)}</div>`
        : '<span></span>';

      let pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: include.header ? '0.5in' : '0.2in',
          right: '0.3in',
          bottom: include.footer ? '0.5in' : '0.2in',
          left: '0.3in',
        },
        displayHeaderFooter: include.header || include.footer,
        headerTemplate,
        footerTemplate,
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
            } catch {}
          }
          pdfBuffer = await merged.save();
        } catch (e) {
          // pdf-lib not available; keep main pdf only
        }
      }

      return new Response(pdfBuffer, {
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
        name: proposalInfo.company?.name || 'Company Name',
        industry: proposalInfo.company?.industry || '',
        contactPerson: proposalInfo.company?.contactPerson || '',
        contactEmail: proposalInfo.company?.contactEmail || '',
        contactPhone: proposalInfo.company?.contactPhone || '',
      };

      const sections = proposalInfo.sections || [];
      const unassignedProducts = proposalInfo.unassignedProducts || [];
      const step5Sections = proposalInfo.step5Sections || [];
      const grandTotal = proposalInfo.totals?.amount || 0;

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
        proposal: proposalInfo,
        sections,
        unassignedProducts,
        grandTotal,
        step5Sections,
        include,
        order,
        productOrder,
      });

      await page.setContent(html, { waitUntil: 'networkidle0' });
    } else {
      // Default: render the existing preview UI
      try {
        // Forward authentication cookies for preview template
        const cookies = req.headers.get('cookie');
        if (cookies) {
          const cookiePairs = cookies.split(';').map(pair => {
            const [name, value] = pair.trim().split('=');
            return { name, value, domain: new URL(previewUrl).hostname, path: '/' };
          });
          await page.setCookie(...cookiePairs);
        }

        await page.goto(previewUrl, { waitUntil: 'networkidle0', timeout: 60_000 });
        await page.waitForSelector('.proposal-header h1', { timeout: 15_000 });
      } catch (error) {
        console.error('PDF generation error:', error);
        throw new Error(`Failed to load preview page: ${error.message}`);
      }
    }

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '0.2in', right: '0.2in', bottom: '0.2in', left: '0.2in' },
      displayHeaderFooter: false,
      preferCSSPageSize: true,
    });

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'content-type': 'application/pdf',
        'content-disposition': `inline; filename="proposal-${id}.pdf"`,
        'cache-control': 'no-store',
      },
    });
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
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
