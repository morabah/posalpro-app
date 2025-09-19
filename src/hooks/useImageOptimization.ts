/**
 * PosalPro MVP2 - Image Optimization Hook
 * User Story: US-6.1 (Performance Monitoring), US-6.2 (Memory Optimization)
 * Hypothesis: H8 (Memory Efficiency), H9 (Performance Optimization)
 *
 * ✅ FOLLOWS: CORE_REQUIREMENTS.md patterns
 * ✅ USES: React Query with proper caching and error handling
 * ✅ PROVIDES: Client-side image optimization utilities
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { useOptimizedAnalytics } from './useOptimizedAnalytics';
import { logDebug, logInfo, logError } from '@/lib/logger';

interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'jpeg' | 'png';
  progressive?: boolean;
  blur?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
}

interface OptimizationResult {
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  format: string;
  width: number;
  height: number;
  success: boolean;
  url: string;
  webpUrl?: string;
  avifUrl?: string;
}

interface ResponsiveImageSet {
  original: OptimizationResult;
  webp: OptimizationResult;
  avif: OptimizationResult;
  sizes: {
    thumbnail: OptimizationResult;
    medium: OptimizationResult;
    large: OptimizationResult;
  };
}

// Optimize image from URL
export function useOptimizeImageFromUrl() {
  const analytics = useOptimizedAnalytics();

  return useMutation({
    mutationFn: async ({ url, options }: { url: string; options?: ImageOptimizationOptions }) => {
      const params = new URLSearchParams();
      params.set('url', url);

      if (options?.width) params.set('width', options.width.toString());
      if (options?.height) params.set('height', options.height.toString());
      if (options?.quality) params.set('quality', options.quality.toString());
      if (options?.format) params.set('format', options.format);
      if (options?.progressive !== undefined)
        params.set('progressive', options.progressive.toString());
      if (options?.blur) params.set('blur', options.blur.toString());
      if (options?.fit) params.set('fit', options.fit);

      const response = await fetch(`/api/images/optimize?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Optimization failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data as OptimizationResult;
    },
    onSuccess: (data, variables) => {
      analytics.trackOptimized('image_optimization_success', {
        component: 'useImageOptimization',
        operation: 'optimize_from_url',
        originalSize: data.originalSize,
        optimizedSize: data.optimizedSize,
        compressionRatio: data.compressionRatio,
        format: data.format,
        userStory: 'US-6.1',
        hypothesis: 'H8',
      });

      logInfo('Image optimization from URL successful', {
        component: 'useImageOptimization',
        operation: 'optimize_from_url',
        url: variables.url,
        originalSize: data.originalSize,
        optimizedSize: data.optimizedSize,
        compressionRatio: data.compressionRatio,
      });
    },
    onError: (error, variables) => {
      analytics.trackOptimized('image_optimization_error', {
        component: 'useImageOptimization',
        operation: 'optimize_from_url',
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-6.1',
        hypothesis: 'H8',
      });

      logError('Image optimization from URL failed', {
        component: 'useImageOptimization',
        operation: 'optimize_from_url',
        url: variables.url,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

// Optimize uploaded image
export function useOptimizeUploadedImage() {
  const analytics = useOptimizedAnalytics();

  return useMutation({
    mutationFn: async ({ file, options }: { file: File; options?: ImageOptimizationOptions }) => {
      const formData = new FormData();
      formData.append('file', file);

      if (options?.width) formData.append('width', options.width.toString());
      if (options?.height) formData.append('height', options.height.toString());
      if (options?.quality) formData.append('quality', options.quality.toString());
      if (options?.format) formData.append('format', options.format);
      if (options?.progressive !== undefined)
        formData.append('progressive', options.progressive.toString());
      if (options?.blur) formData.append('blur', options.blur.toString());
      if (options?.fit) formData.append('fit', options.fit);

      const response = await fetch('/api/images/optimize', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Optimization failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data as OptimizationResult;
    },
    onSuccess: (data, variables) => {
      analytics.trackOptimized('image_optimization_upload_success', {
        component: 'useImageOptimization',
        operation: 'optimize_upload',
        fileName: variables.file.name,
        fileSize: variables.file.size,
        originalSize: data.originalSize,
        optimizedSize: data.optimizedSize,
        compressionRatio: data.compressionRatio,
        format: data.format,
        userStory: 'US-6.1',
        hypothesis: 'H8',
      });

      logInfo('Image optimization upload successful', {
        component: 'useImageOptimization',
        operation: 'optimize_upload',
        fileName: variables.file.name,
        originalSize: data.originalSize,
        optimizedSize: data.optimizedSize,
        compressionRatio: data.compressionRatio,
      });
    },
    onError: (error, variables) => {
      analytics.trackOptimized('image_optimization_upload_error', {
        component: 'useImageOptimization',
        operation: 'optimize_upload',
        fileName: variables.file.name,
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-6.1',
        hypothesis: 'H8',
      });

      logError('Image optimization upload failed', {
        component: 'useImageOptimization',
        operation: 'optimize_upload',
        fileName: variables.file.name,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    },
  });
}

// Check browser format support
export function useFormatSupport() {
  return useQuery({
    queryKey: ['image-format-support'],
    queryFn: async () => {
      const support = {
        webp: false,
        avif: false,
      };

      // Check WebP support
      const webpCanvas = document.createElement('canvas');
      webpCanvas.width = 1;
      webpCanvas.height = 1;
      support.webp = webpCanvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;

      // Check AVIF support
      const avifCanvas = document.createElement('canvas');
      avifCanvas.width = 1;
      avifCanvas.height = 1;
      support.avif = avifCanvas.toDataURL('image/avif').indexOf('data:image/avif') === 0;

      logDebug('Browser format support detected', {
        component: 'useImageOptimization',
        operation: 'format_support_check',
        webp: support.webp,
        avif: support.avif,
      });

      return support;
    },
    staleTime: 300000, // 5 minutes - format support doesn't change
    gcTime: 600000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

// Client-side image optimization utilities
export function useImageOptimizationUtils() {
  const analytics = useOptimizedAnalytics();

  const optimizeImageClient = async (
    file: File,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizationResult> => {
    try {
      const { width = 800, height = 600, quality = 85, format = 'jpeg' } = options;

      // Create canvas for optimization
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');

      // Load image
      const img = new Image();
      img.crossOrigin = 'anonymous';

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      // Calculate optimized dimensions
      let { width: imgWidth, height: imgHeight } = img;

      if (imgWidth > imgHeight && imgWidth > width) {
        imgHeight = (imgHeight * width) / imgWidth;
        imgWidth = width;
      } else if (imgHeight > height) {
        imgWidth = (imgWidth * height) / imgHeight;
        imgHeight = height;
      }

      canvas.width = imgWidth;
      canvas.height = imgHeight;

      // Draw optimized image
      ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

      // Generate optimized data URL
      const mimeType = `image/${format}`;
      const optimizedDataUrl = canvas.toDataURL(mimeType, quality / 100);

      // Estimate file size from data URL
      const optimizedSize = Math.round((optimizedDataUrl.length * 3) / 4);
      const compressionRatio = optimizedSize / file.size;

      const result: OptimizationResult = {
        originalSize: file.size,
        optimizedSize,
        compressionRatio,
        format,
        width: imgWidth,
        height: imgHeight,
        success: true,
        url: optimizedDataUrl,
      };

      analytics.trackOptimized('client_image_optimization_success', {
        component: 'useImageOptimization',
        operation: 'client_optimization',
        originalSize: file.size,
        optimizedSize,
        compressionRatio,
        format,
        userStory: 'US-6.1',
        hypothesis: 'H8',
      });

      // Clean up
      URL.revokeObjectURL(img.src);

      return result;
    } catch (error) {
      analytics.trackOptimized('client_image_optimization_error', {
        component: 'useImageOptimization',
        operation: 'client_optimization',
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-6.1',
        hypothesis: 'H8',
      });

      throw error;
    }
  };

  const generateResponsiveImageSet = async (
    file: File,
    baseOptions: ImageOptimizationOptions = {}
  ): Promise<ResponsiveImageSet> => {
    try {
      const sizes = {
        thumbnail: { width: 150, height: 150 },
        medium: { width: 400, height: 300 },
        large: { width: 800, height: 600 },
      };

      // Generate different sizes
      const [thumbnail, medium, large] = await Promise.all([
        optimizeImageClient(file, { ...baseOptions, ...sizes.thumbnail, format: 'webp' }),
        optimizeImageClient(file, { ...baseOptions, ...sizes.medium, format: 'webp' }),
        optimizeImageClient(file, { ...baseOptions, ...sizes.large, format: 'webp' }),
      ]);

      // Generate original format
      const original = await optimizeImageClient(file, { ...baseOptions, ...sizes.large });

      const result: ResponsiveImageSet = {
        original,
        webp: large,
        avif: large, // For now, same as webp
        sizes: {
          thumbnail,
          medium,
          large,
        },
      };

      analytics.trackOptimized('responsive_image_set_generated', {
        component: 'useImageOptimization',
        operation: 'responsive_set',
        originalSize: file.size,
        totalOptimizedSize: original.optimizedSize + large.optimizedSize + large.optimizedSize,
        userStory: 'US-6.1',
        hypothesis: 'H8',
      });

      return result;
    } catch (error) {
      analytics.trackOptimized('responsive_image_set_error', {
        component: 'useImageOptimization',
        operation: 'responsive_set',
        error: error instanceof Error ? error.message : 'Unknown error',
        userStory: 'US-6.1',
        hypothesis: 'H8',
      });

      throw error;
    }
  };

  return {
    optimizeImageClient,
    generateResponsiveImageSet,
  };
}
