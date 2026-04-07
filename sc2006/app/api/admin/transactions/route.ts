import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/utils';
import { Prisma } from '@/app/generated/prisma/client';

function calculateBookingAmount(startDate: Date | string, endDate: Date | string, dailyRate?: number | null) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const rate = Number(dailyRate ?? 0);
  return Number((days * rate).toFixed(2));
}

// GET - Fetch all transactions (admin only)
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

    const userId = (payload as { userId?: string }).userId;
    if (!userId) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    const url = new URL(request.url);
    const statusFilter = url.searchParams.get('status') || 'all';
    const methodFilter = url.searchParams.get('method') || 'all';

    // Build where clause based on filters
    const where: Prisma.BookingWhereInput = {};
    if (statusFilter !== 'all') {
      where.payment = {
        status: statusFilter === 'Completed' ? 'COMPLETED' : 'PENDING',
      };
    }

    // Fetch all completed bookings with payments
    const bookings = await prisma.booking.findMany({
      where: {
        status: 'COMPLETED',
        ...where,
      },
      include: {
        pet: { select: { name: true } },
        owner: { select: { name: true, email: true } },
        caregiver: {
          select: {
            name: true,
            caregiverProfile: { select: { dailyRate: true } },
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            amount: true,
            paidAt: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { endDate: 'desc' },
      take: 100, // Limit to last 100 transactions
    });

    const transactions = bookings.map((booking) => {
      const rateBasedAmount = calculateBookingAmount(
        booking.startDate,
        booking.endDate,
        booking.caregiver?.caregiverProfile?.dailyRate
      );
      const baseAmount = rateBasedAmount || booking.payment?.amount || booking.totalPrice;
      const fee = Number((baseAmount * 0.05).toFixed(2));
      const total = Number((baseAmount + fee).toFixed(2));
      const isCompleted = booking.payment?.status === 'COMPLETED';
      const transactionDate =
        booking.payment?.paidAt ?? booking.payment?.updatedAt ?? booking.payment?.createdAt ?? booking.endDate;

      return {
        id: booking.payment?.id ?? booking.id,
        bookingId: booking.id,
        date: transactionDate,
        pet: booking.pet?.name ?? 'Pet',
        owner: booking.owner?.name ?? 'Owner',
        ownerEmail: booking.owner?.email ?? '',
        caretaker: booking.caregiver?.name ?? 'Caregiver',
        startDate: booking.startDate,
        endDate: booking.endDate,
        baseAmount: Number(baseAmount.toFixed(2)),
        fee: fee,
        total: total,
        status: isCompleted ? 'Completed' : 'Pending',
        paymentStatus: booking.payment?.status ?? 'PENDING',
        method: 'Bank Transfer', // Default - could be expanded with additional data
      };
    });

    // Apply method filter if needed (basic filter)
    let filtered = transactions;
    if (methodFilter !== 'all') {
      filtered = transactions.filter((t) => t.method === methodFilter);
    }

    return NextResponse.json({ transactions: filtered }, { status: 200 });
  } catch (error) {
    console.error('Fetch admin transactions error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}
