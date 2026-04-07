export type PaymentRequestPayload = {
  bookingId: string;
  petName: string;
  amount: number;
  status: "PENDING" | "PAID";
};

export const PAYMENT_REQUEST_PREFIX = "[[PAYMENT_REQUEST]]";

export function encodePaymentRequestContent(payload: PaymentRequestPayload) {
  return `${PAYMENT_REQUEST_PREFIX}${JSON.stringify(payload)}`;
}

export function decodePaymentRequestContent(content: string): PaymentRequestPayload | null {
  if (!content.startsWith(PAYMENT_REQUEST_PREFIX)) {
    return null;
  }

  try {
    return JSON.parse(content.slice(PAYMENT_REQUEST_PREFIX.length)) as PaymentRequestPayload;
  } catch {
    return null;
  }
}

export function summarizePaymentRequest(payload: PaymentRequestPayload) {
  return `Payment request for ${payload.petName}'s care - $${payload.amount.toFixed(2)}`;
}