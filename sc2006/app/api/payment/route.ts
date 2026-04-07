import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/app/lib/prisma";
import { verifyToken } from "@/app/lib/utils";
import { decodePaymentRequestContent, encodePaymentRequestContent } from "@/app/lib/paymentRequestMessage";

function calculateBookingAmount(startDate: Date | string, endDate: Date | string, dailyRate?: number | null) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const rate = Number(dailyRate ?? 0);
  return Number((days * rate).toFixed(2));
}

// GET - List owner payment transactions from database
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token, process.env.JWT_SECRET!);
    if (!payload || typeof payload === "string") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = (payload as { userId: string }).userId;

    const bookings = await prisma.booking.findMany({
      where: {
        ownerId: userId,
        status: "COMPLETED",
      },
      include: {
        pet: { select: { name: true } },
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
      orderBy: { endDate: "desc" },
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
      const isCompleted = booking.payment?.status === "COMPLETED";
      const transactionDate =
        booking.payment?.paidAt ?? booking.payment?.updatedAt ?? booking.payment?.createdAt ?? booking.endDate;

      return {
        id: booking.payment?.id ?? booking.id,
        bookingId: booking.id,
        caregiverId: booking.caregiverId,
        date: transactionDate,
        pet: booking.pet?.name ?? "Pet",
        caretaker: booking.caregiver?.name ?? "Caregiver",
        amount: baseAmount,
        fee,
        total,
        status: isCompleted ? "Paid" : "Pending",
      };
    });

    return NextResponse.json({ transactions }, { status: 200 });
  } catch (error) {
    console.error("Fetch payments error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

// POST - Mark a booking payment as completed (simulated success flow)
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifyToken(token, process.env.JWT_SECRET!);
    if (!payload || typeof payload === "string") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = (payload as { userId: string }).userId;
    const { bookingId, messageId } = await request.json();

    if (!bookingId || !messageId) {
      return NextResponse.json({ error: "bookingId and messageId are required" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        owner: { select: { id: true } },
        caregiver: {
          select: {
            caregiverProfile: { select: { dailyRate: true } },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, content: true, chatId: true },
    });

    const decodedPayload = message ? decodePaymentRequestContent(message.content) : null;
    const rateBasedAmount = calculateBookingAmount(
      booking.startDate,
      booking.endDate,
      booking.caregiver?.caregiverProfile?.dailyRate
    ) || booking.totalPrice;
    const resolvedAmount = rateBasedAmount || decodedPayload?.amount || booking.totalPrice;
    const paymentPayload = decodedPayload && decodedPayload.bookingId === bookingId
      ? decodedPayload
      : {
          bookingId,
          petName: "Pet",
          amount: resolvedAmount,
          status: "PENDING" as const,
        };

    const paidPayload = {
      ...paymentPayload,
      amount: resolvedAmount,
      status: "PAID" as const,
    };

    const updatedPayment = await prisma.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        amount: paymentPayload.amount,
        status: "COMPLETED",
        paidAt: new Date(),
      },
      update: {
        amount: paymentPayload.amount,
        status: "COMPLETED",
        paidAt: new Date(),
      },
    });

    let updatedMessage = null;
    if (message) {
      updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          content: encodePaymentRequestContent(paidPayload),
        },
      });
    }

    if (message?.chatId) {
      await prisma.chat.update({
        where: { id: message.chatId },
        data: {
          lastMessage: `Payment completed for ${paidPayload.petName} - $${paidPayload.amount.toFixed(2)}`,
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        payment: updatedPayment,
        message: updatedMessage
          ? {
              ...updatedMessage,
              paymentData: paidPayload,
            }
          : null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Complete payment error:", error);
    return NextResponse.json({ error: "Failed to complete payment" }, { status: 500 });
  }
}
