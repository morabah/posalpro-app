import { logError, logInfo } from '@/lib/logger'; /**
 * PosalPro MVP2 - Search Suggestions API Routes
 * Auto-complete and search suggestions functionality
 * Component Traceability: US-1.1, US-1.2, H1
 */

import { authOptions } from '@/lib/auth';
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
import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Component Traceability Matrix:
 * - User Stories: US-1.1 (Content Discovery), US-1.2 (Advanced Search)
 * - Acceptance Criteria: AC-1.1.3, AC-1.2.3
 * - Hypotheses: H1 (Content Discovery)
 * - Methods: getSearchSuggestions(), getAutoComplete()
 * - Test Cases: TC-H1-002
 */

/**
 * Suggestions query validation schema
 */
const SuggestionsQuerySchema = z.object({
  q: z.string().min(1, 'Query is required'),
  type: z.enum(['all', 'content', 'proposals', 'products', 'customers']).default('all'),
  limit: z.coerce.number().min(1).max(20).default(10),
});

/**
 * GET /api/search/suggestions - Get search suggestions
 */
export async function GET(request: NextRequest) {
  try {
    await validateApiPermission(request, { resource: 'search', action: 'read' });
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const validatedQuery = SuggestionsQuerySchema.parse(queryParams);

    const searchTerm = validatedQuery.q.toLowerCase();

    // Get suggestions from different sources
    const suggestions = await Promise.all([
      getContentSuggestions(searchTerm, validatedQuery.limit),
      getProductSuggestions(searchTerm, validatedQuery.limit),
      getCustomerSuggestions(searchTerm, validatedQuery.limit),
      getTagSuggestions(searchTerm, validatedQuery.limit),
      getRecentSearches(session.user.id, searchTerm, validatedQuery.limit),
    ]);

    // Combine and deduplicate suggestions
    const allSuggestions = suggestions.flat();
    const uniqueSuggestions = Array.from(
      new Map(allSuggestions.map(item => [item.text, item])).values()
    );

    // Sort by relevance and limit results
    const sortedSuggestions = uniqueSuggestions
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, validatedQuery.limit);

    await logInfo('Search suggestions success', {
      query: validatedQuery.q,
      limit: validatedQuery.limit,
      userId: session.user.id,
      count: sortedSuggestions.length,
    });
    return NextResponse.json({
      success: true,
      data: {
        query: validatedQuery.q,
        suggestions: sortedSuggestions,
        total: sortedSuggestions.length,
      },
      message: 'Suggestions retrieved successfully',
    });
  } catch (error) {
    await logError('Search suggestions error', error as unknown);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to get suggestions' }, { status: 500 });
  }
}

/**
 * Get content title suggestions
 */
async function getContentSuggestions(searchTerm: string, limit: number) {
  try {
    const contents = await prisma.content.findMany({
      where: {
        isActive: true,
        title: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      select: {
        title: true,
        type: true,
      },
      take: limit,
    });

    return contents.map((content: any) => ({
      text: content.title,
      type: 'content',
      subtype: content.type,
      score: calculateSuggestionScore(content.title, searchTerm, 'content'),
    }));
  } catch (error) {
    const { logError } = await import('@/lib/logger');
    await logError('Content suggestions error', error as unknown);
    return [];
  }
}

/**
 * Get product name suggestions
 */
async function getProductSuggestions(searchTerm: string, limit: number) {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { sku: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        name: true,
        sku: true,
        category: true,
      },
      take: limit,
    });

    return products.map((product: any) => ({
      text: product.name,
      type: 'product',
      subtype: product.category[0] || 'product',
      metadata: { sku: product.sku },
      score: calculateSuggestionScore(product.name, searchTerm, 'product'),
    }));
  } catch (error) {
    const { logError } = await import('@/lib/logger');
    await logError('Product suggestions error', error as unknown);
    return [];
  }
}

/**
 * Get customer name suggestions
 */
async function getCustomerSuggestions(searchTerm: string, limit: number) {
  try {
    const customers = await prisma.customer.findMany({
      where: {
        status: 'ACTIVE',
        name: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      select: {
        name: true,
        industry: true,
        tier: true,
      },
      take: limit,
    });

    return customers.map((customer: any) => ({
      text: customer.name,
      type: 'customer',
      subtype: customer.industry || 'business',
      metadata: { tier: customer.tier },
      score: calculateSuggestionScore(customer.name, searchTerm, 'customer'),
    }));
  } catch (error) {
    const { logError } = await import('@/lib/logger');
    await logError('Customer suggestions error', error as unknown);
    return [];
  }
}

/**
 * Get tag suggestions from content and products
 */
async function getTagSuggestions(searchTerm: string, limit: number) {
  try {
    const [contentTags, productTags] = await Promise.all([
      prisma.content.findMany({
        where: {
          isActive: true,
          tags: {
            has: searchTerm,
          },
        },
        select: {
          tags: true,
        },
        take: limit * 2,
      }),
      prisma.product.findMany({
        where: {
          isActive: true,
          tags: {
            has: searchTerm,
          },
        },
        select: {
          tags: true,
        },
        take: limit * 2,
      }),
    ]);

    // Extract and filter matching tags
    const allTags = [
      ...contentTags.flatMap((c: any) => c.tags),
      ...productTags.flatMap((p: any) => p.tags),
    ];

    const matchingTags = allTags
      .filter(tag => tag.toLowerCase().includes(searchTerm))
      .filter((tag, index, arr) => arr.indexOf(tag) === index) // Remove duplicates
      .slice(0, limit);

    return matchingTags.map(tag => ({
      text: tag,
      type: 'tag',
      subtype: 'keyword',
      score: calculateSuggestionScore(tag, searchTerm, 'tag'),
    }));
  } catch (error) {
    const { logError } = await import('@/lib/logger');
    await logError('Tag suggestions error', error as unknown);
    return [];
  }
}

/**
 * Get recent searches for the user
 */
async function getRecentSearches(userId: string, searchTerm: string, limit: number) {
  try {
    // Get recent search events for this user
    const recentEvents = await prisma.hypothesisValidationEvent.findMany({
      where: {
        userId,
        action: 'search_executed',
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      select: {
        measurementData: true,
        timestamp: true,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 50,
    });

    // Extract search queries and filter for matches
    const searchQueries = recentEvents
      .map((event: any) => {
        const data = event.measurementData as any;
        return {
          query: data?.query || '',
          timestamp: event.timestamp,
        };
      })
      .filter(
        (item: any) =>
          item.query &&
          item.query.toLowerCase().includes(searchTerm) &&
          item.query.toLowerCase() !== searchTerm // Don't suggest exact same query
      )
      .slice(0, limit);

    return searchQueries.map((item: any) => ({
      text: item.query,
      type: 'recent',
      subtype: 'search_history',
      metadata: { timestamp: item.timestamp },
      score: calculateSuggestionScore(item.query, searchTerm, 'recent'),
    }));
  } catch (error) {
    const { logError } = await import('@/lib/logger');
    await logError('Recent searches error', error as unknown);
    return [];
  }
}

/**
 * Calculate suggestion relevance score
 */
function calculateSuggestionScore(suggestion: string, searchTerm: string, type: string): number {
  let score = 0;
  const suggestionLower = suggestion.toLowerCase();
  const termLower = searchTerm.toLowerCase();

  // Exact match gets highest score
  if (suggestionLower === termLower) {
    score += 100;
  } else if (suggestionLower.startsWith(termLower)) {
    score += 80;
  } else if (suggestionLower.includes(termLower)) {
    score += 60;
  }

  // Boost score based on type priority
  const typeBoosts = {
    recent: 20,
    content: 15,
    product: 10,
    customer: 8,
    tag: 5,
  };

  score += typeBoosts[type as keyof typeof typeBoosts] || 0;

  // Shorter suggestions get slight boost for relevance
  if (suggestion.length < 50) {
    score += 5;
  }

  return score;
}
