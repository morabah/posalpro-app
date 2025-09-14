'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface DatasheetItem {
  productName: string;
  sku: string;
  url: string;
}

interface PrintDatasheetsProps {
  items: DatasheetItem[];
  onReady?: () => void;
}

/**
 * PrintDatasheets
 * Renders selected PDF datasheets as canvas pages via PDF.js for reliable printing.
 * - Avoids iframe/PDF plugin limitations that cause single long page or blank output
 * - Uses existing global PDF.js worker configured in QueryProvider
 * - Fetches PDFs through /api/documents proxy to bypass CORS
 */
export function PrintDatasheets({ items, onReady }: PrintDatasheetsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderedCount, setRenderedCount] = useState(0);
  const loadingTasksRef = useRef<Set<any>>(new Set());
  const pdfDocumentsRef = useRef<Set<any>>(new Set());

  const proxiedItems = useMemo(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return items.map(item => {
      try {
        const filename = encodeURIComponent(item.url.split('/').pop() || 'datasheet.pdf');
        const params = new URLSearchParams({ url: encodeURIComponent(item.url), filename });
        return {
          ...item,
          proxiedUrl: `${origin}/api/documents?${params.toString()}`,
        } as DatasheetItem & {
          proxiedUrl: string;
        };
      } catch {
        return { ...item, proxiedUrl: item.url } as DatasheetItem & { proxiedUrl: string };
      }
    });
  }, [items]);

  useEffect(() => {
    let cancelled = false;
    const container = containerRef.current as HTMLDivElement | null;
    if (!container) return;
    // Non-null assertion for subsequent awaited sections
    const containerEl = container as HTMLDivElement;

    async function render() {
      if (!proxiedItems.length) {
        onReady?.();
        return;
      }

      setIsRendering(true);
      setRenderedCount(0);

      // Lazy-load pdf.js via react-pdf to reuse the configured worker
      const reactPdf = await import('react-pdf');
      const pdfjs = reactPdf.pdfjs;

      // Clear any previous content
      containerEl.innerHTML = '';

      for (const item of proxiedItems) {
        if (cancelled) break;

        // Section header per datasheet
        const sheetWrap = document.createElement('div');
        sheetWrap.className = 'print-datasheet-wrapper page-break-before';
        const header = document.createElement('div');
        header.className = 'print-datasheet-header';
        header.innerHTML = `
          <h1>Product Datasheet</h1>
          <h2>${escapeHtml(item.productName)}</h2>
          <p>SKU: ${escapeHtml(item.sku)}</p>
        `;
        sheetWrap.appendChild(header);

        // Pages container
        const pagesWrap = document.createElement('div');
        pagesWrap.className = 'print-datasheet-pages';
        sheetWrap.appendChild(pagesWrap);
        containerEl.appendChild(sheetWrap);

        try {
          // Fetch PDF as ArrayBuffer
          const res = await fetch(item.proxiedUrl, { method: 'GET' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const arrayBuffer = await res.arrayBuffer();

          const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
          loadingTasksRef.current.add(loadingTask);

          const pdf = await loadingTask.promise;
          pdfDocumentsRef.current.add(pdf);
          const totalPages = pdf.numPages;

          for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
            if (cancelled) break;
            const page = await pdf.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 1.5 });

            // Create canvas for page and render
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) throw new Error('Canvas 2D context unavailable');

            // Fit to printable width by CSS; set pixel density for quality
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: context, viewport }).promise;

            // Wrap page for print page breaks
            const pageWrap = document.createElement('div');
            pageWrap.className = 'pdf-page';
            canvas.style.width = '100%';
            canvas.style.height = 'auto';
            pageWrap.appendChild(canvas);
            pagesWrap.appendChild(pageWrap);

            setRenderedCount(prev => prev + 1);
          }
        } catch (error) {
          // Fallback UI
          const fallback = document.createElement('div');
          fallback.className = 'print-datasheet-fallback';
          fallback.innerHTML = `
            <div>
              <p>PDF could not be rendered for printing.</p>
            </div>
          `;
          pagesWrap.appendChild(fallback);
        }
      }

      if (!cancelled) {
        setIsRendering(false);
        onReady?.();
      }
    }

    render();

    return () => {
      cancelled = true;

      // Clean up PDF documents and loading tasks
      const loadingTasks = loadingTasksRef.current;
      const pdfDocuments = pdfDocumentsRef.current;

      loadingTasks.forEach(loadingTask => {
        try {
          if (loadingTask && typeof loadingTask.destroy === 'function') {
            loadingTask.destroy();
          }
        } catch (error) {
          console.warn('Error destroying PDF loading task:', error);
        }
      });
      loadingTasks.clear();

      pdfDocuments.forEach(pdf => {
        try {
          if (pdf && typeof pdf.destroy === 'function') {
            pdf.destroy();
          }
        } catch (error) {
          console.warn('Error destroying PDF document:', error);
        }
      });
      pdfDocuments.clear();
    };
  }, [proxiedItems, onReady]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Clean up any remaining PDF documents and loading tasks
      const loadingTasks = loadingTasksRef.current;
      const pdfDocuments = pdfDocumentsRef.current;

      loadingTasks.forEach(loadingTask => {
        try {
          if (loadingTask && typeof loadingTask.destroy === 'function') {
            loadingTask.destroy();
          }
        } catch (error) {
          console.warn('Error destroying PDF loading task on unmount:', error);
        }
      });
      loadingTasks.clear();

      pdfDocuments.forEach(pdf => {
        try {
          if (pdf && typeof pdf.destroy === 'function') {
            pdf.destroy();
          }
        } catch (error) {
          console.warn('Error destroying PDF document on unmount:', error);
        }
      });
      pdfDocuments.clear();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="print:block hidden print-datasheets-container"
      aria-hidden={false}
      data-print-ready={(!isRendering && renderedCount > 0) || proxiedItems.length === 0}
    />
  );
}

function escapeHtml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default PrintDatasheets;
