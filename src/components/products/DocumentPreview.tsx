'use client';

import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/feedback/LoadingSpinner';
import { Button } from '@/components/ui/forms/Button';
import { analytics } from '@/lib/analytics';
import { logDebug, logError, logInfo, logWarn } from '@/lib/logger';
import { AlertCircle, Download, Eye, FileText, Maximize2 } from 'lucide-react';
import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Dynamic imports for PDF and Word document libraries
// ✅ NOTE: PDF.js worker is configured globally in QueryProvider
// To avoid race conditions or duplicate module instances, share a single import promise
const reactPdfModulePromise: Promise<typeof import('react-pdf')> | null =
  typeof window !== 'undefined'
    ? import('react-pdf').then(async module => {
        // Wait for worker init done by QueryProvider, if available
        const globalWorkerPromise = (
          typeof window !== 'undefined' ? (window as any).pdfWorkerPromise : null
        ) as Promise<any> | null;
        if (globalWorkerPromise) {
          try {
            await globalWorkerPromise;
            logDebug('DocumentPreview: PDF worker initialized via global promise', {
              component: 'DocumentPreview',
              operation: 'worker_initialization',
            });
          } catch (error) {
            logError('DocumentPreview: Global worker initialization failed', {
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
              component: 'DocumentPreview',
              operation: 'worker_initialization_error',
            });
          }
        }

        // Fallback worker configuration if none set yet
        if (!module.pdfjs.GlobalWorkerOptions.workerSrc) {
          const cacheBuster = Date.now();
          const workerUrl = `https://unpkg.com/pdfjs-dist@5.3.93/build/pdf.worker.min.mjs?v=${cacheBuster}`;
          module.pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
          logDebug('DocumentPreview: PDF worker configured as fallback', {
            workerUrl,
            cacheBuster,
            component: 'DocumentPreview',
            operation: 'worker_fallback_config',
          });
        }

        logDebug('DocumentPreview: PDF worker status', {
          workerSrc: module.pdfjs.GlobalWorkerOptions.workerSrc,
          configured: !!module.pdfjs.GlobalWorkerOptions.workerSrc,
          component: 'DocumentPreview',
          operation: 'worker_status_check',
        });

        return module;
      })
    : null;

const PDFViewer = React.lazy(() =>
  (reactPdfModulePromise || import('react-pdf')).then(module => ({
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
  }))
);

const PDFPage = React.lazy(() =>
  (reactPdfModulePromise || import('react-pdf')).then(module => ({
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
  const [pdfDocProxy, setPdfDocProxy] = useState<any>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [loadStartTime, setLoadStartTime] = useState<number>(0);
  const [viewerKey, setViewerKey] = useState<number>(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const loadingTaskRef = useRef<any>(null);

  // Detect Safari to enable safer canvas-based rendering for first page
  const isSafari = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    return /Safari\//.test(ua) && !/Chrome\//.test(ua) && !/Chromium\//.test(ua);
  }, []);
  const useCanvasPage = isSafari || process.env.NEXT_PUBLIC_PDF_PAGE_SAFE_MODE === 'true';

  // Debug logging for component initialization
  useEffect(() => {
    logDebug('DocumentPreview: Component initialized', {
      datasheetPath,
      productId,
      productName,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      component: 'DocumentPreview',
      operation: 'component_init',
    });

    // Check CSP headers
    fetch(window.location.origin, { method: 'HEAD' })
      .then(response => {
        const csp = response.headers.get('content-security-policy');
        const cacheControl = response.headers.get('cache-control');
        logDebug('DocumentPreview: CSP headers from server', {
          csp: csp ? csp.substring(0, 200) + '...' : 'No CSP header found',
          cacheControl,
          allHeaders: Object.fromEntries(response.headers.entries()),
          productId,
          productName,
          component: 'DocumentPreview',
          operation: 'csp_check',
        });
      })
      .catch(error => {
        logDebug('DocumentPreview: Failed to fetch CSP headers', {
          error: error.message,
          productId,
          productName,
          component: 'DocumentPreview',
          operation: 'csp_fetch_error',
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
    logDebug('DocumentPreview: File type detected', {
      datasheetPath,
      fileType,
      productId,
      productName,
      component: 'DocumentPreview',
      operation: 'file_type_detection',
    });
  }, [datasheetPath, fileType, productId, productName]);

  // Handle PDF load success
  const handlePdfLoadSuccess = useCallback(
    (doc: any) => {
      const pages = typeof doc?.numPages === 'number' ? doc.numPages : 0;
      setNumPages(pages);
      setPdfDocProxy(doc || null);
      const loadTime = loadStartTime > 0 ? performance.now() - loadStartTime : 0;

      // Store the document reference for cleanup
      loadingTaskRef.current = doc;

      logInfo('PDF document loaded successfully', {
        component: 'DocumentPreview',
        operation: 'handlePdfLoadSuccess',
        productId,
        productName,
        numPages: pages,
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
          numPages: pages,
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
      logDebug('DocumentPreview: PDF load error occurred', {
        errorMessage: error.message || 'Unknown error',
        errorName: error.name || 'UnknownError',
        productId,
        productName,
        datasheetPath,
        timestamp: new Date().toISOString(),
        component: 'DocumentPreview',
        operation: 'pdf_load_error',
      });

      // Check if this is a messageHandler error and provide specific handling
      const isMessageHandlerError =
        error.message.includes('messageHandler') || error.message.includes('sendWithPromise');

      // Check if this is a 404 error (file not found)
      const is404Error =
        error.message.includes('404') ||
        error.message.includes('Unexpected server response (404)') ||
        error.message.includes('File not found');

      if (isMessageHandlerError) {
        logDebug('DocumentPreview: MessageHandler error detected - attempting recovery', {
          productId,
          productName,
          datasheetPath,
          component: 'DocumentPreview',
          operation: 'message_handler_recovery',
        });

        // Try to reconfigure the worker and retry
        setTimeout(() => {
          logDebug('DocumentPreview: Retrying PDF load after messageHandler error', {
            productId,
            productName,
            component: 'DocumentPreview',
            operation: 'pdf_retry',
          });
          setPdfError(null);
          setLoadStartTime(performance.now());
          // Force remount of Document to reinitialize worker communication
          setViewerKey(prev => prev + 1);
        }, 1000);

        setPdfError('PDF worker communication error. Retrying...');
      } else if (is404Error) {
        // Handle 404 errors with specific user guidance
        const isLocalhostUrl = datasheetPath.includes('localhost:8080');
        const errorMessage = isLocalhostUrl
          ? 'File not found on local server. Please ensure the file is uploaded to localhost:8080 or use a network URL.'
          : 'Document not found. Please check the URL or contact support.';

        setPdfError(errorMessage);

        logWarn('DocumentPreview: 404 error - file not found', {
          productId,
          productName,
          datasheetPath,
          isLocalhostUrl,
          component: 'DocumentPreview',
          operation: 'pdf_404_error',
        });
      } else {
        setPdfError(error.message);
      }

      logError('PDF document loading failed', {
        component: 'DocumentPreview',
        operation: 'handlePdfLoadError',
        productId,
        productName,
        datasheetPath,
        errorMessage: error.message || 'Unknown error',
        isMessageHandlerError,
      });

      analytics.trackOptimized(
        'document_preview_error',
        {
          component: 'DocumentPreview',
          productId,
          productName,
          fileType: 'pdf',
          error: error.message,
          isMessageHandlerError,
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
    logDebug('DocumentPreview: isFileAccessible check', {
      path,
      isLocal,
      result,
      productId,
      productName,
      component: 'DocumentPreview',
      operation: 'file_accessibility_check',
    });

    return result;
  };

  // Convert network URL to proxied URL for secure access
  const getProxiedUrl = useCallback(
    (url: string): string => {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        logDebug('DocumentPreview: getProxiedUrl - Local file, returning as-is', {
          url,
          productId,
          productName,
          component: 'DocumentPreview',
          operation: 'proxy_url_local',
        });
        return url; // Local file, return as-is
      }

      const filename = getFileName(url);
      const params = new URLSearchParams({
        url: encodeURIComponent(url),
        filename: filename,
      });

      const proxiedUrl = `${window.location.origin}/api/documents?${params.toString()}`;
      logDebug('DocumentPreview: getProxiedUrl - Network URL converted to proxied URL', {
        originalUrl: url,
        proxiedUrl,
        filename,
        productId,
        productName,
        component: 'DocumentPreview',
        operation: 'proxy_url_conversion',
      });

      return proxiedUrl;
    },
    [productId, productName]
  );

  const fileName = getFileName(datasheetPath);
  const fileAccessible = isFileAccessible(datasheetPath);

  // Memoize proxied URL to avoid unnecessary re-renders of Document component
  const proxiedUrlMemo = useMemo(
    () => getProxiedUrl(datasheetPath),
    [datasheetPath, getProxiedUrl]
  );

  // Render first page to canvas (safe mode)
  useEffect(() => {
    if (!useCanvasPage) return;
    if (!pdfDocProxy || !canvasRef.current) return;

    let cancelled = false;
    let renderTask: any | null = null;

    (async () => {
      try {
        const page = await pdfDocProxy.getPage(1);
        if (cancelled) return;
        const scale = isExpanded ? 1.5 : 1.0;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current!;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Canvas 2D context unavailable');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        renderTask = page.render({ canvasContext: context, viewport });
        await renderTask.promise;
      } catch (err: any) {
        logError('DocumentPreview: Canvas render error', {
          component: 'DocumentPreview',
          operation: 'canvas_render_error',
          errorMessage: err?.message || 'Unknown error',
          productId,
          productName,
        });
        handlePdfLoadError(new Error(`PDF rendering failed: ${err?.message || 'Unknown error'}`));
      }
    })();

    return () => {
      cancelled = true;
      try {
        renderTask?.cancel?.();
      } catch (error) {
        // Ignore cancellation errors
        console.warn('PDF render task cancellation error:', error);
      }
    };
  }, [useCanvasPage, pdfDocProxy, isExpanded, handlePdfLoadError, productId, productName]);

  // Track PDF load timing
  useEffect(() => {
    if (fileType === 'pdf' && fileAccessible) {
      setLoadStartTime(performance.now());
    }
  }, [datasheetPath, fileType, fileAccessible]);

  // Cleanup PDF documents on component unmount or datasheet change
  useEffect(() => {
    return () => {
      // Clean up PDF document when component unmounts or datasheet changes
      if (loadingTaskRef.current && typeof loadingTaskRef.current.destroy === 'function') {
        try {
          loadingTaskRef.current.destroy();
        } catch (error) {
          console.warn('Error destroying PDF document in DocumentPreview:', error);
        }
      }
      loadingTaskRef.current = null;
    };
  }, [datasheetPath]);

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
            const proxiedUrl = proxiedUrlMemo;
            logDebug('DocumentPreview: Rendering decision', {
              fileType,
              fileAccessible,
              proxiedUrl,
              originalUrl: datasheetPath,
              isExpanded,
              productId,
              productName,
              timestamp: new Date().toISOString(),
              component: 'DocumentPreview',
              operation: 'render_decision',
            });

            if (fileType === 'pdf' && fileAccessible) {
              logDebug('DocumentPreview: Rendering PDF viewer', {
                proxiedUrl,
                productId,
                productName,
                component: 'DocumentPreview',
                operation: 'pdf_viewer_render',
              });
              logDebug('DocumentPreview: About to render PDFViewer component', {
                proxiedUrl,
                fileType,
                fileAccessible,
                productId,
                productName,
                timestamp: new Date().toISOString(),
                component: 'DocumentPreview',
                operation: 'pdf_viewer_component_render',
              });
            }

            return fileType === 'pdf' && fileAccessible ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <PDFViewer
                  key={`${proxiedUrlMemo}:${viewerKey}`}
                  file={proxiedUrl}
                  onLoadSuccess={(data: { numPages: number }) => {
                    // Avoid logging the full PDFDocumentProxy (very large & circular)
                    logDebug('DocumentPreview: PDF onLoadSuccess called', {
                      numPages: (data as any)?.numPages,
                      productId,
                      productName,
                      component: 'DocumentPreview',
                      operation: 'pdf_load_success',
                    });
                    setLoadStartTime(0); // Reset for next load
                    handlePdfLoadSuccess(data);
                  }}
                  onLoadError={(error: Error) => {
                    logDebug('DocumentPreview: PDF onLoadError called', {
                      error: error.message,
                      productId,
                      productName,
                      component: 'DocumentPreview',
                      operation: 'pdf_load_error_callback',
                    });
                    setLoadStartTime(0);
                    handlePdfLoadError(error);
                  }}
                >
                  {pdfError ? (
                    <DocumentError />
                  ) : (
                    <div className="flex justify-center">
                      {useCanvasPage ? (
                        <canvas ref={canvasRef} className="max-w-full h-auto" />
                      ) : (
                        // Guard against rendering Page before document fully initialized
                        numPages > 0 && (
                          <PDFPage
                            pageNumber={1}
                            scale={isExpanded ? 1.5 : 1.0}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            onRenderError={(error: any) => {
                              logError('DocumentPreview: PDF page render error', {
                                errorMessage: error?.message || 'Unknown render error',
                                productId,
                                productName,
                                component: 'DocumentPreview',
                                operation: 'pdf_page_render_error',
                              });
                              handlePdfLoadError(
                                new Error(
                                  `PDF rendering failed: ${error?.message || 'Unknown error'}`
                                )
                              );
                            }}
                          />
                        )
                      )}
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
