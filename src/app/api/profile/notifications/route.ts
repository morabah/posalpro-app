import { logger } from '@/utils/logger';import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for notification preferences
const notificationsSchema = z.object({
  // Email Notifications
  emailProposalStatus: z.boolean(),
  emailApprovalRequests: z.boolean(),
  emailTaskAssignments: z.boolean(),
  emailSystemAnnouncements: z.boolean(),
  emailTeamUpdates: z.boolean(),

  // In-App Notifications
  inAppProposalStatus: z.boolean(),
  inAppApprovalRequests: z.boolean(),
  inAppTaskAssignments: z.boolean(),
  inAppSystemAnnouncements: z.boolean(),
  inAppTeamUpdates: z.boolean(),

  // Mobile Push Notifications
  pushApprovalRequests: z.boolean(),
  pushCriticalDeadlines: z.boolean(),
  pushSystemAnnouncements: z.boolean(),
  pushTeamUpdates: z.boolean(),

  // Digest Preferences
  dailySummaryEmail: z.boolean(),
  weeklyActivityReport: z.boolean(),

  // Quiet Hours
  quietHoursEnabled: z.boolean(),
  quietHoursFrom: z.string(),
  quietHoursTo: z.string(),
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
    const validationResult = notificationsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const notificationsData = validationResult.data;

    // In a real implementation, update the database
    // For now, we'll simulate a successful update
    logger.info('Notifications update for user: ' + session.user.email, notificationsData);

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 300));

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: {
        ...notificationsData,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Notifications update error:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
