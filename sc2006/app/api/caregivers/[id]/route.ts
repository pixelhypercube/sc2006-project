// app/api/caregivers/[id]/route.ts - SINGLE CAREGIVER
import { prisma } from '@/app/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const caregiver = await prisma.caregiverProfile.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        biography: true,
        dailyRate: true,
        location: true,
        availabilityStartDate: true,
        availabilityEndDate: true,
        experienceYears: true,
        verified: true,
        averageRating: true,
        totalReviews: true,
        completedBookings: true,
        services: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!caregiver) {
      return NextResponse.json({ error: 'Caregiver not found' }, { status: 404 });
    }

    return NextResponse.json({ caregiver });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
