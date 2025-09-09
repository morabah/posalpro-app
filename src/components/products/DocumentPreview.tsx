'use client';

import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';
import { Button } from '@/components/ui/forms/Button';
import { analytics } from '@/lib/analytics';
import { logError, logInfo } from '@/lib/logger';
import { AlertCircle, Download, Eye, FileText, Maximize2 } from 'lucide-react';
import React, { Suspense, useCallback, useEffect, useState } from 'react';

// Dynamic imports for PDF and Word document libraries
// ✅ NOTE: PDF.js worker is now configured globally in QueryProvider
const PDFViewer = React.lazy(() =>
  import('react-pdf').then(module => {
    // Worker is now configured globally - just log current configuration
    console.log('[DEBUG] DocumentPreview: PDF worker status', {
      workerSrc: module.pdfjs.GlobalWorkerOptions.workerSrc,
      configured: !!module.pdfjs.GlobalWorkerOptions.workerSrc,
    });

    return {
      default: ({ file, onLoadSuccess, onLoadError, children }: any) => (
        <div className="relative">
          <module.Document
            file={file}
            onLoadSuccess={onLoadSuccess}
            onLoadError={onLoadError}
            loading={<DocumentLoading />}
            error={<DocumentError />}
          >
            {children}
          </module.Document>
        </div>
      ),
    };
  })
);

const PDFPage = React.lazy(() =>
  import('react-pdf').then(module => ({
    default: ({ pageNumber, scale, renderTextLayer, renderAnnotationLayer }: any) => (
      <module.Page
        pageNumber={pageNumber}
        scale={scale}
        renderTextLayer={renderTextLayer}
        renderAnnotationLayer={renderAnnotationLayer}
      />
    ),
  }))
);

interface DocumentPreviewProps {
  datasheetPath: string;
  productId: string;
  productName: string;
  className?: string;
}

// Loading component for documents
function DocumentLoading() {
  return (
    <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-2 text-sm text-gray-600">Loading document...</p>
      </div>
    </div>
  );
}

// Error component for documents
function DocumentError() {
  return (
    <div className="flex items-center justify-center h-64 bg-red-50 rounded-lg border border-red-200">
      <div className="text-center">
        <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
        <p className="mt-2 text-sm text-red-700">Failed to load document</p>
        <p className="mt-1 text-xs text-red-600">The document may be corrupted or inaccessible</p>
      </div>
    </div>
  );
}

// Word document preview component
function WordDocumentPreview({ filePath }: { filePath: string }) {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWordDocument = async () => {
      try {
        setIsLoading(true);

        if (!filePath.startsWith('http') && !filePath.includes('/api/documents')) {
          throw new Error('Word document preview requires a network URL');
        }

        const mammoth = await import('mammoth');

        // Remote file
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error(`Failed to fetch document: ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();

        const result = await mammoth.convertToHtml({ arrayBuffer });
        setContent(result.value);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load Word document');
        logError('Word document loading failed', {
          component: 'WordDocumentPreview',
          operation: 'loadWordDocument',
          filePath,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadWordDocument();
  }, [filePath]);

  if (isLoading) return <DocumentLoading />;
  if (error) return <DocumentError />;

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
      <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  );
}

export function DocumentPreview({
  datasheetPath,
  productId,
  productName,
  className = '',
}: DocumentPreviewProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pdfDocument, setPdfDocument] = useState<any>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [loadStartTime, setLoadStartTime] = useState<number>(0);

  // Debug logging for component initialization
  useEffect(() => {
    console.log('[DEBUG] DocumentPreview: Component initialized', {
      datasheetPath,
      productId,
      productName,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
    });

    // Check CSP headers
    fetch(window.location.origin, { method: 'HEAD' })
      .then(response => {
        const csp = response.headers.get('content-security-policy');
        const cacheControl = response.headers.get('cache-control');
        console.log('[DEBUG] DocumentPreview: CSP headers from server', {
          csp: csp ? csp.substring(0, 200) + '...' : 'No CSP header found',
          cacheControl,
          allHeaders: Object.fromEntries(response.headers.entries()),
          productId,
          productName,
        });
      })
      .catch(error => {
        console.log('[DEBUG] DocumentPreview: Failed to fetch CSP headers', {
          error: error.message,
          productId,
          productName,
        });
      });
  }, [datasheetPath, productId, productName]);

  // Determine file type
  const getFileType = (path: string): 'pdf' | 'word' | 'other' => {
    const extension = path.toLowerCase().split('.').pop();
    if (extension === 'pdf') return 'pdf';
    if (['doc', 'docx'].includes(extension || '')) return 'word';
    return 'other';
  };

  const fileType = getFileType(datasheetPath);

  // Debug logging for file type detection
  useEffect(() => {
    console.log('[DEBUG] DocumentPreview: File type detected', {
      datasheetPath,
      fileType,
      productId,
      productName,
    });
  }, [datasheetPath, fileType, productId, productName]);

  // Handle PDF load success
  const handlePdfLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      const loadTime = loadStartTime > 0 ? performance.now() - loadStartTime : 0;

      logInfo('PDF document loaded successfully', {
        component: 'DocumentPreview',
        operation: 'handlePdfLoadSuccess',
        productId,
        productName,
        numPages,
        loadTime: Math.round(loadTime),
        datasheetPath,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      });

      analytics.trackOptimized(
        'document_preview_loaded',
        {
          component: 'DocumentPreview',
          productId,
          productName,
          fileType: 'pdf',
          numPages,
          loadTime: Math.round(loadTime),
          userStory: 'US-4.1',
          hypothesis: 'H5',
        },
        'medium'
      );
    },
    [productId, productName, datasheetPath, loadStartTime]
  );

  // Handle PDF load error
  const handlePdfLoadError = useCallback(
    (error: Error) => {
      console.log('[DEBUG] DocumentPreview: PDF load error occurred', {
        error: error.message,
        errorName: error.name,
        errorStack: error.stack,
        productId,
        productName,
        datasheetPath,
        timestamp: new Date().toISOString(),
      });

      setPdfError(error.message);
      logError('PDF document loading failed', {
        component: 'DocumentPreview',
        operation: 'handlePdfLoadError',
        productId,
        productName,
        datasheetPath,
        error: error.message,
      });

      analytics.trackOptimized(
        'document_preview_error',
        {
          component: 'DocumentPreview',
          productId,
          productName,
          fileType: 'pdf',
          error: error.message,
          userStory: 'US-4.1',
          hypothesis: 'H5',
        },
        'high'
      );
    },
    [productId, productName, datasheetPath]
  );

  // Handle expand/collapse
  const toggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
    analytics.trackOptimized(
      'document_preview_toggle',
      {
        component: 'DocumentPreview',
        productId,
        productName,
        expanded: !isExpanded,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      },
      'low'
    );
  }, [isExpanded, productId, productName]);

  // Handle download
  const handleDownload = useCallback(() => {
    if (datasheetPath.startsWith('http')) {
      window.open(datasheetPath, '_blank');
    } else {
      // For local files, show a message
      logInfo('Download attempted for local file', {
        component: 'DocumentPreview',
        operation: 'handleDownload',
        productId,
        productName,
        datasheetPath,
      });
    }

    analytics.trackOptimized(
      'document_download',
      {
        component: 'DocumentPreview',
        productId,
        productName,
        fileType,
        userStory: 'US-4.1',
        hypothesis: 'H5',
      },
      'medium'
    );
  }, [datasheetPath, productId, productName, fileType]);

  // Get file name from path
  const getFileName = (path: string): string => {
    return path.split('/').pop()?.split('\\').pop() || 'Document';
  };

  // Check if file is accessible (not local file with fake path)
  const isFileAccessible = (path: string): boolean => {
    const isLocal =
      path.includes('fakepath') ||
      path.includes('C:\\') ||
      path.includes('file://') ||
      path.match(/^[A-Za-z]:/) || // Windows drive letters
      (path.startsWith('/') && !path.startsWith('//')); // Unix absolute paths without protocol, but allow network paths

    const result = !isLocal;
    console.log('[DEBUG] DocumentPreview: isFileAccessible check', {
      path,
      isLocal,
      result,
      productId,
      productName,
    });

    return result;
  };

  // Convert network URL to proxied URL for secure access
  const getProxiedUrl = useCallback(
    (url: string): string => {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        console.log('[DEBUG] DocumentPreview: getProxiedUrl - Local file, returning as-is', {
          url,
          productId,
          productName,
        });
        return url; // Local file, return as-is
      }

      const filename = getFileName(url);
      const params = new URLSearchParams({
        url: encodeURIComponent(url),
        filename: filename,
      });

      const proxiedUrl = `${window.location.origin}/api/documents?${params.toString()}`;
      console.log('[DEBUG] DocumentPreview: getProxiedUrl - Network URL converted to proxied URL', {
        originalUrl: url,
        proxiedUrl,
        filename,
        productId,
        productName,
      });

      return proxiedUrl;
    },
    [productId, productName]
  );

  const fileName = getFileName(datasheetPath);
  const fileAccessible = isFileAccessible(datasheetPath);

  // Track PDF load timing
  useEffect(() => {
    if (fileType === 'pdf' && fileAccessible) {
      setLoadStartTime(performance.now());
    }
  }, [datasheetPath, fileType, fileAccessible]);

  return (
    <Card className={`p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Document Preview</h3>
            <p className="text-sm text-gray-600">{fileName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            title="Download document"
            aria-label={`Download ${fileName}`}
          >
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            title={isExpanded ? 'Collapse preview' : 'Expand preview'}
            aria-label={isExpanded ? 'Collapse document preview' : 'Expand document preview'}
          >
            <Maximize2
              className={`h-4 w-4 ${isExpanded ? 'rotate-180' : ''} transition-transform`}
            />
          </Button>
        </div>
      </div>

      <div
        className={`transition-all duration-300 ${isExpanded ? 'h-auto' : 'h-64 overflow-hidden'}`}
      >
        <Suspense fallback={<DocumentLoading />}>
          {(() => {
            const proxiedUrl = getProxiedUrl(datasheetPath);
            console.log('[DEBUG] DocumentPreview: Rendering decision', {
              fileType,
              fileAccessible,
              proxiedUrl,
              originalUrl: datasheetPath,
              isExpanded,
              productId,
              productName,
              timestamp: new Date().toISOString(),
            });

            if (fileType === 'pdf' && fileAccessible) {
              console.log('[DEBUG] DocumentPreview: Rendering PDF viewer', {
                proxiedUrl,
                productId,
                productName,
              });
              console.log('[DEBUG] DocumentPreview: About to render PDFViewer component', {
                proxiedUrl,
                fileType,
                fileAccessible,
                productId,
                productName,
                timestamp: new Date().toISOString(),
              });
            }

            return fileType === 'pdf' && fileAccessible ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <PDFViewer
                  file={proxiedUrl}
                  onLoadSuccess={(data: { numPages: number }) => {
                    console.log('[DEBUG] DocumentPreview: PDF onLoadSuccess called', {
                      data,
                      productId,
                      productName,
                    });
                    setLoadStartTime(0); // Reset for next load
                    handlePdfLoadSuccess(data);
                  }}
                  onLoadError={(error: Error) => {
                    console.log('[DEBUG] DocumentPreview: PDF onLoadError called', {
                      error: error.message,
                      productId,
                      productName,
                    });
                    setLoadStartTime(0);
                    handlePdfLoadError(error);
                  }}
                >
                  {pdfError ? (
                    <DocumentError />
                  ) : (
                    <div className="flex justify-center">
                      <PDFPage
                        pageNumber={1}
                        scale={isExpanded ? 1.5 : 1.0}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        onRenderError={(error: any) => {
                          console.error('[ERROR] DocumentPreview: PDF page render error', {
                            error: error.message,
                            stack: error.stack,
                            productId,
                            productName,
                          });
                          handlePdfLoadError(new Error(`PDF rendering failed: ${error.message}`));
                        }}
                      />
                    </div>
                  )}
                </PDFViewer>
                {numPages > 1 && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Showing first page of {numPages} total pages
                  </p>
                )}
              </div>
            ) : fileType === 'word' && fileAccessible ? (
              <WordDocumentPreview filePath={getProxiedUrl(datasheetPath)} />
            ) : (
              <div className="flex items-center justify-center h-32 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Eye className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="mt-2 text-sm text-gray-600">
                    {fileAccessible
                      ? 'Preview not available for this file type'
                      : 'Local file preview not supported for security reasons'}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {fileAccessible
                      ? 'Document can be downloaded and viewed externally'
                      : 'Upload the file to a server or use a network URL for preview'}
                  </p>
                  <Button variant="secondary" size="sm" onClick={handleDownload} className="mt-2">
                    {fileAccessible ? 'Open Document' : 'Download File'}
                  </Button>
                </div>
              </div>
            );
          })()}
        </Suspense>
      </div>

      {!isExpanded && (
        <div className="mt-4 text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleExpanded}
            className="text-blue-600 hover:text-blue-800"
          >
            <Maximize2 className="h-4 w-4 mr-1" />
            Expand Preview
          </Button>
        </div>
      )}
    </Card>
  );
}
