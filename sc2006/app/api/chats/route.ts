import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import { verifyToken } from '@/app/lib/utils';
import { decodePaymentRequestContent, summarizePaymentRequest } from '@/app/lib/paymentRequestMessage';

// GET - Get all chats for current user or get/create a specific chat
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

    // If no ownerId/caregiverId, return all chats for the current user
    if (!ownerId && !caregiverId) {
      const chats = await prisma.chat.findMany({
        where: {
          OR: [{ ownerId: userId }, { caregiverId: userId }],
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          owner: { select: { id: true, name: true, avatar: true } },
          caregiver: { select: { id: true, name: true, avatar: true } },
          messages: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { content: true, createdAt: true, senderId: true },
          },
        },
      });

      const conversations = chats.map((chat) => {
        const other = chat.ownerId === userId ? chat.caregiver : chat.owner;
        const lastMsg = chat.messages[0];
        const paymentRequest = lastMsg ? decodePaymentRequestContent(lastMsg.content) : null;
        return {
          id: chat.id,
          name: other.name,
          initial: other.name.charAt(0).toUpperCase(),
          avatar: other.avatar,
          otherId: other.id,
          lastMessage: paymentRequest ? summarizePaymentRequest(paymentRequest) : (lastMsg?.content ?? ''),
          date: lastMsg
            ? new Date(lastMsg.createdAt).toLocaleDateString('en-SG', { month: 'short', day: 'numeric' })
            : new Date(chat.updatedAt).toLocaleDateString('en-SG', { month: 'short', day: 'numeric' }),
        };
      });

      return NextResponse.json({ conversations });
    }

    // Validate required params
    if (!ownerId || !caregiverId) {
      return NextResponse.json({ error: 'ownerId and caregiverId are required' }, { status: 400 });
    }

    // Verify user is part of this conversation
    if (userId !== ownerId && userId !== caregiverId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Check if a chat already exists between these users
    let chat = await prisma.chat.findUnique({
      where: {
        ownerId_caregiverId: {
          ownerId,
          caregiverId,
        },
      },
      select: { id: true },
    });

    // If chat exists, return it
    if (chat) {
      return NextResponse.json({ chatId: chat.id, isNew: false });
    }

    // If no chat exists, create a new one
    chat = await prisma.chat.create({
      data: {
        ownerId,
        caregiverId,
      },
      select: { id: true },
    });

    return NextResponse.json({ chatId: chat.id, isNew: true });
  } catch (error) {
    console.error('Get/create chat error:', error);
    return NextResponse.json({ error: 'Failed to get or create chat' }, { status: 500 });
  }
}