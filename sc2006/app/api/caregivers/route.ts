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
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    const where: any = {};

    if (location!="") {
      where.location = {
        contains: location, // Case-sensitive partial match
        mode: 'insensitive' // Case-insensitive
      };
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

    // Fetch all pets for this user
    const caregivers = await prisma.caregiverProfile.findMany({
      where,
      orderBy: { createdAt: 'asc' }      
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