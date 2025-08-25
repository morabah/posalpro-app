/**
 * PosalPro MVP2 - Product Search API Route (New Architecture)
 * Enhanced search functionality with authentication, RBAC, and analytics
 * Component Traceability: US-4.1, H5
 */

import { ok } from '@/lib/api/response';
import { createRoute } from '@/lib/api/route';
import prisma from '@/lib/db/prisma';
import { logError, logInfo } from '@/lib/logger';
import { z } from 'zod';

// ====================
// Validation Schema
// ====================

const ProductSearchSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100),
  limit: z.coerce.number().min(1).max(50).default(10),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ====================
// GET Route - Search Products
// ====================

export const GET = createRoute(
  {
    roles: ['admin', 'sales', 'viewer', 'System Administrator', 'Administrator'],
    query: ProductSearchSchema,
  },
  async ({ query, user }) => {
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
      const products = await prisma.product.findMany({
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
      });

      logInfo('Product search completed successfully', {
        component: 'ProductAPI',
        operation: 'SEARCH',
        count: products.length,
        query: query!.q,
      });

      return Response.json(ok({ items: products }));
    } catch (error) {
      logError('Failed to search products', {
        component: 'ProductAPI',
        operation: 'SEARCH',
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
);
