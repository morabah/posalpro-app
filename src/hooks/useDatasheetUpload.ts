// Custom hook for datasheet file uploads
// User Story: US-4.1 (Product Management)
// Hypothesis: H5 (Modern data fetching improves performance and user experience)

import { logDebug, logError, logInfo } from '@/lib/logger';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

interface UploadResponse {
  success: boolean;
  filename: string;
  originalName: string;
  size: number;
  type: string;
  url: string;
  message: string;
}

interface UploadError {
  error: string;
  message?: string;
}

export function useDatasheetUpload() {
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadMutation = useMutation<UploadResponse, UploadError, File>({
    mutationFn: async (file: File) => {
      logDebug('DatasheetUpload: Starting file upload', {
        component: 'useDatasheetUpload',
        operation: 'upload_start',
        filename: file.name,
        size: file.size,
        type: file.type,
      });

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload/datasheet', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      logInfo('DatasheetUpload: File upload successful', {
        component: 'useDatasheetUpload',
        operation: 'upload_success',
        filename: file.name,
        uploadedFilename: result.filename,
        url: result.url,
        size: result.size,
      });

      return result;
    },
    onError: (error, file) => {
      logError('DatasheetUpload: File upload failed', {
        component: 'useDatasheetUpload',
        operation: 'upload_error',
        filename: file.name,
        error: error.message || error.error,
      });
    },
    onSettled: () => {
      setUploadProgress(0);
    },
  });

  const uploadFile = async (file: File): Promise<UploadResponse> => {
    setUploadProgress(0);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 20;
      });
    }, 200);

    try {
      const result = await uploadMutation.mutateAsync(file);
      setUploadProgress(100);
      return result;
    } finally {
      clearInterval(progressInterval);
    }
  };

  return {
    uploadFile,
    isUploading: uploadMutation.isPending,
    uploadProgress,
    error: uploadMutation.error,
    isError: uploadMutation.isError,
    isSuccess: uploadMutation.isSuccess,
    data: uploadMutation.data,
  };
}
