import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/utils';

// GET - Fetch active contracts count (IN_PROGRESS bookings)
export async function GET() {
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

    // Count all bookings with IN_PROGRESS status
    const activeContractsCount = await prisma.booking.count({
      where: {
        status: 'IN_PROGRESS',
      },
    });

    return NextResponse.json({ count: activeContractsCount }, { status: 200 });
  } catch (error) {
    console.error('Fetch active contracts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch active contracts' },
      { status: 500 }
    );
  }
}
