/**
 * PosalPro MVP2 - Enhanced Image Optimization Service
 * User Story: US-6.1 (Performance Monitoring), US-6.2 (Memory Optimization)
 * Hypothesis: H8 (Memory Efficiency), H9 (Performance Optimization)
 *
 * ✅ FOLLOWS: CORE_REQUIREMENTS.md patterns
 * ✅ USES: Sharp for server-side image optimization
 * ✅ PROVIDES: WebP/AVIF conversion, responsive images, compression
 */

import { ErrorCodes } from '@/lib/errors/ErrorCodes';
import { ErrorHandlingService } from '@/lib/errors/ErrorHandlingService';
import { StandardError } from '@/lib/errors/StandardError';
import { logError, logInfo, logWarn } from '@/lib/logger';

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

class ImageOptimizationService {
  private static instance: ImageOptimizationService | null = null;
  private errorHandlingService: ErrorHandlingService;

  private constructor() {
    this.errorHandlingService = ErrorHandlingService.getInstance();
  }

  public static getInstance(): ImageOptimizationService {
    if (!ImageOptimizationService.instance) {
      ImageOptimizationService.instance = new ImageOptimizationService();
    }
    return ImageOptimizationService.instance;
  }

  /**
   * Optimize a single image with multiple format support
   */
  public async optimizeImage(
    imageBuffer: Buffer,
    options: ImageOptimizationOptions = {}
  ): Promise<OptimizationResult> {
    try {
      const {
        width = 800,
        height = 600,
        quality = 85,
        format = 'webp',
        progressive = true,
        blur = 0,
        fit = 'cover',
      } = options;

      // Dynamic import of Sharp to avoid bundling issues
      const sharp = await this.getSharpInstance();

      const originalSize = imageBuffer.length;
      const optimizedFormat = format;

      // Apply optimizations
      let sharpInstance = sharp(imageBuffer)
        .resize(width, height, { fit })
        .jpeg({ quality, progressive })
        .png({ quality, progressive });

      // Apply format-specific optimizations
      switch (format) {
        case 'webp':
          sharpInstance = sharp(imageBuffer)
            .resize(width, height, { fit })
            .webp({ quality, effort: 6 });
          break;
        case 'avif':
          sharpInstance = sharp(imageBuffer)
            .resize(width, height, { fit })
            .avif({ quality, effort: 4 });
          break;
        case 'jpeg':
          sharpInstance = sharp(imageBuffer)
            .resize(width, height, { fit })
            .jpeg({ quality, progressive });
          break;
        case 'png':
          sharpInstance = sharp(imageBuffer)
            .resize(width, height, { fit })
            .png({ quality, progressive });
          break;
      }

      // Apply blur if specified
      if (blur > 0) {
        sharpInstance = sharpInstance.blur(blur);
      }

      const optimizedBuffer = await sharpInstance.toBuffer();

      const optimizedSize = optimizedBuffer.length;
      const compressionRatio = optimizedSize / originalSize;

      // Get image metadata
      const metadata = await sharp(optimizedBuffer).metadata();

      const result: OptimizationResult = {
        originalSize,
        optimizedSize,
        compressionRatio,
        format: optimizedFormat,
        width: metadata.width || width,
        height: metadata.height || height,
        success: true,
        url: this.bufferToDataUrl(optimizedBuffer, `image/${optimizedFormat}`),
      };

      logInfo('ImageOptimizationService: Image optimized successfully', {
        component: 'ImageOptimizationService',
        operation: 'optimizeImage',
        originalSize,
        optimizedSize,
        compressionRatio,
        format: optimizedFormat,
        width: metadata.width,
        height: metadata.height,
      });

      return result;
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Failed to optimize image',
        ErrorCodes.BUSINESS.PROCESS_FAILED,
        {
          component: 'ImageOptimizationService',
          operation: 'optimizeImage',
          options,
        }
      );

      logError('ImageOptimizationService: Image optimization failed', {
        component: 'ImageOptimizationService',
        operation: 'optimizeImage',
        error: processedError,
        options,
      });

      throw processedError;
    }
  }

  /**
   * Generate responsive image set with multiple formats
   */
  public async generateResponsiveImageSet(
    imageBuffer: Buffer,
    baseOptions: ImageOptimizationOptions = {}
  ): Promise<ResponsiveImageSet> {
    try {
      const sizes = {
        thumbnail: { width: 150, height: 150 },
        medium: { width: 400, height: 300 },
        large: { width: 800, height: 600 },
      };

      // Generate original format
      const original = await this.optimizeImage(imageBuffer, {
        ...baseOptions,
        ...sizes.large,
      });

      // Generate WebP version
      const webp = await this.optimizeImage(imageBuffer, {
        ...baseOptions,
        ...sizes.large,
        format: 'webp',
      });

      // Generate AVIF version
      const avif = await this.optimizeImage(imageBuffer, {
        ...baseOptions,
        ...sizes.large,
        format: 'avif',
      });

      // Generate responsive sizes
      const responsiveSizes = {
        thumbnail: await this.optimizeImage(imageBuffer, {
          ...baseOptions,
          ...sizes.thumbnail,
          format: 'webp',
        }),
        medium: await this.optimizeImage(imageBuffer, {
          ...baseOptions,
          ...sizes.medium,
          format: 'webp',
        }),
        large: await this.optimizeImage(imageBuffer, {
          ...baseOptions,
          ...sizes.large,
          format: 'webp',
        }),
      };

      const result: ResponsiveImageSet = {
        original,
        webp,
        avif,
        sizes: responsiveSizes,
      };

      logInfo('ImageOptimizationService: Responsive image set generated', {
        component: 'ImageOptimizationService',
        operation: 'generateResponsiveImageSet',
        originalSize: original.originalSize,
        totalOptimizedSize: original.optimizedSize + webp.optimizedSize + avif.optimizedSize,
        compressionRatio:
          (original.optimizedSize + webp.optimizedSize + avif.optimizedSize) /
          (original.originalSize * 3),
      });

      return result;
    } catch (error) {
      const processedError = this.errorHandlingService.processError(
        error,
        'Failed to generate responsive image set',
        ErrorCodes.BUSINESS.PROCESS_FAILED,
        {
          component: 'ImageOptimizationService',
          operation: 'generateResponsiveImageSet',
          baseOptions,
        }
      );

      logError('ImageOptimizationService: Responsive image set generation failed', {
        component: 'ImageOptimizationService',
        operation: 'generateResponsiveImageSet',
        error: processedError,
        baseOptions,
      });

      throw processedError;
    }
  }

  /**
   * Check if browser supports WebP/AVIF
   */
  public async checkFormatSupport(): Promise<{
    webp: boolean;
    avif: boolean;
  }> {
    try {
      // This would typically be done client-side
      // For server-side, we assume modern browsers support WebP
      return {
        webp: true,
        avif: false, // AVIF support is still limited
      };
    } catch (error) {
      logWarn('ImageOptimizationService: Format support check failed', {
        component: 'ImageOptimizationService',
        operation: 'checkFormatSupport',
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        webp: false,
        avif: false,
      };
    }
  }

  /**
   * Generate optimized image URL with format detection
   */
  public generateOptimizedUrl(originalUrl: string, options: ImageOptimizationOptions = {}): string {
    try {
      const { width, height, quality = 85, format = 'webp' } = options;

      // For Next.js Image component, we can use query parameters
      const params = new URLSearchParams();

      if (width) params.set('w', width.toString());
      if (height) params.set('h', height.toString());
      if (quality !== 85) params.set('q', quality.toString());
      if (format !== 'webp') params.set('f', format);

      const queryString = params.toString();
      return queryString ? `${originalUrl}?${queryString}` : originalUrl;
    } catch (error) {
      logWarn('ImageOptimizationService: URL generation failed', {
        component: 'ImageOptimizationService',
        operation: 'generateOptimizedUrl',
        originalUrl,
        options,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return originalUrl;
    }
  }

  /**
   * Get Sharp instance with error handling
   */
  private async getSharpInstance(): Promise<any> {
    try {
      const sharp = await import('sharp');
      return sharp.default || sharp;
    } catch (error) {
      logError('ImageOptimizationService: Sharp not available', {
        component: 'ImageOptimizationService',
        operation: 'getSharpInstance',
        error: error instanceof Error ? error.message : 'Sharp import failed',
      });

      throw new StandardError({
        message: 'Sharp library not available for image optimization',
        code: ErrorCodes.SYSTEM.DEPENDENCY_FAILURE,
        metadata: {
          component: 'ImageOptimizationService',
          operation: 'getSharpInstance',
        },
      });
    }
  }

  /**
   * Convert buffer to data URL
   */
  private bufferToDataUrl(buffer: Buffer, mimeType: string): string {
    const base64 = buffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
  }

  /**
   * Validate image file
   */
  public validateImageFile(file: File): { valid: boolean; error?: string } {
    try {
      // Check file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return {
          valid: false,
          error: `Unsupported file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`,
        };
      }

      // Check file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        return {
          valid: false,
          error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: 5MB`,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error',
      };
    }
  }
}

export const imageOptimizationService = ImageOptimizationService.getInstance();
