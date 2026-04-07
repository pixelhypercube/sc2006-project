// app/api/booking/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/utils';
import { bookingSchema } from '@/app/lib/validation';
import { z } from 'zod';
import { requestPaymentInChat } from '@/app/lib/paymentRequestChat';

function calculateBookingAmount(startDate: Date | string, endDate: Date | string, dailyRate?: number | null) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const rate = Number(dailyRate ?? 0);
  return Number((days * rate).toFixed(2));
}

// GET - List bookings for the authenticated user
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token, process.env.JWT_SECRET!);
    if (!payload || typeof payload === 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId') ?? undefined;
    const caregiverId = searchParams.get('caregiverId') ?? undefined;
    const petId = searchParams.get('petId') ?? undefined;

    const where: Record<string, unknown> = {};
    if (ownerId) where.ownerId = ownerId;
    if (caregiverId) where.caregiverId = caregiverId;
    if (petId) where.petId = petId;

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        owner: { select: { id: true, name: true, avatar: true, email: true } },
        caregiver: {
          select: {
            id: true,
            name: true,
            avatar: true,
            email: true,
            caregiverProfile: { select: { dailyRate: true } },
          },
        },
        payment: { select: { id: true, status: true, amount: true } },
        pet: { select: { id: true, name: true, type: true, breed: true } },
        review: { select: { id: true, rating: true } },
      },
    });

    // Auto-transition overdue bookings to COMPLETED, and CONFIRMED bookings to IN_PROGRESS when active.
    const now = new Date();
    const toComplete = bookings.filter(
      (b) => (b.status === 'CONFIRMED' || b.status === 'IN_PROGRESS') && new Date(b.endDate) < now
    );
    if (toComplete.length > 0) {
      await prisma.booking.updateMany({
        where: { id: { in: toComplete.map((b) => b.id) } },
        data: { status: 'COMPLETED' },
      });
      toComplete.forEach((b) => { b.status = 'COMPLETED'; });

      await Promise.all(
        toComplete.map((booking) => {
          const amount = calculateBookingAmount(
            booking.startDate,
            booking.endDate,
            booking.caregiver?.caregiverProfile?.dailyRate
          ) || booking.totalPrice;

          return requestPaymentInChat({
            bookingId: booking.id,
            ownerId: booking.ownerId,
            caregiverId: booking.caregiverId,
            senderId: booking.caregiverId,
            petName: booking.pet?.name ?? 'Pet',
            amount,
          });
        })
      );
    }

    const toUpdate = bookings.filter(
      (b) => b.status === 'CONFIRMED' && new Date(b.startDate) <= now && new Date(b.endDate) >= now
    );
    if (toUpdate.length > 0) {
      await prisma.booking.updateMany({
        where: { id: { in: toUpdate.map((b) => b.id) } },
        data: { status: 'IN_PROGRESS' },
      });
      toUpdate.forEach((b) => { b.status = 'IN_PROGRESS'; });
    }

    return NextResponse.json({ bookings });
  } catch (error) {
    console.error('Fetch bookings error:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}

// PATCH - Update booking status (caregiver accepts/declines)
export async function PATCH(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token, process.env.JWT_SECRET!);
    if (!payload || typeof payload === 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = (payload as { userId: string }).userId;
    const { bookingId, status } = await request.json();

    if (!bookingId || !status) {
      return NextResponse.json({ error: 'bookingId and status are required' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        pet: { select: { name: true } },
        caregiver: {
          select: {
            caregiverProfile: { select: { dailyRate: true } },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.caregiverId !== userId) {
      return NextResponse.json({ error: 'Only the caregiver can update this booking' }, { status: 403 });
    }

    const allowedStatuses = ['CONFIRMED', 'DECLINED', 'COMPLETED'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: `Status must be one of: ${allowedStatuses.join(', ')}` }, { status: 400 });
    }

    if ((status === 'CONFIRMED' || status === 'DECLINED') && booking.status !== 'PENDING') {
      return NextResponse.json({ error: 'Only PENDING bookings can be updated' }, { status: 400 });
    }

    if (status === 'COMPLETED' && booking.status !== 'CONFIRMED' && booking.status !== 'IN_PROGRESS') {
      return NextResponse.json({ error: 'Only CONFIRMED or IN_PROGRESS bookings can be completed' }, { status: 400 });
    }

    // If caregiver is accepting (status = CONFIRMED), check for date conflicts
    if (status === 'CONFIRMED') {
      const caregiverConflict = await prisma.booking.findFirst({
        where: {
          caregiverId: booking.caregiverId,
          id: { not: bookingId },
          status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
          OR: [
            {
              startDate: { lt: booking.endDate },
              endDate: { gt: booking.startDate },
            },
          ],
        },
      });

      if (caregiverConflict) {
        return NextResponse.json(
          { error: 'Booking conflict', message: 'You have conflicting bookings during this time period' },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });

    if (status === 'COMPLETED') {
      const amount = calculateBookingAmount(
        booking.startDate,
        booking.endDate,
        booking.caregiver?.caregiverProfile?.dailyRate
      ) || booking.totalPrice;

      await requestPaymentInChat({
        bookingId: booking.id,
        ownerId: booking.ownerId,
        caregiverId: booking.caregiverId,
        senderId: booking.caregiverId,
        petName: booking.pet?.name ?? 'Pet',
        amount,
      });
    }

    if (status === 'CONFIRMED') {
      await prisma.booking.updateMany({
        where: {
          id: { not: bookingId },
          caregiverId: booking.caregiverId,
          status: 'PENDING',
          AND: [
            { startDate: { lt: booking.endDate } },
            { endDate: { gt: booking.startDate } },
          ],
        },
        data: { status: 'DECLINED' },
      });
    }

    return NextResponse.json({ success: true, booking: updated });
  } catch (error) {
    console.error('Update booking status error:', error);
    return NextResponse.json({ error: 'Failed to update booking status' }, { status: 500 });
  }
}

// POST - Create a new booking
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token, process.env.JWT_SECRET!);
    if (!payload || typeof payload === 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = (payload as { userId: string }).userId;

    const body = await request.json();
    body.ownerId = userId; 
    console.log('Received booking data:', body);
    const validatedData = bookingSchema.parse(body);

    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'Validation failed', message: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Verify caregiver exists
    const caregiver = await prisma.caregiverProfile.findUnique({
      where: { id: validatedData.caregiverId },
      select: { id: true, dailyRate: true, availabilityStartDate: true, availabilityEndDate: true },
    });

    if (!caregiver) {
      return NextResponse.json({ error: 'Caregiver not found' }, { status: 404 });
    }

    if (caregiver.availabilityStartDate && caregiver.availabilityEndDate) {
      const availableStart = new Date(caregiver.availabilityStartDate);
      availableStart.setHours(0, 0, 0, 0);

      const availableEnd = new Date(caregiver.availabilityEndDate);
      availableEnd.setHours(23, 59, 59, 999);

      if (startDate < availableStart || endDate > availableEnd) {
        return NextResponse.json(
          {
            error: 'Caregiver unavailable',
            message: 'Booking dates are outside the caregiver availability period',
          },
          { status: 409 }
        );
      }
    }

    // Verify pet belongs to the owner
    const pet = await prisma.pet.findUnique({
      where: { id: validatedData.petId },
      select: { id: true, ownerId: true },
    });

    if (!pet || pet.ownerId !== userId) {
      return NextResponse.json({ error: 'Pet not found or does not belong to you' }, { status: 404 });
    }

    // Check if a booking already exists between this owner and caregiver with overlapping dates
    const existingBooking = await prisma.booking.findFirst({
      where: {
        ownerId: userId,
        caregiverId: validatedData.caregiverId,
        petId: validatedData.petId,
        OR: [
          {
            // New booking starts before existing booking ends
            startDate: { lt: endDate },
            // New booking ends after existing booking starts
            endDate: { gt: startDate },
          },
        ],
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: 'Booking conflict', message: 'A booking already exists for this owner, caregiver, and pet during the requested dates' },
        { status: 409 }
      );
    }

    // Check if caregiver has any CONFIRMED or IN_PROGRESS bookings that overlap
    const caregiverConflict = await prisma.booking.findFirst({
      where: {
        caregiverId: validatedData.caregiverId,
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
        OR: [
          {
            startDate: { lt: endDate },
            endDate: { gt: startDate },
          },
        ],
      },
    });

    if (caregiverConflict) {
      return NextResponse.json(
        { error: 'Caregiver unavailable', message: 'Caregiver is not available during the requested dates' },
        { status: 409 }
      );
    }

    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const totalPrice = validatedData.totalPrice ?? (caregiver.dailyRate ?? 0) * days;

    const booking = await prisma.booking.create({
      data: {
        ownerId: userId,
        caregiverId: validatedData.caregiverId,
        petId: validatedData.petId,
        startDate,
        endDate,
        status: 'PENDING',
        totalPrice,
        specialInstructions: validatedData.specialInstructions ?? null,
      },
      include: {
        owner: { select: { id: true, name: true, avatar: true } },
        caregiver: { select: { id: true, name: true, avatar: true } }
      },
    });

    return NextResponse.json({ success: true, message: 'Booking created successfully', booking }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return NextResponse.json(
        { error: 'Validation failed', field: firstError.path[0], message: firstError.message },
        { status: 400 }
      );
    }

    console.error('Create booking error:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}
