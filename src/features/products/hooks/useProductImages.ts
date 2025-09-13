/**
 * PosalPro MVP2 - Product Image Hooks
 * User Story: US-4.1 (Product Management)
 * Hypothesis: H5 (Modern data fetching improves performance and user experience)
 *
 * ✅ FOLLOWS: FEATURE_IMPLEMENTATION_CHEATSHEET.md patterns
 * ✅ USES: React Query with proper invalidation
 * ✅ PROVIDES: Optimistic updates and error handling
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { productImageClient } from '@/services/productImageService';
import { productKeys } from '../keys';
import { logError, logInfo } from '@/lib/logger';
import { ErrorCodes, errorHandlingService } from '@/lib/errors';

/**
 * Hook to fetch product images
 */
export function useProductImages(productId: string) {
  return useQuery({
    queryKey: productKeys.images(productId),
    queryFn: () => productImageClient.getImages(productId),
    staleTime: 30000, // 30 seconds
    gcTime: 120000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: 1,
    enabled: !!productId,
  });
}

/**
 * Hook to upload product image
 */
export function useUploadProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, file, alt }: { productId: string; file: File; alt?: string }) => {
      logInfo('Product image upload started', {
        component: 'useUploadProductImage',
        operation: 'upload',
        productId,
        fileName: file.name,
        fileSize: file.size,
      });

      return productImageClient.upload(productId, file, alt);
    },
    onSuccess: (data, variables) => {
      logInfo('Product image upload successful', {
        component: 'useUploadProductImage',
        operation: 'upload',
        productId: variables.productId,
        imageUrl: data.imageUrl,
      });

      // Invalidate and refetch product images
      queryClient.invalidateQueries({ queryKey: productKeys.images(variables.productId) });

      // Also invalidate the product itself to refresh the images array
      queryClient.invalidateQueries({ queryKey: productKeys.byId(variables.productId) });

      // Invalidate product lists to show updated image counts
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
    onError: (error, variables) => {
      const processedError = errorHandlingService.processError(
        error,
        'Failed to upload product image',
        ErrorCodes.BUSINESS.PROCESS_FAILED,
        {
          component: 'useUploadProductImage',
          operation: 'upload',
          productId: variables.productId,
        }
      );

      logError('Product image upload failed', {
        component: 'useUploadProductImage',
        operation: 'upload',
        productId: variables.productId,
        error: processedError,
      });
    },
  });
}

/**
 * Hook to delete product image
 */
export function useDeleteProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, imageUrl }: { productId: string; imageUrl: string }) => {
      logInfo('Product image deletion started', {
        component: 'useDeleteProductImage',
        operation: 'delete',
        productId,
        imageUrl,
      });

      return productImageClient.deleteImage(productId, imageUrl);
    },
    onSuccess: (data, variables) => {
      logInfo('Product image deletion successful', {
        component: 'useDeleteProductImage',
        operation: 'delete',
        productId: variables.productId,
        imageUrl: data.deletedImageUrl,
      });

      // Invalidate and refetch product images
      queryClient.invalidateQueries({ queryKey: productKeys.images(variables.productId) });

      // Also invalidate the product itself to refresh the images array
      queryClient.invalidateQueries({ queryKey: productKeys.byId(variables.productId) });

      // Invalidate product lists to show updated image counts
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
    onError: (error, variables) => {
      const processedError = errorHandlingService.processError(
        error,
        'Failed to delete product image',
        ErrorCodes.BUSINESS.PROCESS_FAILED,
        {
          component: 'useDeleteProductImage',
          operation: 'delete',
          productId: variables.productId,
        }
      );

      logError('Product image deletion failed', {
        component: 'useDeleteProductImage',
        operation: 'delete',
        productId: variables.productId,
        error: processedError,
      });
    },
  });
}

/**
 * Hook to update product images array
 */
export function useUpdateProductImages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, images }: { productId: string; images: string[] }) => {
      logInfo('Product images update started', {
        component: 'useUpdateProductImages',
        operation: 'update',
        productId,
        imageCount: images.length,
      });

      return productImageClient.updateImages(productId, images);
    },
    onSuccess: (data, variables) => {
      logInfo('Product images update successful', {
        component: 'useUpdateProductImages',
        operation: 'update',
        productId: variables.productId,
      });

      // Invalidate and refetch product images
      queryClient.invalidateQueries({ queryKey: productKeys.images(variables.productId) });

      // Also invalidate the product itself to refresh the images array
      queryClient.invalidateQueries({ queryKey: productKeys.byId(variables.productId) });

      // Invalidate product lists to show updated image counts
      queryClient.invalidateQueries({ queryKey: productKeys.all });
    },
    onError: (error, variables) => {
      const processedError = errorHandlingService.processError(
        error,
        'Failed to update product images',
        ErrorCodes.BUSINESS.PROCESS_FAILED,
        {
          component: 'useUpdateProductImages',
          operation: 'update',
          productId: variables.productId,
        }
      );

      logError('Product images update failed', {
        component: 'useUpdateProductImages',
        operation: 'update',
        productId: variables.productId,
        error: processedError,
      });
    },
  });
}
