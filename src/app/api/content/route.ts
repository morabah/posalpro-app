/**
 * PosalPro MVP2 - Content API Routes
 * Handles content CRUD operations using service functions
 * Based on CONTENT_SEARCH_SCREEN.md requirements
 */

import { authOptions } from '@/lib/auth';
import {
  ContentService,
  type ContentFilters,
  type SemanticSearchRequest,
} from '@/lib/services/contentService';
import { ContentType } from '@prisma/client';
import { getServerSession } from 'next-auth/next';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const contentServiceInstance = new ContentService();

/**
 * Standard API response wrapper
 */
function createApiResponse<T>(data: T, message: string, status = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      message,
    },
    { status }
  );
}

function createErrorResponse(error: string, details?: any, status = 500) {
  return NextResponse.json(
    {
      success: false,
      error,
      details,
    },
    { status }
  );
}

// Content validation schema
const createContentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be less than 200 characters'),
  description: z.string().optional(),
  type: z.nativeEnum(ContentType),
  content: z.string().min(1, 'Content is required'),
  tags: z.array(z.string()).optional(),
  category: z.array(z.string()).optional(),
  keywords: z.array(z.string()).optional(),
  isPublic: z.boolean().optional(),
  allowedRoles: z.array(z.string()).optional(),
});

const updateContentSchema = createContentSchema.partial().extend({
  id: z.string().uuid('Invalid content ID'),
});

// Enhanced validation schemas for semantic search
const semanticSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  filters: z
    .object({
      type: z.array(z.nativeEnum(ContentType)).optional(),
      category: z.array(z.string()).optional(),
      tags: z.array(z.string()).optional(),
      isPublic: z.boolean().optional(),
      isActive: z.boolean().optional(),
      createdBy: z.string().optional(),
      search: z.string().optional(),
    })
    .optional(),
  includeRelevanceScore: z.boolean().default(true),
  maxResults: z.number().min(1).max(100).default(20),
  sessionId: z.string().optional(),
});

const aiCategoriesSchema = z.object({
  content: z.string().optional(),
  existingCategories: z.array(z.string()).optional(),
});

const qualityScoreSchema = z.object({
  contentId: z.string().min(1, 'Content ID is required'),
});

/**
 * GET /api/content - List content with filtering
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const searchType = searchParams.get('searchType');

    // Handle semantic search requests (US-1.1)
    if (searchType === 'semantic') {
      const searchQuery = searchParams.get('q');
      const filtersParam = searchParams.get('filters');
      const maxResults = parseInt(searchParams.get('maxResults') || '20');
      const sessionId = searchParams.get('sessionId') || `session_${Date.now()}`;

      if (!searchQuery) {
        return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
      }

      // Parse filters if provided
      let filters: ContentFilters | undefined;
      if (filtersParam) {
        try {
          const parsedFilters = JSON.parse(filtersParam);

          // Validate and convert filters to proper types (only ContentFilters properties)
          filters = {
            type: parsedFilters.type
              ? parsedFilters.type.map((t: string) => t as ContentType)
              : undefined,
            category: parsedFilters.category,
            tags: parsedFilters.tags,
            isPublic: parsedFilters.isPublic,
            isActive: parsedFilters.isActive,
            createdBy: parsedFilters.createdBy,
            search: parsedFilters.search,
          };
        } catch (error) {
          return NextResponse.json({ error: 'Invalid filters format' }, { status: 400 });
        }
      }

      // Build semantic search request
      const searchRequest: SemanticSearchRequest = {
        query: searchQuery,
        filters,
        userRoles: session.user.roles || ['user'],
        includeRelevanceScore: true,
        maxResults,
        userId: session.user.id,
        sessionId,
      };

      // Perform semantic search
      const searchResults = await contentServiceInstance.semanticSearch(searchRequest);

      return NextResponse.json({
        success: true,
        data: searchResults,
        hypothesis: 'H1',
        userStory: 'US-1.1',
        timestamp: new Date().toISOString(),
      });
    }

    // Handle AI categories request (US-1.2)
    if (searchType === 'ai-categories') {
      const content = searchParams.get('content');
      const existingCategoriesParam = searchParams.get('existingCategories');

      let existingCategories;
      if (existingCategoriesParam) {
        try {
          existingCategories = JSON.parse(existingCategoriesParam);
        } catch (error) {
          return NextResponse.json(
            { error: 'Invalid existing categories format' },
            { status: 400 }
          );
        }
      }

      const categories = await contentServiceInstance.getAICategories(
        content || undefined,
        existingCategories
      );

      return NextResponse.json({
        success: true,
        data: { categories },
        hypothesis: 'H1',
        userStory: 'US-1.2',
        timestamp: new Date().toISOString(),
      });
    }

    // Handle quality score request (US-1.3)
    if (searchType === 'quality-score') {
      const contentId = searchParams.get('contentId');

      if (!contentId) {
        return NextResponse.json({ error: 'Content ID is required' }, { status: 400 });
      }

      const qualityScore = await contentServiceInstance.calculateContentQualityScore(contentId);

      return NextResponse.json({
        success: true,
        data: { qualityScore, contentId },
        hypothesis: 'H1',
        userStory: 'US-1.3',
        timestamp: new Date().toISOString(),
      });
    }

    // Handle related content request (US-1.2)
    if (searchType === 'related') {
      const contentId = searchParams.get('contentId');
      const limit = parseInt(searchParams.get('limit') || '5');

      if (!contentId) {
        return NextResponse.json({ error: 'Content ID is required' }, { status: 400 });
      }

      const relatedContent = await contentServiceInstance.getRelatedContent(contentId, limit);

      return NextResponse.json({
        success: true,
        data: { relatedContent },
        hypothesis: 'H1',
        userStory: 'US-1.2',
        timestamp: new Date().toISOString(),
      });
    }

    // Default content listing (existing functionality)
    const userRoles = session.user.roles || ['user'];
    const content = await contentServiceInstance.getContent({}, undefined, 1, 20, userRoles);

    return NextResponse.json({
      success: true,
      data: content,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Content API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/content - Create new content
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    // Handle semantic search POST requests (for complex queries)
    if (action === 'semantic-search') {
      const validationResult = semanticSearchSchema.safeParse(data);

      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: 'Invalid search parameters',
            details: validationResult.error.errors,
          },
          { status: 400 }
        );
      }

      const searchRequest: SemanticSearchRequest = {
        ...validationResult.data,
        userRoles: session.user.roles || ['user'],
        userId: session.user.id,
        sessionId: data.sessionId || `session_${Date.now()}`,
      };

      const searchResults = await contentServiceInstance.semanticSearch(searchRequest);

      return NextResponse.json({
        success: true,
        data: searchResults,
        hypothesis: 'H1',
        userStory: 'US-1.1',
        timestamp: new Date().toISOString(),
      });
    }

    // Handle AI categories POST request
    if (action === 'ai-categories') {
      const validationResult = aiCategoriesSchema.safeParse(data);

      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: 'Invalid parameters',
            details: validationResult.error.errors,
          },
          { status: 400 }
        );
      }

      const categories = await contentServiceInstance.getAICategories(
        validationResult.data.content,
        validationResult.data.existingCategories
      );

      return NextResponse.json({
        success: true,
        data: { categories },
        hypothesis: 'H1',
        userStory: 'US-1.2',
        timestamp: new Date().toISOString(),
      });
    }

    // Handle quality score calculation POST request
    if (action === 'quality-score') {
      const validationResult = qualityScoreSchema.safeParse(data);

      if (!validationResult.success) {
        return NextResponse.json(
          {
            error: 'Invalid parameters',
            details: validationResult.error.errors,
          },
          { status: 400 }
        );
      }

      const qualityScore = await contentServiceInstance.calculateContentQualityScore(
        validationResult.data.contentId
      );

      return NextResponse.json({
        success: true,
        data: { qualityScore, contentId: validationResult.data.contentId },
        hypothesis: 'H1',
        userStory: 'US-1.3',
        timestamp: new Date().toISOString(),
      });
    }

    // Default content creation (existing functionality with AI enhancement)
    if (!data.title || !data.content) {
      return NextResponse.json(
        {
          error: 'Title and content are required',
        },
        { status: 400 }
      );
    }

    // Enhance content creation with AI suggestions
    if (data.title && data.content) {
      const aiCategories = await contentServiceInstance.getAICategories(
        `${data.title} ${data.content}`,
        data.category
      );

      // Merge AI suggestions with existing categories
      if (aiCategories.length > 0) {
        data.category = [...(data.category || []), ...aiCategories.slice(0, 3)];
        data.category = Array.from(new Set(data.category)); // Remove duplicates
      }
    }

    const newContent = await contentServiceInstance.createContent(data, session.user.id);

    return NextResponse.json(
      {
        success: true,
        data: newContent,
        aiEnhanced: true,
        timestamp: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Content creation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create content',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
