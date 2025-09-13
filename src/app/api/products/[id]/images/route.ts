/**
 * PosalPro MVP2 - Product Image Upload API
 * User Story: US-4.1 (Product Management)
 * Hypothesis: H5 (Modern data fetching improves performance and user experience)
 *
 * ✅ FOLLOWS: FEATURE_IMPLEMENTATION_CHEATSHEET.md patterns
 * ✅ USES: createRoute with proper RBAC and validation
 * ✅ DELEGATES: to ProductService for business logic
 */

import { ImageUploadSchema } from '@/features/products/schemas';
import { createRoute } from '@/lib/api/route';
import { ErrorCodes, errorHandlingService } from '@/lib/errors';
import { logError, logInfo } from '@/lib/logger';
import { ProductService } from '@/lib/services/productService';

// POST /api/products/[id]/images - Upload new image(s) for a product
export const POST = createRoute(
  { roles: ['admin', 'manager', 'System Administrator', 'Administrator'] },
  async ({ user, requestId, req }) => {
    // Extract product ID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.indexOf('products') + 1];

    try {
      // Parse FormData for file upload
      const formData = await req.formData();
      const file = formData.get('file') as File;
      const alt = formData.get('alt') as string | null;

      // Validate the file
      if (!file) {
        throw new Error('File is required for upload');
      }

      // Validate using the schema
      const validatedData = ImageUploadSchema.parse({ file, alt: alt || undefined });

      logInfo('Product image upload started', {
        component: 'ProductImageUpload',
        operation: 'upload',
        productId: id,
        fileName: validatedData.file.name,
        fileSize: validatedData.file.size,
        fileType: validatedData.file.type,
        userId: user.id,
        requestId,
      });

      // Initialize ProductService
      const productService = new ProductService();

      // Upload the image file and get the URL
      const imageUrl = await productService.uploadProductImage(
        id,
        validatedData.file,
        validatedData.alt
      );

      logInfo('Product image upload successful', {
        component: 'ProductImageUpload',
        operation: 'upload',
        productId: id,
        imageUrl,
        loadTime: Date.now(),
        requestId,
      });

      return Response.json({
        ok: true,
        data: {
          imageUrl,
          alt: validatedData.alt || validatedData.file.name,
          uploadedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      const processedError = errorHandlingService.processError(
        error,
        'Failed to upload product image',
        ErrorCodes.BUSINESS.PROCESS_FAILED,
        {
          component: 'ProductImageUpload',
          operation: 'upload',
          productId: id,
          userId: user.id,
          requestId,
        }
      );

      logError('Product image upload failed', {
        component: 'ProductImageUpload',
        operation: 'upload',
        productId: id,
        error: processedError,
        requestId,
      });

      throw processedError;
    }
  }
);

// GET /api/products/[id]/images - Get all images for a product
export const GET = createRoute(
  { roles: ['admin', 'manager', 'sales', 'viewer', 'System Administrator', 'Administrator'] },
  async ({ user, requestId, req }) => {
    // Extract product ID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.indexOf('products') + 1];

    try {
      logInfo('Product images fetch started', {
        component: 'ProductImageFetch',
        operation: 'fetch',
        productId: id,
        userId: user.id,
        requestId,
      });

      // Initialize ProductService
      const productService = new ProductService();

      // Get product with images
      const product = await productService.getProductById(id);

      if (!product) {
        throw new Error('Product not found');
      }

      const images = product.images || [];

      logInfo('Product images fetch successful', {
        component: 'ProductImageFetch',
        operation: 'fetch',
        productId: id,
        imageCount: images.length,
        loadTime: Date.now(),
        requestId,
      });

      return Response.json({
        ok: true,
        data: {
          productId: id,
          images,
          count: images.length,
        },
      });
    } catch (error) {
      const processedError = errorHandlingService.processError(
        error,
        'Failed to fetch product images',
        ErrorCodes.BUSINESS.PROCESS_FAILED,
        {
          component: 'ProductImageFetch',
          operation: 'fetch',
          productId: id,
          userId: user.id,
          requestId,
        }
      );

      logError('Product images fetch failed', {
        component: 'ProductImageFetch',
        operation: 'fetch',
        productId: id,
        error: processedError,
        requestId,
      });

      throw processedError;
    }
  }
);

// DELETE /api/products/[id]/images - Delete specific image from product
export const DELETE = createRoute(
  { roles: ['admin', 'manager', 'System Administrator', 'Administrator'] },
  async ({ user, requestId, req }) => {
    // Extract product ID from URL path
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.indexOf('products') + 1];

    try {
      // Extract imageUrl from query parameters
      const imageUrl = url.searchParams.get('imageUrl');

      if (!imageUrl) {
        throw new Error('Image URL is required for deletion');
      }

      logInfo('Product image deletion started', {
        component: 'ProductImageDelete',
        operation: 'delete',
        productId: id,
        imageUrl,
        userId: user.id,
        requestId,
      });

      // Initialize ProductService
      const productService = new ProductService();

      // Remove image from product
      await productService.removeProductImage(id, imageUrl);

      logInfo('Product image deletion successful', {
        component: 'ProductImageDelete',
        operation: 'delete',
        productId: id,
        imageUrl,
        loadTime: Date.now(),
        requestId,
      });

      return Response.json({
        ok: true,
        data: {
          message: 'Image deleted successfully',
          deletedImageUrl: imageUrl,
        },
      });
    } catch (error) {
      const processedError = errorHandlingService.processError(
        error,
        'Failed to delete product image',
        ErrorCodes.BUSINESS.PROCESS_FAILED,
        {
          component: 'ProductImageDelete',
          operation: 'delete',
          productId: id,
          userId: user.id,
          requestId,
        }
      );

      logError('Product image deletion failed', {
        component: 'ProductImageDelete',
        operation: 'delete',
        productId: id,
        error: processedError,
        requestId,
      });

      throw processedError;
    }
  }
);
