/**
 * PosalPro MVP2 - Product Tags API Routes
 * Enhanced tag management with analytics tracking
 * Component Traceability: US-3.1, US-3.2, H3
 */
import { createRoute } from '@/lib/api/route';
import { validateApiPermission } from '@/lib/auth/apiAuthorization';

import {
  customerQueries,
  productQueries,
  proposalQueries,
  userQueries,
  workflowQueries,
  executeQuery,
} from '@/lib/db/database';
import prisma from '@/lib/db/prisma';
import { logError, logInfo } from '@/lib/logger';
import { NextResponse } from 'next/server';

/**
 * Component Traceability Matrix:
 * - User Stories: US-3.1 (Product Management), US-3.2 (Product Selection)
 * - Acceptance Criteria: AC-3.1.5, AC-3.2.5
 * - Hypotheses: H3 (SME Contribution Efficiency)
 * - Methods: getProductTags(), getTagStats()
 * - Test Cases: TC-H3-004
 */

/**
 * GET /api/products/tags - Get all product tags with statistics
 */
export const GET = createRoute({}, async ({ req, user }) => {
  await validateApiPermission(req, 'products:read');
  const start = Date.now();

  try {
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const includeStats = searchParams.get('includeStats') === 'true';
    const activeOnly = searchParams.get('activeOnly') !== 'false'; // Default to true
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get all products to extract tags
    const products = await prisma.product.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      select: {
        id: true,
        tags: true,
        price: true,
        currency: true,
        isActive: true,
        _count: {
          select: {
            proposalProducts: true,
          },
        },
      },
    });

    // Extract unique tags and build statistics
    const tagMap = new Map<
      string,
      {
        name: string;
        count: number;
        avgPrice: number;
        totalUsage: number;
        activeProducts: number;
        products: string[];
      }
    >();

    products.forEach((product: any) => {
      product.tags.forEach((tag: any) => {
        if (!tagMap.has(tag)) {
          tagMap.set(tag, {
            name: tag,
            count: 0,
            avgPrice: 0,
            totalUsage: 0,
            activeProducts: 0,
            products: [],
          });
        }

        const tagData = tagMap.get(tag)!;
        tagData.count++;
        tagData.products.push(product.id);
        tagData.totalUsage += product._count.proposalProducts;

        if (product.isActive) {
          tagData.activeProducts++;
        }
      });
    });

    // Calculate average prices
    tagMap.forEach((tagData, tagName) => {
      const tagProducts = products.filter((p: any) => p.tags.includes(tagName));
      const totalPrice = tagProducts.reduce((sum: number, p: any) => sum + Number(p.price), 0);
      tagData.avgPrice = tagProducts.length > 0 ? totalPrice / tagProducts.length : 0;
    });

    // Convert to array and filter by search
    let tags = Array.from(tagMap.values());

    // Apply search filter
    if (search) {
      tags = tags.filter(tag => tag.name.toLowerCase().includes(search.toLowerCase()));
    }

    // Sort by usage and limit results
    tags = tags.sort((a, b) => b.totalUsage - a.totalUsage).slice(0, limit);

    logInfo('Product tags retrieved successfully', {
      component: 'ProductTagsAPI',
      operation: 'GET',
      totalTags: tags.length,
      searchTerm: search,
      userStory: 'US-3.1',
      hypothesis: 'H3',
    });

    if (includeStats) {
      return NextResponse.json({
        success: true,
        data: {
          tags,
          statistics: {
            totalTags: tags.length,
            totalProducts: products.length,
            mostUsedTag: tags[0]?.name || null,
            leastUsedTag: tags[tags.length - 1]?.name || null,
            avgProductsPerTag:
              tags.length > 0 ? tags.reduce((sum, tag) => sum + tag.count, 0) / tags.length : 0,
          },
        },
        message: 'Product tags retrieved successfully',
      });
    }

    // Return simplified tag list
    const simplifiedTags = tags.map(tag => ({
      name: tag.name,
      count: tag.count,
      avgPrice: tag.avgPrice,
      totalUsage: tag.totalUsage,
    }));

    return NextResponse.json({
      success: true,
      data: {
        tags: simplifiedTags,
      },
      message: 'Product tags retrieved successfully',
    });
  } catch (error) {
    logError('Failed to fetch product tags', {
      component: 'ProductTagsAPI',
      operation: 'GET',
      error: error instanceof Error ? error.message : 'Unknown error',
      userStory: 'US-3.1',
      hypothesis: 'H3',
    });

    return NextResponse.json({ error: 'Failed to fetch product tags' }, { status: 500 });
  }
});
