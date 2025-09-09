// Optional module stubs to allow compiling without installation
declare module 'zod-to-openapi';

// Global window interface extensions
declare global {
  interface Window {
    pdfWorkerPromise?: Promise<any>;
  }
}
