/**
 * PDF Export Button Component for Dashboard
 * Exports dashboard content to PDF with proper styling
 */

'use client';

import { useOptimizedAnalytics } from '@/hooks/useOptimizedAnalytics';
import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCallback, useRef, useState } from 'react';

interface PDFExportButtonProps {
  targetId?: string;
  filename?: string;
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export default function PDFExportButton({
  targetId = 'dashboard-content',
  filename = 'posalpro-dashboard-report',
  className = '',
  variant = 'default',
  size = 'md',
}: PDFExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { trackOptimized: analytics } = useOptimizedAnalytics();
  const exportTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const getVariantClasses = () => {
    switch (variant) {
      case 'outline':
        return 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400';
      case 'ghost':
        return 'bg-transparent text-gray-700 hover:bg-gray-100';
      default:
        return 'bg-blue-600 text-white hover:bg-blue-700';
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm';
      case 'lg':
        return 'px-6 py-3 text-lg';
      default:
        return 'px-4 py-2 text-base';
    }
  };

  const exportToPDF = useCallback(async () => {
    try {
      setIsExporting(true);

      // Track analytics
      analytics(
        'pdf_export_started',
        {
          component: 'PDFExportButton',
          targetId,
          filename,
        },
        'medium'
      );

      // Dynamic import to prevent SSR issues
      const html2pdf = (await import('html2pdf.js')).default;

      // Find the target element
      const targetElement = document.getElementById(targetId);
      if (!targetElement) {
        throw new Error(`Target element with id "${targetId}" not found`);
      }

      // Create a clone for PDF generation to avoid affecting the original
      const clone = targetElement.cloneNode(true) as HTMLElement;

      // Apply PDF-specific styles
      clone.style.backgroundColor = 'white';
      clone.style.color = 'black';
      clone.style.fontFamily = 'Arial, sans-serif';
      clone.style.padding = '20px';
      clone.style.margin = '0';

      // Hide elements that shouldn't be in PDF
      const elementsToHide = clone.querySelectorAll(
        'button, .no-print, [data-no-print], .sticky, .fixed'
      );
      elementsToHide.forEach(el => {
        (el as HTMLElement).style.display = 'none';
      });

      // Configure PDF options
      const pdfOptions = {
        margin: [10, 10, 10, 10],
        filename: `${filename}-${new Date().toISOString().split('T')[0]}.pdf`,
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

      // Generate PDF
      await html2pdf().from(clone).set(pdfOptions).save();

      // Track success
      analytics(
        'pdf_export_success',
        {
          component: 'PDFExportButton',
          targetId,
          filename,
          fileSize: 'generated',
        },
        'medium'
      );
    } catch (error) {
      ErrorHandlingService.getInstance().processError(
        error as Error,
        'PDF export failed',
        ErrorCodes.SYSTEM.INTERNAL_ERROR,
        {
          component: 'PDFExportButton',
          operation: 'exportToPDF',
          context: { targetId, filename },
        }
      );

      // Track error
      analytics(
        'pdf_export_error',
        {
          component: 'PDFExportButton',
          targetId,
          filename,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        'high'
      );

      // Show user-friendly error
      toast.error('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [targetId, filename, analytics]);

  const handleClick = useCallback(() => {
    // Clear any existing timeout
    if (exportTimeoutRef.current) {
      clearTimeout(exportTimeoutRef.current);
    }

    // Add a small delay to ensure UI updates
    exportTimeoutRef.current = setTimeout(() => {
      exportToPDF();
    }, 100);
  }, [exportToPDF]);

  return (
    <button
      onClick={handleClick}
      disabled={isExporting}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-medium
        transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50
        disabled:opacity-50 disabled:cursor-not-allowed
        ${getVariantClasses()} ${getSizeClasses()} ${className}
      `}
      title="Export dashboard to PDF"
    >
      {isExporting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          <span>Export PDF</span>
        </>
      )}
    </button>
  );
}
