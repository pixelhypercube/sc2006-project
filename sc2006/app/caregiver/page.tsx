/**
 * Caregiver Dashboard Page
 * 
 * This page displays the caregiver's active bookings and earnings.
 * It fetches real data from the backend API.
 * 
 * Expected API endpoints:
 * - GET /api/auth/me - Returns current logged-in user
 * - GET /api/booking?caregiverId={id} - Returns bookings for a caregiver
 * - POST /api/chats - Opens chat with owner
 */

"use client"
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Navbar from "../components/Navbar";
import Link from "next/link";
import {
    Dog,
    ChevronRight,
    DollarSign,
    Calendar
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBooking } from "@/hooks/useBooking";
import { useToast } from "../context/ToastContext";
import { Booking } from "@/app/generated/prisma/browser";
import CaregiverAvailabilityModal from "../components/CaregiverAvailabilityModal";
import WindowDialog from "../components/WindowDialog";

type BookingWithRelations = Booking & {
    owner: { id: string; name: string; avatar: string | null; email: string };
    caregiver: {
        id: string;
        name: string;
        avatar: string | null;
        email: string;
        caregiverProfile?: { dailyRate: number | null } | null;
    };
    payment: { id: string; status: string; amount: number } | null;
    pet: { id: string; name: string; type: string; breed: string | null } | null;
    paymentStatus: string | null;
    paymentAmount: number | null;
};

function calculateBookingDays(startDate: string | Date, endDate: string | Date) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Normalize to midnight to avoid partial-day drift from time-of-day offsets.
    const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const diffMs = endMidnight.getTime() - startMidnight.getTime();

    // Inclusive range: same-day booking counts as 1 day.
    return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
}

function calculateNetFromRate(booking: BookingWithRelations) {
    const days = calculateBookingDays(booking.startDate, booking.endDate);
    const dailyRate = Number(booking.caregiver?.caregiverProfile?.dailyRate ?? 0);
    const gross = Number((dailyRate * days).toFixed(2));
    const safeGross = gross || Number(booking.totalPrice ?? 0);
    return Number((safeGross * 0.95).toFixed(2));
}

const STATUS_STYLES: Record<string, string> = {
    CONFIRMED: "bg-teal-50 text-teal-600 border border-teal-100",
    IN_PROGRESS: "bg-blue-50 text-blue-600 border border-blue-100",
};

const STATUS_LABELS: Record<string, string> = {
    CONFIRMED: "Confirmed",
    IN_PROGRESS: "In Progress",
};

export default function CaregiverDashboard() {
    const router = useRouter();
    const { user } = useAuth();
    const { fetchBooking, updateBookingStatus, loading } = useBooking();
    const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
    const [pendingCount, setPendingCount] = useState(0);
    const [endBookingTarget, setEndBookingTarget] = useState<BookingWithRelations | null>(null);
    const [endingBookingId, setEndingBookingId] = useState<string | null>(null);
    const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
    const [availabilityStart, setAvailabilityStart] = useState<Date | null>(null);
    const [availabilityEnd, setAvailabilityEnd] = useState<Date | null>(null);
    const { fireToast } = useToast();

    const activeBookings = bookings.filter((booking) => booking.status === "CONFIRMED" || booking.status === "IN_PROGRESS");

    const handleEndBookingRequest = (booking: BookingWithRelations) => {
        setEndBookingTarget(booking);
    };

    const handleConfirmEndBooking = async () => {
        if (!endBookingTarget) return;

        setEndingBookingId(endBookingTarget.id);
        const result = await updateBookingStatus(endBookingTarget.id, "COMPLETED");

        if (result?.success) {
            const completedBooking = (result.booking ?? endBookingTarget) as BookingWithRelations;
            setBookings((prev) => prev.map((booking) => (
                booking.id === completedBooking.id
                    ? { ...booking, status: "COMPLETED" }
                    : booking
            )));
            fireToast("success", "Booking Ended", `Booking for ${completedBooking.pet?.name ?? "pet"} has been marked as completed. Payment request posted in chat.`);
        } else {
            fireToast("danger", "Unable To End Booking", "Please try again.");
        }

        setEndingBookingId(null);
        setEndBookingTarget(null);
    };

    const handleAvailabilityConfirm = (startDate: Date, endDate: Date | null) => {
        const saveAvailability = async () => {
            if (!user?.name) {
                fireToast("danger", "Save Failed", "Unable to identify your profile right now.");
                return;
            }

            try {
                const response = await fetch("/api/profile", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({
                        name: user.name,
                        availabilityStartDate: startDate.toISOString(),
                        availabilityEndDate: endDate ? endDate.toISOString() : null,
                    }),
                });

                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data?.error || "Failed to save availability");
                }

                setAvailabilityStart(startDate);
                setAvailabilityEnd(endDate);
                setShowAvailabilityModal(false);

                const endStr = endDate
                    ? endDate.toLocaleDateString("en-SG", { month: "short", day: "numeric", year: "numeric" })
                    : "Open-ended";
                fireToast(
                    "info",
                    "Availability Updated",
                    `Your availability is set from ${startDate.toLocaleDateString("en-SG", { month: "short", day: "numeric" })} to ${endStr}.`
                );
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to save availability";
                fireToast("danger", "Save Failed", message);
            }
        };

        saveAvailability();
    };

    const handleAvailabilityClear = async () => {
        if (!user?.name) {
            fireToast("danger", "Clear Failed", "Unable to identify your profile right now.");
            return;
        }

        try {
            const response = await fetch("/api/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    name: user.name,
                    availabilityStartDate: null,
                    availabilityEndDate: null,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.error || "Failed to clear availability");
            }

            setAvailabilityStart(null);
            setAvailabilityEnd(null);
            setShowAvailabilityModal(false);
            fireToast("info", "Availability Cleared", "Your availability dates have been removed.");
        } catch (error) {
            const message = error instanceof Error ? error.message : "Failed to clear availability";
            fireToast("danger", "Clear Failed", message);
        }
    };

    async function openChat(ownerId: string, caregiverId: string) {
        try {
            const res = await fetch(`/api/chats?ownerId=${ownerId}&caregiverId=${caregiverId}`);
            const data = await res.json();
            if (data.chatId) {
                router.push(`/caregiver/messages?chatId=${data.chatId}`);
            } else {
                fireToast("danger", "Chat Error", data.error ?? "Failed to open chat.");
            }
        } catch {
            fireToast("danger", "Network Error", "Failed to open chat due to network error.");
        }
    }

    useEffect(() => {
        if (!user) return;
        
        fetchBooking({ caregiverId: user.id }).then((data) => {
            const all = data as BookingWithRelations[];
            setBookings(all);
            setPendingCount(all.filter((b) => b.status === "PENDING").length);
        });
    }, [user]);

    useEffect(() => {
        const loadAvailability = async () => {
            if (!user?.id) return;

            try {
                const response = await fetch("/api/auth/me", { credentials: "include" });
                const data = await response.json();

                if (!response.ok) return;

                const start = data?.user?.caregiverProfile?.availabilityStartDate;
                const end = data?.user?.caregiverProfile?.availabilityEndDate;

                setAvailabilityStart(start ? new Date(start) : null);
                setAvailabilityEnd(end ? new Date(end) : null);
            } catch {
                setAvailabilityStart(null);
                setAvailabilityEnd(null);
            }
        };

        loadAvailability();
    }, [user?.id]);

    const totalEarnings = activeBookings.reduce((sum, b) => sum + calculateNetFromRate(b), 0);

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            <Navbar />

            <main className="max-w-5xl mx-auto px-6 py-10">
                {/* WELCOME & REVENUE */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Caregiver Console</h1>
                        <p className="text-slate-500 mt-1">Manage your active guests and pending requests.</p>
                    </div>
                    <div className="bg-white p-4 px-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Earnings</p>
                            <p className="text-xl font-black text-teal-600">${totalEarnings.toFixed(2)}</p>
                        </div>
                        <div className="h-8 w-px bg-slate-100"></div>
                        <p className="text-xs text-slate-400 max-w-20 leading-tight font-medium">
                            After 5% platform fee
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* LEFT: ACTIVE JOBS */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            Active Arrangements
                            <span className="bg-teal-100 text-teal-600 text-xs px-2 py-0.5 rounded-full">{activeBookings.length}</span>
                        </h2>

                        {loading && (
                            <p className="text-slate-400 font-medium text-sm">Loading...</p>
                        )}

                        {!loading && activeBookings.length === 0 && (
                            <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center text-slate-400 font-medium text-sm">
                                No active arrangements.
                            </div>
                        )}

                        {activeBookings.map((booking) => (
                            <div key={booking.id} className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center">
                                            <Dog size={28} className="text-teal-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">{booking.owner?.name ?? "Owner"}</h3>
                                            <p className="text-sm text-slate-500">Pet: {booking.pet?.name ?? "—"}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {new Date(booking.startDate).toLocaleDateString("en-SG", { month: "short", day: "numeric" })} – {new Date(booking.endDate).toLocaleDateString("en-SG", { month: "short", day: "numeric", year: "numeric" })}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${STATUS_STYLES[booking.status] ?? "bg-slate-50 text-slate-500"}`}>
                                        {STATUS_LABELS[booking.status] ?? booking.status}
                                    </span>
                                </div>

                                {/* Payment Status Display */}
                                {booking.paymentStatus === "PENDING" && booking.paymentAmount && (
                                    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <DollarSign size={16} className="text-amber-600" />
                                            <p className="text-xs font-bold text-amber-700">
                                                ${booking.paymentAmount.toFixed(2)} requested
                                            </p>
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                                            Pending
                                        </span>
                                    </div>
                                )}

                                {booking.paymentStatus === "PAID" && booking.paymentAmount && (
                                    <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <DollarSign size={16} className="text-emerald-600" />
                                            <p className="text-xs font-bold text-emerald-700">
                                                ${booking.paymentAmount.toFixed(2)} received
                                            </p>
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                                            Paid
                                        </span>
                                    </div>
                                )}

                                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                    <p className="text-sm font-bold text-teal-600">${calculateNetFromRate(booking).toFixed(2)} <span className="text-slate-400 font-medium text-xs">earnings</span></p>
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => handleEndBookingRequest(booking)}
                                            disabled={endingBookingId === booking.id}
                                            className="text-sm font-bold text-rose-600 hover:text-rose-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                        >
                                            {endingBookingId === booking.id ? "Ending..." : "End Booking"}
                                        </button>
                                        <button
                                            className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                                            onClick={() => openChat(booking.owner.id, booking.caregiver.id)}
                                        >
                                            Open Chat
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* RIGHT: QUICK ACTIONS */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 mb-6 text-center">Quick Actions</h2>
                            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-3">

                                <button
                                    onClick={() => setShowAvailabilityModal(true)}
                                    className="w-full flex justify-between items-center p-4 bg-teal-50 rounded-xl hover:bg-teal-100 transition-colors group"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
                                            <Calendar size={16} className="text-white" />

                                        </div>
                                        <div className="text-left">
                                            <span className="text-sm font-bold text-slate-700">My Availability</span>
                                            {availabilityStart && (
                                                <p className="text-xs text-slate-500 mt-1">
                                                    {availabilityStart.toLocaleDateString("en-SG", { year:"numeric", month: "short", day: "numeric" })}
                                                    {availabilityEnd && ` - ${availabilityEnd.toLocaleDateString("en-SG", { year:"numeric", month: "short", day: "numeric" })}`}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </button>

                                <Link
                                    href="/caregiver/requests"
                                    className="w-full flex justify-between items-center p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group"
                                >
                                    <span className="text-sm font-bold text-slate-700">New Requests</span>
                                    {pendingCount > 0 && (
                                        <span className="bg-teal-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{pendingCount}</span>
                                    )}
                                </Link>

                                <Link
                                    href="/caregiver/transactions"
                                    className="w-full flex justify-between items-center p-4 bg-white border border-transparent hover:border-slate-100 rounded-xl transition-colors group"
                                >
                                    <span className="text-sm font-bold text-slate-500 group-hover:text-teal-600">Earnings & Fees</span>
                                    <ChevronRight size={16} className="text-slate-400 group-hover:text-teal-600"/>
                                </Link>

                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* END BOOKING CONFIRMATION */}
            {endBookingTarget && (
                <WindowDialog
                    icon="warning"
                    title="End this booking?"
                    subtitle={`${endBookingTarget.owner?.name ?? "Owner"} • ${endBookingTarget.pet?.name ?? "Pet"}`}
                    description="This booking will be marked as completed and a payment request will be posted in chat automatically."
                    onClose={() => setEndBookingTarget(null)}
                    buttons={[
                        {
                            label: "Cancel",
                            onClick: () => setEndBookingTarget(null),
                            variant: "secondary",
                        },
                        {
                            label: "End Booking",
                            onClick: handleConfirmEndBooking,
                            variant: "danger",
                        },
                    ]}
                />
            )}

            {/* AVAILABILITY MODAL */}
            {showAvailabilityModal && (
                <CaregiverAvailabilityModal
                    onClose={() => setShowAvailabilityModal(false)}
                    onConfirm={handleAvailabilityConfirm}
                    onClear={handleAvailabilityClear}
                    initialStartDate={availabilityStart}
                    initialEndDate={availabilityEnd}
                />
            )}
        </div>
    );
}
