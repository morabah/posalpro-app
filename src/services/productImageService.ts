/**
 * PosalPro MVP2 - Product Image Service
 * User Story: US-4.1 (Product Management)
 * Hypothesis: H5 (Modern data fetching improves performance and user experience)
 *
 * ✅ FOLLOWS: FEATURE_IMPLEMENTATION_CHEATSHEET.md patterns
 * ✅ USES: http client with proper unwrapping
 * ✅ PROVIDES: Type-safe image operations
 */

import { http } from '@/lib/http';
// import { ImageUpload, ProductImages } from '@/features/products/schemas';

export interface ImageUploadResponse {
  imageUrl: string;
  alt?: string;
  uploadedAt: string;
}

export interface ProductImagesResponse {
  productId: string;
  images: string[];
  count: number;
}

export interface ImageDeleteResponse {
  message: string;
  deletedImageUrl: string;
}

export const productImageClient = {
  /**
   * Upload image for a product
   */
  upload: async (productId: string, file: File, alt?: string): Promise<ImageUploadResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    if (alt) {
      formData.append('alt', alt);
    }

    return http.post<ImageUploadResponse>(`/api/products/${productId}/images`, formData);
  },

  /**
   * Get all images for a product
   */
  getImages: async (productId: string): Promise<ProductImagesResponse> => {
    return http.get<ProductImagesResponse>(`/api/products/${productId}/images`);
  },

  /**
   * Delete specific image from product
   */
  deleteImage: async (productId: string, imageUrl: string): Promise<ImageDeleteResponse> => {
    const encodedImageUrl = encodeURIComponent(imageUrl);
    return http.delete<ImageDeleteResponse>(
      `/api/products/${productId}/images?imageUrl=${encodedImageUrl}`
    );
  },

  /**
   * Update product images array
   */
  updateImages: async (
    productId: string,
    images: string[]
  ): Promise<{ ok: boolean; data: any }> => {
    return http.put(`/api/products/${productId}`, { images });
  },
};
