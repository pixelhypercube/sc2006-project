// app/api/messages/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/utils';

// GET - Fetch messages by bookingId
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
    const bookingId = searchParams.get('bookingId');

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    }

    // Verify user has access to this booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { ownerId: true, caregiverId: true },
    });

    if (!booking || (booking.ownerId !== userId && booking.caregiverId !== userId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Fetch messages for this booking
    const messages = await prisma.message.findMany({
      where: { bookingId },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark messages as read for the current user
    // await prisma.message.updateMany({
    //   where: {
    //     bookingId,
    //     receiverId: userId,
    //   },
    //   data: { read: true },
    // });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Fetch messages error:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST - Create a new message
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
    const { bookingId, receiverId, content } = await request.json();

    if (!bookingId || !receiverId || !content) {
      return NextResponse.json(
        { error: 'bookingId, receiverId, and content are required' },
        { status: 400 }
      );
    }

    // Verify booking exists and user is part of it
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { ownerId: true, caregiverId: true },
    });

    if (!booking || (booking.ownerId !== userId && booking.caregiverId !== userId)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        senderId: userId,
        receiverId,
        bookingId,
        content,
      },
      include: {
        sender: { select: { id: true, name: true, avatar: true } },
        receiver: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json({ success: true, message }, { status: 201 });
  } catch (error) {
    console.error('Create message error:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}
