import { logger } from '@/lib/logger';import { getServerSession } from 'next-auth';
// Force Node.js runtime to avoid Edge Function conflicts with Prisma
export const runtime = "nodejs";
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for preferences
const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']),
  defaultView: z.enum(['card', 'table']),
  startingScreen: z.string(),
  dateFormat: z.string(),
  timeFormat: z.string(),
  language: z.string(),
  highContrast: z.boolean(),
  largeText: z.boolean(),
  screenReaderOptimized: z.boolean(),
  reducedMotion: z.boolean(),
  keyboardNavigation: z.boolean(),
  showQuickActions: z.boolean(),
  showRecentProposals: z.boolean(),
  showTeamActivity: z.boolean(),
  showSystemNotifications: z.boolean(),
  showKPIs: z.boolean(),
  aiAssistanceLevel: z.enum(['minimal', 'balanced', 'full']),
  enableContentSuggestions: z.boolean(),
  enableWorkflowAssistance: z.boolean(),
  enableAutomatedDrafts: z.boolean(),
  enableValidationHelp: z.boolean(),
});

export async function PUT(request: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();

    // Validate the data
    const validationResult = preferencesSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const preferencesData = validationResult.data;

    // In a real implementation, update the database
    // For now, we'll simulate a successful update
    logger.info('Preferences update for user: ' + session.user.email, preferencesData);

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 300));

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        ...preferencesData,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Preferences update error:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
