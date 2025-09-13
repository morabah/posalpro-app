/**
 * PosalPro MVP2 - Product Image Gallery Component
 * User Story: US-4.1 (Product Management)
 * Hypothesis: H5 (Modern data fetching improves performance and user experience)
 *
 * ✅ FOLLOWS: FEATURE_IMPLEMENTATION_CHEATSHEET.md patterns
 * ✅ PROVIDES: Grid layout, lightbox, and delete functionality
 * ✅ ACCESSIBLE: Full keyboard and screen reader support
 */

'use client';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/forms/Button';
import { useDeleteProductImage } from '@/features/products/hooks/useProductImages';
import React, { useState } from 'react';
// Removed alert import - using custom error display
import { cn } from '@/lib/utils';
import { AlertTriangle, Image as ImageIcon, Loader2, Trash2, X, ZoomIn } from 'lucide-react';

interface ImageGalleryProps {
  productId: string;
  images: string[];
  onImageDelete?: (imageUrl: string) => void;
  onImageDeleteError?: (error: string) => void;
  maxImages?: number;
  className?: string;
  showDeleteButton?: boolean; // New prop to control delete button visibility
}

export function ImageGallery({
  productId,
  images,
  onImageDelete,
  onImageDeleteError,
  maxImages = 10,
  className,
  showDeleteButton = true, // Default to true for backward compatibility
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [deletingImage, setDeletingImage] = useState<string | null>(null);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  const deleteMutation = useDeleteProductImage();

  const handleDeleteImage = async (imageUrl: string) => {
    if (deletingImage) return;

    try {
      setDeletingImage(imageUrl);
      await deleteMutation.mutateAsync({
        productId,
        imageUrl,
      });

      onImageDelete?.(imageUrl);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete failed';
      onImageDeleteError?.(errorMessage);
    } finally {
      setDeletingImage(null);
    }
  };

  const handleImageClick = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  const handleCloseLightbox = () => {
    setSelectedImage(null);
  };

  const handleKeyDown = (event: React.KeyboardEvent, imageUrl: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleImageClick(imageUrl);
    } else if (event.key === 'Escape') {
      handleCloseLightbox();
    }
  };

  if (images.length === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <div className="p-6">
          <div className="text-center text-gray-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No images uploaded yet</p>
            <p className="text-sm">Upload images to showcase your product</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className={cn('w-full', className)}>
        <div className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Product Images</h3>
              <span className="text-sm text-gray-500">
                {images.length} / {maxImages} images
              </span>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((imageUrl, index) => (
                <div
                  key={imageUrl}
                  className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200"
                >
                  {brokenImages.has(imageUrl) ? (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400">
                      <ImageIcon className="h-8 w-8" aria-hidden="true" />
                    </div>
                  ) : (
                    <img
                      src={imageUrl}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-full object-cover cursor-pointer transition-transform group-hover:scale-105"
                      loading="lazy"
                      decoding="async"
                      crossOrigin="anonymous"
                      onError={() => {
                        setBrokenImages(prev => new Set(prev).add(imageUrl));
                      }}
                      onClick={() => handleImageClick(imageUrl)}
                      onKeyDown={e => handleKeyDown(e, imageUrl)}
                      tabIndex={0}
                      role="button"
                      aria-label={`View product image ${index + 1}`}
                    />
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          handleImageClick(imageUrl);
                        }}
                        className="bg-white/90 hover:bg-white"
                      >
                        <ZoomIn className="h-4 w-4" />
                      </Button>
                      {showDeleteButton && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleDeleteImage(imageUrl);
                          }}
                          disabled={deletingImage === imageUrl}
                          className="bg-red-500/90 hover:bg-red-500"
                        >
                          {deletingImage === imageUrl ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Image Number */}
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>

            {/* Error Display */}
            {deleteMutation.error && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                  <div className="text-sm text-red-700">
                    {deleteMutation.error instanceof Error
                      ? deleteMutation.error.message
                      : 'Failed to delete image. Please try again.'}
                  </div>
                </div>
              </div>
            )}

            {/* Warning for max images */}
            {images.length >= maxImages && (
              <div className="rounded-md bg-yellow-50 p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                  <div className="text-sm text-yellow-700">
                    You've reached the maximum number of images ({maxImages}). Delete an existing
                    image to upload a new one.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={handleCloseLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
        >
          <div className="relative max-w-4xl max-h-full">
            {brokenImages.has(selectedImage) ? (
              <div className="w-[70vw] h-[70vh] flex items-center justify-center bg-gray-100 rounded-lg">
                <ImageIcon className="h-10 w-10 text-gray-400" aria-hidden="true" />
              </div>
            ) : (
              <img
                src={selectedImage}
                alt="Product image"
                className="max-w-full max-h-full object-contain rounded-lg"
                loading="eager"
                decoding="async"
                crossOrigin="anonymous"
                onError={() => {
                  setBrokenImages(prev => new Set(prev).add(selectedImage));
                }}
              />
            )}

            <Button
              variant="danger"
              size="sm"
              className="absolute top-4 right-4"
              onClick={handleCloseLightbox}
              aria-label="Close image viewer"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
