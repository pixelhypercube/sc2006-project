// app/api/auth/me/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/utils';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('access_token')?.value;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    // Verify token (stateless)
    const payload = verifyToken(accessToken, process.env.JWT_SECRET!);
    
    if (!payload || typeof payload === 'string') {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Get fresh user data from DB (optional - can also use payload data)
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        biography: true,
        location: true,
        avatar: true,
        verified: true,
        createdAt: true,
        caregiverProfile: {
          select: {
            dailyRate: true,
            biography: true,
            location: true,
            experienceYears: true,
            isAcceptingRequests: true,
            petPreferences: true,
            dogSizes: true,
            services: true,
            verified: true,
            averageRating: true,
            totalReviews: true,
            completedBookings: true,
          }
        },
        pets: {
          select: {
            id: true,
            name: true,
            type: true,
            breed: true,
            age: true,
            photo: true,
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ user });
    
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to get user' },
      { status: 500 }
    );
  }
}