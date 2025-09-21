/**
 * PosalPro MVP2 - Image Optimization API Route
 * User Story: US-6.1 (Performance Monitoring), US-6.2 (Memory Optimization)
 * Hypothesis: H8 (Memory Efficiency), H9 (Performance Optimization)
 *
 * ✅ FOLLOWS: CORE_REQUIREMENTS.md patterns
 * ✅ USES: createRoute with proper validation and error handling
 * ✅ PROVIDES: Server-side image optimization with WebP/AVIF support
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { createRoute } from '@/lib/api/route';
import { logError, logInfo } from '@/lib/logger';
import { imageOptimizationService } from '@/lib/services/imageOptimizationService';
import { z } from 'zod';

const ImageOptimizationQuerySchema = z.object({
  url: z.string().url('Invalid image URL'),
  width: z.coerce.number().min(1).max(4000).optional(),
  height: z.coerce.number().min(1).max(4000).optional(),
  quality: z.coerce.number().min(1).max(100).default(85),
  format: z.enum(['webp', 'avif', 'jpeg', 'png']).default('webp'),
  progressive: z.coerce.boolean().default(true),
  blur: z.coerce.number().min(0).max(100).default(0),
  fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).default('cover'),
});

const ImageUploadSchema = z.object({
  file: z.instanceof(File),
  width: z.coerce.number().min(1).max(4000).optional(),
  height: z.coerce.number().min(1).max(4000).optional(),
  quality: z.coerce.number().min(1).max(100).default(85),
  format: z.enum(['webp', 'avif', 'jpeg', 'png']).default('webp'),
  progressive: z.coerce.boolean().default(true),
  blur: z.coerce.number().min(0).max(100).default(0),
  fit: z.enum(['cover', 'contain', 'fill', 'inside', 'outside']).default('cover'),
});

// GET /api/images/optimize - Optimize image from URL
export const GET = createRoute(
  {
    requireAuth: true,
    query: ImageOptimizationQuerySchema,
    roles: ['admin', 'manager', 'sales', 'viewer', 'System Administrator', 'Administrator'],
  },
  async ({ user, requestId, query }) => {
    try {
      logInfo('Image optimization request started', {
        component: 'ImageOptimizationAPI',
        operation: 'optimize_from_url',
        userId: user.id,
        requestId,
        url: query.url,
        options: {
          width: query.width,
          height: query.height,
          quality: query.quality,
          format: query.format,
        },
      });

      // Fetch image from URL
      const response = await fetch(query.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      const imageBuffer = Buffer.from(await response.arrayBuffer());

      // Optimize image
      const result = await imageOptimizationService.optimizeImage(imageBuffer, {
        width: query.width,
        height: query.height,
        quality: query.quality,
        format: query.format,
        progressive: query.progressive,
        blur: query.blur,
        fit: query.fit,
      });

      logInfo('Image optimization completed successfully', {
        component: 'ImageOptimizationAPI',
        operation: 'optimize_from_url',
        userId: user.id,
        requestId,
        originalSize: result.originalSize,
        optimizedSize: result.optimizedSize,
        compressionRatio: result.compressionRatio,
        format: result.format,
      });

      return Response.json({
        ok: true,
        data: result,
      });
    } catch (error) {
      logError('Image optimization failed', {
        component: 'ImageOptimizationAPI',
        operation: 'optimize_from_url',
        userId: user.id,
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        url: query.url,
      });

      throw error;
    }
  }
);

// POST /api/images/optimize - Optimize uploaded image
export const POST = createRoute(
  {
    requireAuth: true,
    body: ImageUploadSchema,
    roles: ['admin', 'manager', 'sales', 'System Administrator', 'Administrator'],
  },
  async ({ user, requestId, body }) => {
    try {
      logInfo('Image optimization upload started', {
        component: 'ImageOptimizationAPI',
        operation: 'optimize_upload',
        userId: user.id,
        requestId,
        fileName: body.file.name,
        fileSize: body.file.size,
        fileType: body.file.type,
        options: {
          width: body.width,
          height: body.height,
          quality: body.quality,
          format: body.format,
        },
      });

      // Validate file
      const validation = imageOptimizationService.validateImageFile(body.file);
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid image file');
      }

      // Convert file to buffer
      const arrayBuffer = await body.file.arrayBuffer();
      const imageBuffer = Buffer.from(arrayBuffer);

      // Optimize image
      const result = await imageOptimizationService.optimizeImage(imageBuffer, {
        width: body.width,
        height: body.height,
        quality: body.quality,
        format: body.format,
        progressive: body.progressive,
        blur: body.blur,
        fit: body.fit,
      });

      logInfo('Image optimization upload completed successfully', {
        component: 'ImageOptimizationAPI',
        operation: 'optimize_upload',
        userId: user.id,
        requestId,
        fileName: body.file.name,
        originalSize: result.originalSize,
        optimizedSize: result.optimizedSize,
        compressionRatio: result.compressionRatio,
        format: result.format,
      });

      return Response.json({
        ok: true,
        data: result,
      });
    } catch (error) {
      logError('Image optimization upload failed', {
        component: 'ImageOptimizationAPI',
        operation: 'optimize_upload',
        userId: user.id,
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        fileName: body.file.name,
      });

      throw error;
    }
  }
);
