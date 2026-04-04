import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/utils';

// POST - Submit a review for a completed booking
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = verifyToken(token, process.env.JWT_SECRET!);
    if (!payload || typeof payload === 'string') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const userId = (payload as { userId: string }).userId;
    const { bookingId, rating, comment } = await request.json();

    if (!bookingId || !rating) {
      return NextResponse.json({ error: 'bookingId and rating are required' }, { status: 400 });
    }
    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: { select: { id: true } } },
    });

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.ownerId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    if (booking.status !== 'COMPLETED') {
      return NextResponse.json({ error: 'Can only review completed bookings' }, { status: 400 });
    }
    if (booking.review) {
      return NextResponse.json({ error: 'Review already submitted for this booking' }, { status: 409 });
    }

    const review = await prisma.$transaction(async (tx) => {
      const created = await tx.review.create({
        data: {
          bookingId,
          fromUserId: userId,
          toUserId: booking.caregiverId,
          rating,
          comment: comment || null,
        },
      });

      // Recalculate average rating for the caregiver
      const allReviews = await tx.review.findMany({
        where: { toUserId: booking.caregiverId },
        select: { rating: true },
      });
      const totalReviews = allReviews.length;
      const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

      await tx.caregiverProfile.update({
        where: { id: booking.caregiverId },
        data: { averageRating, totalReviews },
      });

      return created;
    });

    return NextResponse.json({ success: true, review }, { status: 201 });
  } catch (error) {
    console.error('Submit review error:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}

// GET - Fetch reviews for a caregiver
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const caregiverId = searchParams.get('caregiverId');

    if (!caregiverId) {
      return NextResponse.json({ error: 'caregiverId is required' }, { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: { toUserId: caregiverId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        fromUser: { select: { name: true } },
      },
    });

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error('Fetch reviews error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}
