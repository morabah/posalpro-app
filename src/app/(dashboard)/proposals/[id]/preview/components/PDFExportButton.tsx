'use client';

import { Button } from '@/components/ui/forms/Button';
import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { logError } from '@/lib/logger';
import { Download } from 'lucide-react';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

interface PDFExportButtonProps {
  proposalId: string;
  proposal: any;
}

export default function PDFExportButton({ proposalId, proposal }: PDFExportButtonProps) {
  const analytics = useOptimizedAnalytics();
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const handleDownloadPDF = useCallback(async () => {
    if (!proposal) return;

    try {
      setIsExportingPDF(true);

      analytics.trackOptimized('proposal_pdf_export_started', {
        proposalId,
        userStory: 'US-3.2',
        hypothesis: 'H4',
      });

      // Dynamic import of html2pdf.js for code splitting
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
        component: 'PDFExportButton',
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

  return (
    <Button onClick={handleDownloadPDF} variant="primary" size="sm" disabled={isExportingPDF}>
      <Download className="h-4 w-4 mr-2" />
      {isExportingPDF ? 'Exporting...' : 'Save as PDF'}
    </Button>
  );
}
