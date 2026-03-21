// app/api/chats/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/utils';

// GET - Get or create a chat between owner and caregiver
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

    const userId = (payload as { userId: string }).userId;
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');
    const caregiverId = searchParams.get('caregiverId');

    // If no ownerId/caregiverId, return all conversations for the current user
    if (!ownerId && !caregiverId) {
      const bookings = await prisma.booking.findMany({
        where: {
          OR: [{ ownerId: userId }, { caregiverId: userId }],
        },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          ownerId: true,
          status: true,
          updatedAt: true,
          owner: { select: { id: true, name: true, avatar: true } },
          caregiver: { select: { id: true, name: true, avatar: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { content: true, createdAt: true },
          },
        },
      });

      const conversations = bookings.map((b) => {
        const other = b.ownerId === userId ? b.caregiver : b.owner;
        const lastMsg = b.messages[0];
        return {
          id: b.id,
          name: other.name,
          initial: other.name.charAt(0).toUpperCase(),
          avatar: other.avatar,
          otherId: other.id,
          lastMessage: lastMsg?.content ?? '',
          date: lastMsg
            ? new Date(lastMsg.createdAt).toLocaleDateString('en-SG', { month: 'short', day: 'numeric' })
            : new Date(b.updatedAt).toLocaleDateString('en-SG', { month: 'short', day: 'numeric' }),
          status: b.status,
        };
      });

      return NextResponse.json({ conversations });
    }

    if (!ownerId || !caregiverId) {
      return NextResponse.json({ error: 'ownerId and caregiverId are required' }, { status: 400 });
    }

    // Verify user is part of this conversation
    if (userId !== ownerId && userId !== caregiverId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if an active booking exists between them
    const existingBooking = await prisma.booking.findFirst({
      where: {
        ownerId,
        caregiverId,
        status: { in: ['CONFIRMED', 'IN_PROGRESS'] },
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (existingBooking) {
      return NextResponse.json({ bookingId: existingBooking.id, isNew: false });
    }

    // If no active booking exists, create a new PENDING booking
    const ownerPet = await prisma.pet.findFirst({
      where: { ownerId },
      select: { id: true },
    });

    if (!ownerPet) {
      return NextResponse.json(
        { error: 'Owner has no pets to initiate a chat' },
        { status: 400 }
      );
    }

    const newBooking = await prisma.booking.create({
      data: {
        ownerId,
        caregiverId,
        petId: ownerPet.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        status: 'PENDING',
        totalPrice: 0,
      },
      select: { id: true },
    });

    return NextResponse.json({ bookingId: newBooking.id, isNew: true });
  } catch (error) {
    console.error('Get/create chat error:', error);
    return NextResponse.json({ error: 'Failed to get or create chat' }, { status: 500 });
  }
}
