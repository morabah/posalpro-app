/**
 * PosalPro MVP2 - Product Search API Route (New Architecture)
 * Enhanced search functionality with authentication, Rimport { customerQueries, productQueries, proposalQueries, userQueries, workflowQueries, executeQuery } from '@/lib/db/database';
BAC, and analytics
 * Component Traceability: US-4.1, H5
 */

// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = 'nodejs';


import { ProductQuickSearchApiSchema } from '@/features/products/schemas';
import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/prisma';
import { logError, logInfo } from '@/lib/logger';
import { getErrorHandler, withAsyncErrorHandler } from '@/server/api/errorHandler';
import { ErrorCodes } from '@/lib/errors';

// ====================
// Validation Schema
// ====================

const ProductSearchSchema = ProductQuickSearchApiSchema;

// ====================
// GET Route - Search Products
// ====================

export const GET = createRoute(
  {
    roles: ['admin', 'sales', 'viewer', 'System Administrator', 'Administrator'],
    query: ProductSearchSchema,
  },
  async ({ query, user }) => {
    const errorHandler = getErrorHandler({
      component: 'ProductAPI',
      operation: 'SEARCH',
    });

    try {
      logInfo('Searching products', {
        component: 'ProductAPI',
        operation: 'SEARCH',
        userId: user.id,
        query: query!.q,
        limit: query!.limit,
      });

      // Build where clause
      const where: any = {
        OR: [
          { name: { contains: query!.q, mode: 'insensitive' } },
          { description: { contains: query!.q, mode: 'insensitive' } },
          { sku: { contains: query!.q, mode: 'insensitive' } },
        ],
      };

      if (query!.category) {
        where.category = { has: query!.category };
      }

      if (query!.isActive !== undefined) {
        where.isActive = query!.isActive;
      }

      // Execute search query
      const products = await withAsyncErrorHandler(
        () =>
          prisma.product.findMany({
            where,
            select: {
              id: true,
              name: true,
              description: true,
              price: true,
              currency: true,
              sku: true,
              category: true,
              tags: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: [{ name: 'asc' }, { createdAt: 'desc' }],
            take: query!.limit,
          }),
        'Failed to search products in database',
        { component: 'ProductAPI', operation: 'SEARCH' }
      );

      logInfo('Product search completed successfully', {
        component: 'ProductAPI',
        operation: 'SEARCH',
        count: products.length,
        query: query!.q,
      });

      const responseData = { items: products };
      return errorHandler.createSuccessResponse(
        responseData,
        `Found ${products.length} products matching "${query!.q}"`
      );
    } catch (error) {
      logError('Failed to search products', {
        component: 'ProductAPI',
        operation: 'SEARCH',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error; // Let the createRoute wrapper handle the response
    }
  }
);
