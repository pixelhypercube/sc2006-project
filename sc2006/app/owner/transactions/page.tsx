"use client"
import { useEffect, useMemo, useState } from "react";
import { CheckCircle, CreditCard, QrCode, Smartphone, Wallet, X } from "lucide-react";
import Navbar from "../../components/Navbar";
import { useToast } from "../../context/ToastContext";

type Transaction = {
    id: string;
    bookingId: string;
    caregiverId: string;
    date: string;
    pet: string;
    caretaker: string;
    amount: number;
    fee: number;
    total: number;
    status: "Paid" | "Pending";
};

function sortByLatestDate<T extends { date: string }>(transactions: T[]) {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

type PaymentRequestPayload = {
    bookingId: string;
    petName: string;
    amount: number;
    status: "PENDING" | "PAID";
};

function PaymentModal({
    transaction,
    onClose,
    onConfirm,
    isProcessing,
}: {
    transaction: Transaction;
    onClose: () => void;
    onConfirm: (paymentMethod: "paynow" | "card") => void;
    isProcessing: boolean;
}) {
    const [paymentMethod, setPaymentMethod] = useState<"paynow" | "card">("paynow");
    const [step, setStep] = useState<"select" | "pay">("select");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between bg-amber-500 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                            <Wallet className="text-white" size={20} />
                        </div>
                        <h3 className="text-lg font-bold text-white">Payment</h3>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isProcessing}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 transition-colors hover:bg-white/30 disabled:cursor-not-allowed"
                    >
                        <X size={16} className="text-white" />
                    </button>
                </div>

                <div className="space-y-6 p-6">
                    <div className="text-center">
                        <p className="mb-1 text-sm font-medium text-slate-500">Payment Amount</p>
                        <p className="text-4xl font-black text-slate-900">${transaction.amount.toFixed(2)}</p>
                        <p className="mt-2 text-xs text-slate-400">For {transaction.pet}&apos;s care</p>
                    </div>

                    {step === "select" && (
                        <div className="space-y-4">
                            <p className="text-sm font-bold uppercase tracking-wider text-slate-700">Select Payment Method</p>
                            <div className="space-y-3">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod("paynow")}
                                    className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                                        paymentMethod === "paynow" ? "border-amber-500 bg-amber-50" : "border-slate-200 hover:border-slate-300"
                                    }`}
                                >
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${paymentMethod === "paynow" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                                        <QrCode size={24} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-bold text-slate-900">PayNow</p>
                                        <p className="text-xs text-slate-500">Scan QR code with your banking app</p>
                                    </div>
                                    {paymentMethod === "paynow" && <CheckCircle size={14} className="text-amber-500" />}
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod("card")}
                                    className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 transition-all ${
                                        paymentMethod === "card" ? "border-amber-500 bg-amber-50" : "border-slate-200 hover:border-slate-300"
                                    }`}
                                >
                                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${paymentMethod === "card" ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                                        <CreditCard size={24} />
                                    </div>
                                    <div className="flex-1 text-left">
                                        <p className="font-bold text-slate-900">Credit/Debit Card</p>
                                        <p className="text-xs text-slate-500">Visa, Mastercard, or other cards</p>
                                    </div>
                                    {paymentMethod === "card" && <CheckCircle size={14} className="text-amber-500" />}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={() => setStep("pay")}
                                disabled={isProcessing}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-4 text-base font-bold uppercase tracking-wider text-white shadow-lg shadow-amber-500/30 transition-all hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-400"
                            >
                                <span>Next</span>
                            </button>
                        </div>
                    )}

                    {step === "pay" && (
                        <div className="space-y-6">
                            {paymentMethod === "paynow" && (
                                <div className="space-y-6">
                                    <div className="text-center">
                                        <p className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-700">Scan to Pay</p>
                                        <div className="inline-block rounded-2xl border-2 border-slate-200 bg-white p-6 shadow-sm">
                                            <div className="flex h-48 w-48 items-center justify-center overflow-hidden">
                                                <img
                                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=paynow-booking-${transaction.bookingId}-${transaction.amount}&margin=0`}
                                                    alt="Payment QR Code"
                                                    className="h-full w-full object-contain"
                                                    crossOrigin="anonymous"
                                                />
                                            </div>
                                        </div>
                                        <p className="mt-4 text-xs text-slate-500">Open your banking app and scan this QR code</p>
                                    </div>

                                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                        <div className="flex items-start gap-3">
                                            <Smartphone className="mt-0.5 text-amber-600" size={18} />
                                            <div className="text-sm">
                                                <p className="font-bold text-amber-800">PayNow Instructions</p>
                                                <p className="mt-1 text-amber-700">
                                                    1. Open your bank&apos;s mobile app<br />
                                                    2. Select &quot;Scan &amp; Pay&quot; or &quot;PayNow&quot;<br />
                                                    3. Scan the QR code above<br />
                                                    4. Confirm the payment of <strong>${transaction.amount.toFixed(2)}</strong>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {paymentMethod === "card" && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">Card Number</label>
                                        <input
                                            type="text"
                                            defaultValue="4242 4242 4242 4242"
                                            readOnly
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">Expiry</label>
                                            <input
                                                type="text"
                                                defaultValue="12/28"
                                                readOnly
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                            />
                                        </div>
                                        <div>
                                            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">CVV</label>
                                            <input
                                                type="text"
                                                defaultValue="123"
                                                readOnly
                                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => onConfirm(paymentMethod)}
                                disabled={isProcessing}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-4 text-base font-bold uppercase tracking-wider text-white shadow-lg shadow-amber-500/30 transition-all hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-400"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <Wallet size={18} />
                                        <span>Pay Now</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep("select")}
                                className="w-full py-3 text-sm font-bold uppercase tracking-wider text-slate-600 transition-colors hover:text-slate-800"
                            >
                                ← Back to Payment Methods
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function TransactionTable({
    transactions,
    onMessage,
    messagingBookingId,
}: {
    transactions: Transaction[];
    onMessage?: (transaction: Transaction) => void;
    messagingBookingId?: string | null;
}) {
    return (
        <section className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            {transactions.length === 0 ? (
                <p className="px-6 py-8 text-sm text-gray-500">No payments found yet.</p>
            ) : (
                <table className="w-full table-fixed text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                        <tr>
                            <th className="w-[32%] px-4 py-4">Transaction Details</th>
                            <th className="w-[20%] px-4 py-4 text-right">Caregiver</th>
                            <th className="w-[15%] px-4 py-4 text-right">Status</th>
                            <th className="w-[11%] px-4 py-4 text-right">Care Amount</th>
                            <th className="w-[11%] px-4 py-4 text-right">Fee (5%)</th>
                            <th className="w-[11%] px-4 py-4 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 text-sm">
                        {transactions.map((tx) => (
                            <tr key={tx.id} className="align-top">
                                <td className="px-4 py-5">
                                    <p className="font-bold text-slate-900">My Pet: {tx.pet}</p>
                                    <p className="mt-0.5 text-xs text-gray-400">
                                        ID: {tx.bookingId} • {new Date(tx.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                                    </p>
                                </td>
                                <td className="px-4 py-5 text-right text-gray-600">{tx.caretaker}</td>
                                <td className="px-4 py-5 text-right">
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`inline-flex w-20 justify-center rounded-full px-3 py-1 text-xs font-black uppercase tracking-widest ${tx.status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                            {tx.status}
                                        </span>
                                        {onMessage && tx.status === "Pending" && (
                                            <button
                                                type="button"
                                                onClick={() => onMessage(tx)}
                                                disabled={messagingBookingId === tx.bookingId}
                                                className="inline-flex w-20 items-center justify-center rounded-full bg-red-100 px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-red-700 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {messagingBookingId === tx.bookingId ? "Opening..." : "Pay"}
                                            </button>
                                        )}
                                    </div>
                                </td>
                                <td className="px-4 py-5 text-right text-gray-600 whitespace-nowrap">${tx.amount.toFixed(2)}</td>
                                <td className="px-4 py-5 text-right text-teal-600 font-medium whitespace-nowrap">+${tx.fee.toFixed(2)}</td>
                                <td className="px-4 py-5 text-right font-bold text-slate-900 whitespace-nowrap">${tx.total.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </section>
    );
}

export default function Transactions() {
    const { fireToast } = useToast();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [activePayment, setActivePayment] = useState<Transaction | null>(null);
    const [activePaymentMessageId, setActivePaymentMessageId] = useState<string | null>(null);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false);

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const response = await fetch("/api/auth/me", { credentials: "include" });
                const data = await response.json();

                if (response.ok && data.user?.id) {
                    setCurrentUserId(data.user.id);
                }
            } catch {
                setCurrentUserId(null);
            }
        };

        const fetchTransactions = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch("/api/payment", {
                    method: "GET",
                    credentials: "include",
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data?.error || "Failed to fetch payments");
                }

                setTransactions(data.transactions || []);
            } catch (fetchError) {
                const message = fetchError instanceof Error ? fetchError.message : "Failed to fetch payments";
                setError(message);
            } finally {
                setLoading(false);
            }
        };

        fetchCurrentUser();
        fetchTransactions();
    }, []);

    const sortedTransactions = sortByLatestDate(transactions);

    async function openPaymentModal(transaction: Transaction) {
        if (!currentUserId) {
            setError("Unable to open payment right now. Please refresh and try again.");
            return;
        }

        setError(null);
        try {
            const chatResponse = await fetch(`/api/chats?ownerId=${currentUserId}&caregiverId=${transaction.caregiverId}`, {
                credentials: "include",
            });

            const chatData = await chatResponse.json();
            if (!chatResponse.ok || !chatData.chatId) {
                throw new Error(chatData?.error || "Failed to find chat");
            }

            const messagesResponse = await fetch(`/api/messages?chatId=${chatData.chatId}`, {
                credentials: "include",
            });

            const messagesData = await messagesResponse.json();
            if (!messagesResponse.ok || !Array.isArray(messagesData.messages)) {
                throw new Error(messagesData?.error || "Failed to load messages");
            }

            const paymentMessage = messagesData.messages.find((message: { id: string; content: string }) =>
                typeof message.content === "string" && message.content.includes(`"bookingId":"${transaction.bookingId}"`)
            );

            if (!paymentMessage?.id) {
                throw new Error("No payment request was found for this booking.");
            }

            setActivePaymentMessageId(paymentMessage.id);
            setActivePayment(transaction);
        } catch (fetchError) {
            const message = fetchError instanceof Error ? fetchError.message : "Failed to open payment";
            setError(message);
        }
    }

    async function confirmPayment(paymentMethod: "paynow" | "card") {
        if (!activePayment || !activePaymentMessageId) {
            setError("Payment details are missing.");
            return;
        }

        setIsProcessingPayment(true);
        try {
            const response = await fetch("/api/payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    bookingId: activePayment.bookingId,
                    messageId: activePaymentMessageId,
                    paymentMethod,
                }),
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                throw new Error(data?.error || "Failed to complete payment");
            }

            fireToast("success", "Payment Successful", `Your payment of $${activePayment.amount.toFixed(2)} has been processed.`);
            setTransactions((prev) =>
                prev.map((transaction) =>
                    transaction.bookingId === activePayment.bookingId
                        ? { ...transaction, status: "Paid" }
                        : transaction
                )
            );
            setActivePayment(null);
            setActivePaymentMessageId(null);
        } catch (paymentError) {
            const message = paymentError instanceof Error ? paymentError.message : "Failed to complete payment";
            setError(message);
        } finally {
            setIsProcessingPayment(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-6xl mx-auto pt-12 px-6">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Billing & Transactions</h1>
                <p className="text-gray-500 mb-8">View your history and platform service fees.</p>

                {loading && <p className="text-gray-500">Loading payments...</p>}
                {error && <p className="text-red-500">{error}</p>}

                {!loading && !error && (
                    <TransactionTable
                        transactions={sortedTransactions}
                        onMessage={openPaymentModal}
                    />
                )}
            </main>

            {activePayment && (
                <PaymentModal
                    transaction={activePayment}
                    onClose={() => {
                        setActivePayment(null);
                        setActivePaymentMessageId(null);
                        setIsProcessingPayment(false);
                    }}
                    onConfirm={confirmPayment}
                    isProcessing={isProcessingPayment}
                />
            )}
        </div>
    );
}