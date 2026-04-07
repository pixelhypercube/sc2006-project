import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/utils';

// GET - List all pets for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Get token from cookies
    const { searchParams } = request.nextUrl;
    const location = searchParams.get('location') || undefined;
    const petTypesParam = searchParams.get('petTypes');
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    const where: any = {};

    if (location!="") {
      where.location = {
        contains: location,
        mode: 'insensitive'
      };
    }

    if (petTypesParam) {
      const petTypes = petTypesParam.split(',').filter(Boolean);
      if (petTypes.length > 0) {
        // Temporarily disabled pet type filtering to debug
        // where.petPreferences = { hasSome: petTypes };
      }
    }


    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify token
    const payload = verifyToken(token, process.env.JWT_SECRET!);
    if (!payload || typeof payload === 'string') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Exclude the current user from the caregiver list
    where.NOT = {
      id: payload.userId
    };

    // Fetch all pets for this user
    const caregivers = await prisma.caregiverProfile.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        biography: true,
        dailyRate: true,
        location: true,
        experienceYears: true,
        verified: true,
        averageRating: true,
        totalReviews: true,
        completedBookings: true,
        services: true,
        petPreferences: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            avatar: true,
            latitude: true,
            longitude: true,
            caregiverBookings: {
              select: {
                id: true,
                startDate: true,
                endDate: true,
                status: true
              },
              where: {
                status: { in: ['CONFIRMED', 'IN_PROGRESS'] }
              }
            }
          }
        },
      }
    });

    // Format the response
    const formattedCaregivers = caregivers.map(caregiver => ({
      ...caregiver,
    }));

    return NextResponse.json({ caregivers: formattedCaregivers });

  } catch (error) {
    console.error('Fetch caregivers error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch caregivers' },
      { status: 500 }
    );
  }
}

// POST - Create a new caregiver profile
export async function POST(request: Request) {
  
}