import { prisma } from "@/app/lib/prisma";
import {
  encodePaymentRequestContent,
  summarizePaymentRequest,
} from "./paymentRequestMessage";

type PaymentRequestChatInput = {
  bookingId: string;
  ownerId: string;
  caregiverId: string;
  senderId: string;
  petName: string;
  amount: number;
};

export async function requestPaymentInChat(input: PaymentRequestChatInput) {
  const chat = await prisma.chat.findUnique({
    where: {
      ownerId_caregiverId: {
        ownerId: input.ownerId,
        caregiverId: input.caregiverId,
      },
    },
    select: { id: true },
  }) ?? await prisma.chat.create({
    data: {
      ownerId: input.ownerId,
      caregiverId: input.caregiverId,
    },
    select: { id: true },
  });

  const existing = await prisma.message.findFirst({
    where: {
      chatId: chat.id,
      content: {
        contains: `"bookingId":"${input.bookingId}"`,
      },
    },
    select: { id: true },
  });

  if (existing) {
    return { chatId: chat.id, created: false };
  }

  const content = encodePaymentRequestContent({
    bookingId: input.bookingId,
    petName: input.petName,
    amount: input.amount,
    status: "PENDING",
  });

  const message = await prisma.message.create({
    data: {
      chatId: chat.id,
      senderId: input.senderId,
      content,
    },
    include: {
      sender: { select: { id: true, name: true, avatar: true } },
    },
  });

  await prisma.chat.update({
    where: { id: chat.id },
    data: {
      lastMessage: summarizePaymentRequest({
        bookingId: input.bookingId,
        petName: input.petName,
        amount: input.amount,
        status: "PENDING",
      }),
      updatedAt: new Date(),
    },
  });

  return { chatId: chat.id, created: true, message };
}