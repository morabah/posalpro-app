// File Upload API Route for Datasheets
// Uploads files to the local development server (localhost:8080)
// User Story: US-4.1 (Product Management)
// Hypothesis: H5 (Modern data fetching improves performance and user experience)

import { logDebug, logError, logInfo } from '@/lib/logger';
import { mkdir, writeFile } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';

export const dynamic = 'force-dynamic';

// Allowed file types for datasheets
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/rtf',
  'application/rtf',
];

// Allowed file extensions
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.rtf'];

// Maximum file size (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const startTime = performance.now();

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    logDebug('API: File upload request received', {
      component: 'DatasheetUploadAPI',
      operation: 'POST /api/upload/datasheet',
      filename: file.name,
      size: file.size,
      type: file.type,
    });

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      logError('API: Invalid file type', {
        component: 'DatasheetUploadAPI',
        operation: 'POST /api/upload/datasheet',
        filename: file.name,
        type: file.type,
        allowedTypes: ALLOWED_TYPES,
      });

      return NextResponse.json(
        { error: 'Invalid file type. Allowed types: PDF, DOC, DOCX, XLS, XLSX, TXT, RTF' },
        { status: 400 }
      );
    }

    // Validate file extension
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
      logError('API: Invalid file extension', {
        component: 'DatasheetUploadAPI',
        operation: 'POST /api/upload/datasheet',
        filename: file.name,
        extension: fileExtension,
        allowedExtensions: ALLOWED_EXTENSIONS,
      });

      return NextResponse.json({ error: 'Invalid file extension' }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      logError('API: File too large', {
        component: 'DatasheetUploadAPI',
        operation: 'POST /api/upload/datasheet',
        filename: file.name,
        size: file.size,
        maxSize: MAX_FILE_SIZE,
      });

      return NextResponse.json(
        { error: `File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 413 }
      );
    }

    // Create safe filename (remove special characters, handle spaces)
    const safeFilename = file.name
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');

    // Ensure the public/docs directory exists
    const uploadDir = join(process.cwd(), 'public', 'docs');
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }

    // Write file to public/docs directory
    const filePath = join(uploadDir, safeFilename);
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));

    const loadTime = performance.now() - startTime;
    const fileUrl = `http://localhost:8080/${safeFilename}`;

    logInfo('API: File uploaded successfully', {
      component: 'DatasheetUploadAPI',
      operation: 'POST /api/upload/datasheet',
      filename: file.name,
      safeFilename,
      size: file.size,
      type: file.type,
      fileUrl,
      loadTime: Math.round(loadTime),
    });

    return NextResponse.json({
      success: true,
      filename: safeFilename,
      originalName: file.name,
      size: file.size,
      type: file.type,
      url: fileUrl,
      message: 'File uploaded successfully',
    });
  } catch (error) {
    const loadTime = performance.now() - startTime;

    logError('API: File upload failed', {
      component: 'DatasheetUploadAPI',
      operation: 'POST /api/upload/datasheet',
      error: error instanceof Error ? error.message : 'Unknown error',
      loadTime: Math.round(loadTime),
    });

    return NextResponse.json({ error: 'File upload failed' }, { status: 500 });
  }
}
