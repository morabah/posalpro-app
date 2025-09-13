/**
 * PosalPro MVP2 - Product Image Upload Component
 * User Story: US-4.1 (Product Management)
 * Hypothesis: H5 (Modern data fetching improves performance and user experience)
 *
 * ✅ FOLLOWS: FEATURE_IMPLEMENTATION_CHEATSHEET.md patterns
 * ✅ USES: RHF + Zod validation
 * ✅ PROVIDES: Drag & drop, preview, and error handling
 */

'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useUploadProductImage } from '@/features/products/hooks/useProductImages';
import { ImageUploadSchema } from '@/features/products/schemas';
import { Button } from '@/components/ui/forms/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Card } from '@/components/ui/Card';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  productId: string;
  onUploadSuccess?: (imageUrl: string) => void;
  onUploadError?: (error: string) => void;
  maxFiles?: number;
  disabled?: boolean;
  className?: string;
}

export function ImageUpload({
  productId,
  onUploadSuccess,
  onUploadError,
  maxFiles = 10,
  disabled = false,
  className,
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [altText, setAltText] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const uploadMutation = useUploadProductImage();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      // Validate file using Zod schema
      try {
        ImageUploadSchema.parse({ file, alt: altText || undefined });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Invalid file';
        onUploadError?.(errorMessage);
        return;
      }

      // Create preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setSelectedFile(file);
    },
    [altText, onUploadError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'],
    },
    maxFiles: 1,
    disabled: disabled || uploadMutation.isPending,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const result = await uploadMutation.mutateAsync({
        productId,
        file: selectedFile,
        alt: altText || undefined,
      });

      onUploadSuccess?.(result.imageUrl);

      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setAltText('');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      onUploadError?.(errorMessage);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAltText('');
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  return (
    <Card className={cn('w-full', className)}>
      <div className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Upload Product Image</h3>
          </div>

          {/* Drag & Drop Area */}
          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragActive || dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            onDragEnter={() => setDragActive(true)}
            onDragLeave={() => setDragActive(false)}
          >
            <input {...getInputProps()} />
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-gray-400" />
              <div className="text-sm text-gray-600">
                {isDragActive ? (
                  <p>Drop the image here...</p>
                ) : (
                  <div>
                    <p>Drag & drop an image here, or click to select</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports JPEG, PNG, WebP, GIF (max 5MB)
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Preview */}
          {previewUrl && selectedFile && (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleCancel}
                  disabled={uploadMutation.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="alt-text">Alt Text (Optional)</Label>
                <Input
                  id="alt-text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe the image for accessibility"
                  maxLength={200}
                  disabled={uploadMutation.isPending}
                />
                <p className="text-xs text-gray-500">
                  {altText.length}/200 characters
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleUpload}
                  disabled={uploadMutation.isPending}
                  className="flex-1"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  disabled={uploadMutation.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {uploadMutation.error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">
                {uploadMutation.error instanceof Error
                  ? uploadMutation.error.message
                  : 'Upload failed. Please try again.'}
              </div>
            </div>
          )}

          {/* File Info */}
          {selectedFile && (
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <p><strong>File:</strong> {selectedFile.name}</p>
              <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              <p><strong>Type:</strong> {selectedFile.type}</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
