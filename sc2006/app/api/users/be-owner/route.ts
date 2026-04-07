import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/utils';

export async function POST() {
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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, secondaryRole: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role !== 'CAREGIVER') {
      return NextResponse.json(
        { error: 'Only caregivers can enable owner mode' },
        { status: 403 }
      );
    }

    if (user.secondaryRole === 'OWNER') {
      return NextResponse.json({ success: true, message: 'Owner mode already enabled' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { secondaryRole: 'OWNER' },
    });

    return NextResponse.json({ success: true, message: 'Owner mode enabled' });
  } catch (error) {
    console.error('Enable owner mode error:', error);
    return NextResponse.json({ error: 'Failed to enable owner mode' }, { status: 500 });
  }
}
