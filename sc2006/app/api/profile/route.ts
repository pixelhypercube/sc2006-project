// app/api/profile/route.ts - UPDATES ANY USER FIELDS
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/app/lib/utils';
import { prisma } from '@/app/lib/prisma';
import { PetType, DogSize, ServiceType } from '@/app/generated/prisma/client';

export async function PUT(request: NextRequest) {
  try {
    const accessToken = request.cookies.get('access_token')?.value;
    if (!accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(accessToken, process.env.JWT_SECRET!);

    if (!payload || typeof payload === 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name, phone, biography, location, latitude, longitude,
      dailyRate, experience, isAcceptingRequests,
      availabilityStartDate, availabilityEndDate,
      selectedPets, selectedSizes, selectedServices,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { role: true },
    });

    let updatedUser;

    if (user?.role === 'CAREGIVER') {
      const result = await prisma.$transaction(async (tx) => {
        const u = await tx.user.update({
          where: { id: payload.userId },
          data: {
            name,
            ...(phone !== undefined && phone !== '' && { phone }),
            ...(phone === '' && { phone: null }),
            ...(location !== undefined && { location }),
            ...(biography !== undefined && { biography }),
            ...(latitude !== undefined && { latitude: latitude !== '' ? parseFloat(latitude) : null }),
            ...(longitude !== undefined && { longitude: longitude !== '' ? parseFloat(longitude) : null }),
          },
          select: {
            id: true, email: true, name: true, phone: true,
            role: true, avatar: true, verified: true, location: true, biography: true, latitude: true, longitude: true,
          },
        });

        await tx.caregiverProfile.update({
          where: { id: payload.userId },
          data: {
            name,
            ...(biography !== undefined && { biography }),
            ...(location !== undefined && { location }),
            ...(dailyRate !== undefined && { dailyRate: parseFloat(dailyRate) }),
            ...(experience !== undefined && { experienceYears: parseInt(experience) }),
            ...(isAcceptingRequests !== undefined && { isAcceptingRequests }),
            ...(availabilityStartDate !== undefined && {
              availabilityStartDate: availabilityStartDate ? new Date(availabilityStartDate) : null,
            }),
            ...(availabilityEndDate !== undefined && {
              availabilityEndDate: availabilityEndDate ? new Date(availabilityEndDate) : null,
            }),
            ...(Array.isArray(selectedPets) && { petPreferences: selectedPets as PetType[] }),
            ...(Array.isArray(selectedSizes) && { dogSizes: selectedSizes as DogSize[] }),
            ...(Array.isArray(selectedServices) && { services: selectedServices as ServiceType[] }),
          },
        });

        return u;
      });

      updatedUser = result;
    } else {
      updatedUser = await prisma.user.update({
        where: { id: payload.userId },
        data: {
          name,
          ...(phone !== undefined && phone !== '' && { phone }),
          ...(phone === '' && { phone: null }),
          ...(location !== undefined && { location }),
          ...(biography !== undefined && { biography }),
          ...(latitude !== undefined && { latitude: latitude !== '' ? parseFloat(latitude) : null }),
          ...(longitude !== undefined && { longitude: longitude !== '' ? parseFloat(longitude) : null }),
        },
        select: {
          id: true, email: true, name: true, phone: true,
          role: true, avatar: true, verified: true, location: true, biography: true, latitude: true, longitude: true,
        },
      });
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error('Profile update error:', error);

    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Field value already taken' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
