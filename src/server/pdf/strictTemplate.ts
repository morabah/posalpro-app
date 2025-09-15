export interface StrictCompanyInfo {
  name: string;
  industry?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface StrictProposalInfo {
  title: string;
  description?: string;
  dueDate?: Date | string | null;
  priority?: string;
  rfpReferenceNumber?: string;
}

export interface StrictProductRow {
  id: string;
  productId: string;
  name: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: string;
  datasheetPath?: string | null;
}

export interface StrictSectionBlock {
  id: string;
  title: string;
  content: string;
  order: number;
  products: StrictProductRow[];
  total: number;
}

export interface StrictStep5Section {
  id: string;
  title: string;
  content: string;
  order: number;
  type?: string;
}

export interface StrictIncludeFlags {
  header: boolean;
  footer: boolean;
  company: boolean;
  totals: boolean;
  terms: boolean; // reserved for future
  sectionAssignment: boolean;
}

export interface StrictTemplateParams {
  company: StrictCompanyInfo;
  proposal: StrictProposalInfo;
  sections: StrictSectionBlock[];
  unassignedProducts: StrictProductRow[];
  step5Sections: StrictStep5Section[];
  grandTotal: number;
  include: StrictIncludeFlags;
  order?: (
    | 'company'
    | 'products'
    | 'sections'
    | 'additional'
    | 'sectionAssignment'
    | 'totals'
    | 'terms'
  )[];
  productOrder?: ('tables' | 'datasheets' | 'totals')[];
}

export function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function currency(n: number): string {
  try {
    return n.toLocaleString(undefined, { minimumFractionDigits: 0 });
  } catch {
    return String(n);
  }
}

export function buildStrictHtml(params: StrictTemplateParams): string {
  const { company, proposal, sections, unassignedProducts, step5Sections, grandTotal, include } =
    params;
  const order =
    params.order && params.order.length
      ? params.order
      : (['company', 'sections', 'additional', 'sectionAssignment', 'totals'] as const);

  // Default product order: tables, datasheets, totals (matching preview page)
  const productOrder =
    params.productOrder && params.productOrder.length
      ? params.productOrder
      : (['tables', 'datasheets', 'totals'] as const);
  const visibleSections = sections
    .filter(s => s.products && s.products.length > 0)
    .sort((a, b) => a.order - b.order);

  const css = `
    @page { size: A4; margin: 0.2in; }
    body { font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; font-size: 10pt; color: #111; }
    .page { padding: 8pt; }
    h1 { font-size: 18pt; margin: 0 0 6pt; }
    h2 { font-size: 13pt; margin: 10pt 0 6pt; }

    /* Section-level page break control */
    .section {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 10pt;
      margin: 8pt 0;
      page-break-inside: avoid; /* Prevent section from splitting across pages */
      break-inside: avoid; /* Modern CSS equivalent */
    }

    /* Table page break control */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 6pt;
      font-size: 9pt;
      page-break-inside: auto; /* Allow table to break if needed */
    }

    /* Table row page break control */
    tr {
      page-break-inside: avoid; /* Prevent individual rows from splitting */
      break-inside: avoid; /* Modern CSS equivalent */
    }

    /* Table header page break control */
    thead {
      display: table-header-group; /* Repeat header on each page */
    }

    /* Ensure table cells don't break awkwardly */
    th, td {
      border: 1px solid #e5e7eb;
      padding: 3pt 4pt;
      text-align: left;
      vertical-align: top;
      page-break-inside: avoid; /* Prevent cell content from splitting */
      break-inside: avoid; /* Modern CSS equivalent */
    }

    th { background: #f7f7f7; font-weight: 600; }
    .right { text-align: right; }
    .center { text-align: center; }
    .muted { color: #555; }
    .total { font-weight: 700; color: #106a2a; }
    .frame { position: fixed; inset: 0; border: 1pt solid rgba(0,0,0,.75); }

    /* Additional page break controls for specific elements */
    .section-header {
      page-break-after: avoid; /* Keep section header with content */
      break-after: avoid; /* Modern CSS equivalent */
    }

    .section-footer {
      page-break-before: avoid; /* Keep section footer with content */
      break-before: avoid; /* Modern CSS equivalent */
    }

    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6pt; font-size: 9pt; }
  `;

  // Calculate dynamic section numbering based on content order
  const getSectionNumber = (sectionIndex: number) => {
    let number = 1; // Title is always first
    for (const sectionKey of order) {
      if (sectionKey === 'company' && include.company) {
        number++;
      } else if (sectionKey === 'sections' && visibleSections.length > 0) {
        return number + sectionIndex;
      } else if (sectionKey === 'products') {
        if (visibleSections.length > 0) {
          return number + sectionIndex;
        }
      } else if (sectionKey === 'additional' && unassignedProducts.length > 0) {
        if (sectionKey === 'additional') {
          return number + (visibleSections.length > 0 ? visibleSections.length : 0);
        }
      }
      if (sectionKey === 'sections' || sectionKey === 'products') {
        break;
      }
    }
    return sectionIndex + 1;
  };

  const sectionBlocks = visibleSections
    .map((s, sectionIndex) => {
      const sectionNumber = getSectionNumber(sectionIndex);
      const rows = s.products
        .map(
          (p, i) => `
      <tr>
        <td class="muted">${sectionNumber}.${i + 1}</td>
        <td><div>${escapeHtml(p.productId)}</div><div class="muted">SKU: ${escapeHtml(
          p.sku
        )}</div></td>
        <td><div>${escapeHtml(p.name)}</div></td>
        <td class="center">${p.quantity}</td>
        <td class="right">$${currency(p.unitPrice)}</td>
        <td class="right total">$${currency(p.total)}</td>
      </tr>`
        )
        .join('');
      return `
      <div class="section">
        <div class="section-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6pt;">
          <h2>${sectionNumber}. ${escapeHtml(s.title)}</h2>
          <div class="muted">${s.products.length} items</div>
        </div>
        ${s.content ? `<div class="muted" style="margin-bottom:6pt;">${escapeHtml(s.content)}</div>` : ''}
        <table>
          <thead>
            <tr>
              <th style="width:8%">#</th>
              <th style="width:22%">Part Number</th>
              <th>Description</th>
              <th class="center" style="width:8%">Qty</th>
              <th class="right" style="width:14%">Unit Price</th>
              <th class="right" style="width:14%">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
        <div class="section-footer" style="display:flex;justify-content:space-between;align-items:center;margin-top:6pt;border-top:1px solid #eee;padding-top:6pt;">
          <div class="muted">Sub total ${escapeHtml(s.title)}:</div>
          <div class="total">$${currency(s.total)}</div>
        </div>
      </div>`;
    })
    .join('');

  // Calculate dynamic additional products numbering
  const getAdditionalIndex = () => {
    let index = 1; // Title is always first
    for (const sectionKey of order) {
      if (sectionKey === 'company' && include.company) {
        index++;
      } else if (sectionKey === 'sections' && visibleSections.length > 0) {
        index += visibleSections.length;
      } else if (sectionKey === 'products') {
        if (visibleSections.length > 0) index += visibleSections.length;
      } else if (sectionKey === 'additional') {
        break;
      }
    }
    return index;
  };

  const additionalIndex = getAdditionalIndex();
  const additionalBlock = unassignedProducts.length
    ? `
    <div class="section">
      <div class="section-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6pt;">
        <h2>${additionalIndex}. Additional Products</h2>
        <div class="muted">${unassignedProducts.length} items</div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width:8%">#</th>
            <th style="width:22%">Part Number</th>
            <th>Description</th>
            <th class="center" style="width:8%">Qty</th>
            <th class="right" style="width:14%">Unit Price</th>
            <th class="right" style="width:14%">Total</th>
          </tr>
        </thead>
        <tbody>
          ${unassignedProducts
            .map(
              (p, i) => `
            <tr>
              <td class="muted">${additionalIndex}.${i + 1}</td>
              <td><div>${escapeHtml(p.productId)}</div><div class="muted">SKU: ${escapeHtml(
                p.sku
              )}</div></td>
              <td><div>${escapeHtml(p.name)}</div></td>
              <td class="center">${p.quantity}</td>
              <td class="right">$${currency(p.unitPrice)}</td>
              <td class="right total">$${currency(p.total)}</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
      <div class="section-footer" style="display:flex;justify-content:space-between;align-items:center;margin-top:6pt;border-top:1px solid #eee;padding-top:6pt;">
        <div class="muted">Additional Products Total:</div>
        <div class="total">$${currency(unassignedProducts.reduce((s, p) => s + p.total, 0))}</div>
      </div>
    </div>`
    : '';

  // Calculate dynamic section assignment index based on content order
  const getSectionAssignmentIndex = () => {
    let index = 1; // Title is always first
    for (const sectionKey of order) {
      if (sectionKey === 'company' && include.company) {
        index++;
      } else if (sectionKey === 'sections' || sectionKey === 'products') {
        if (sectionKey === 'sections' && visibleSections.length > 0) {
          index += visibleSections.length;
        } else if (sectionKey === 'products') {
          if (visibleSections.length > 0) index += visibleSections.length;
          if (unassignedProducts.length > 0) index += 1;
        }
      } else if (sectionKey === 'additional' && unassignedProducts.length > 0) {
        index++;
      }
      if (sectionKey === 'sectionAssignment') {
        break;
      }
    }
    return index;
  };

  const sectionAssignmentIndex = getSectionAssignmentIndex();
  const sectionAssignmentBlock =
    include.sectionAssignment && step5Sections.length
      ? `
    <div class="section">
      <div class="section-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6pt;">
        <h2>${sectionAssignmentIndex}. Section Assignment</h2>
        <div class="muted">${step5Sections.length} sections</div>
      </div>
      ${step5Sections
        .sort((a, b) => a.order - b.order)
        .map(
          (s, i) => `
        <div style="margin:6pt 0; page-break-inside: avoid; break-inside: avoid;">
          <div style="font-weight:600;">${i + 1}. ${escapeHtml(s.title)}</div>
          ${s.content ? `<div class="muted" style="margin-top:2pt;">${escapeHtml(s.content)}</div>` : ''}
        </div>`
        )
        .join('')}
    </div>`
      : '';

  // Calculate dynamic totals numbering
  const getTotalsIndex = () => {
    let index = 1; // Title is always first
    for (const sectionKey of order) {
      if (sectionKey === 'company' && include.company) {
        index++;
      } else if (sectionKey === 'sections' && visibleSections.length > 0) {
        index += visibleSections.length;
      } else if (sectionKey === 'products') {
        if (visibleSections.length > 0) index += visibleSections.length;
        if (unassignedProducts.length > 0) index += 1;
      } else if (sectionKey === 'additional' && unassignedProducts.length > 0) {
        index++;
      } else if (
        sectionKey === 'sectionAssignment' &&
        include.sectionAssignment &&
        step5Sections.length > 0
      ) {
        index++;
      }
      if (sectionKey === 'totals') {
        break;
      }
    }
    return index;
  };

  const totalsIndex = getTotalsIndex();
  const totalsBlock = include.totals
    ? `
    <div class="section" style="border-color:#9ae6b4;background: #f6fff9;">
      <div class="section-header" style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <div style="font-weight:700;">${totalsIndex}. Grand Total</div>
          <div class="muted">All sections and products</div>
        </div>
        <div class="total" style="font-size:16pt;">$${currency(grandTotal)}</div>
      </div>
    </div>`
    : '';

  // Calculate dynamic company information numbering
  const getCompanyIndex = () => {
    const index = 1; // Title is always first
    for (const sectionKey of order) {
      if (sectionKey === 'company') {
        break;
      }
    }
    return index;
  };

  const companyIndex = getCompanyIndex();
  const companyBlock = include.company
    ? `
    <div class="section">
      <div class="section-header">
        <h2>${companyIndex}. Company Information</h2>
      </div>
      <div class="meta">
        <div><strong>Company:</strong> ${escapeHtml(company.name)}</div>
        <div><strong>Email:</strong> ${company.contactEmail ? escapeHtml(company.contactEmail) : '-'}</div>
        <div><strong>Contact Person:</strong> ${company.contactPerson ? escapeHtml(company.contactPerson) : '-'}</div>
        <div><strong>RFP Ref:</strong> ${proposal.rfpReferenceNumber ? escapeHtml(proposal.rfpReferenceNumber) : '-'}</div>
        <div><strong>Due Date:</strong> ${proposal.dueDate ? new Date(proposal.dueDate).toLocaleDateString() : '-'}</div>
        <div><strong>Description:</strong> ${proposal.description ? escapeHtml(proposal.description) : '-'}</div>
      </div>
    </div>`
    : '';

  // Create products section following productOrder
  const productContentMap: Record<string, string> = {
    tables: sectionBlocks + additionalBlock,
    datasheets: '', // Datasheets are handled separately in PDF route
    totals: totalsBlock,
  };

  const productsSection = productOrder
    .map(key => productContentMap[key] || '')
    .filter(Boolean)
    .join('\n');

  const blockMap: Record<string, string> = {
    company: companyBlock,
    products: productsSection,
    sections: sectionBlocks,
    additional: additionalBlock,
    sectionAssignment: sectionAssignmentBlock,
    totals: totalsBlock,
    terms: '',
  };

  const content = order.map(k => blockMap[k] || '').join('\n');

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>${escapeHtml(proposal.title)}</title>
      <style>${css}</style>
    </head>
    <body>
      <div class="frame"></div>
      <div class="page">
        <h1>${escapeHtml(proposal.title)}</h1>
        ${content}
      </div>
    </body>
  </html>`;
}
