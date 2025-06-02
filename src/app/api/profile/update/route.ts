import { getServerSession } from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for profile updates
const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  title: z.string().min(1, 'Title is required'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  office: z.string().optional(),
  languages: z.array(z.string()).optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  profileImage: z.string().optional(),
  expertiseAreas: z.array(z.string()).optional(),
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
    const validationResult = profileUpdateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const profileData = validationResult.data;

    // In a real implementation, update the database
    // For now, we'll simulate a successful update
    console.log('Profile update for user:', session.user.email, profileData);

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        ...profileData,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
