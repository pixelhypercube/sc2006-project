"use client"
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Navbar from "../components/Navbar";
import Link from "next/link";
import {
    Dog,
    Video,
    Lock,
    ChevronRight
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useBooking } from "@/hooks/useBooking";
import { Booking } from "@/app/generated/prisma/browser";

type BookingWithRelations = Booking & {
    owner: { id: string; name: string; avatar: string | null; email: string };
    caregiver: { id: string; name: string; avatar: string | null; email: string };
    payment: { id: string; status: string; amount: number } | null;
    pet: { id: string; name: string; type: string; breed: string | null } | null;
};

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
    const { fetchBooking, loading } = useBooking();
    const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
    const [pendingCount, setPendingCount] = useState(0);

    async function openChat(ownerId: string, caregiverId: string) {
        try {
        const res = await fetch(`/api/chats?ownerId=${ownerId}&caregiverId=${caregiverId}`);
        const data = await res.json();
        if (data.bookingId) {
            router.push(`/caregiver/messages?bookingId=${data.bookingId}`);
        } else {
            alert('Failed to open chat: ' + (data.error ?? 'Unknown error'));
        }
        } catch {
        alert('Failed to open chat due to network error');
        }
    }
    useEffect(() => {
        if (!user) return;
        fetchBooking({ caregiverId: user.id }).then((data) => {
            const all = data as BookingWithRelations[];
            setBookings(all.filter((b) => b.status === "CONFIRMED" || b.status === "IN_PROGRESS"));
            setPendingCount(all.filter((b) => b.status === "PENDING").length);
        });
    }, [user]);

    const totalEarnings = bookings.reduce((sum, b) => sum + b.totalPrice * 0.95, 0);

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
                            <span className="bg-teal-100 text-teal-600 text-xs px-2 py-0.5 rounded-full">{bookings.length}</span>
                        </h2>

                        {loading && (
                            <p className="text-slate-400 font-medium text-sm">Loading...</p>
                        )}

                        {!loading && bookings.length === 0 && (
                            <div className="bg-white border border-slate-100 rounded-2xl p-10 text-center text-slate-400 font-medium text-sm">
                                No active arrangements.
                            </div>
                        )}

                        {bookings.map((booking) => (
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

                                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                    <p className="text-sm font-bold text-teal-600">${(booking.totalPrice * 0.95).toFixed(2)} <span className="text-slate-400 font-medium text-xs">earnings</span></p>
                                    <button
    className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
    onClick={() => openChat(booking.owner.id, booking.caregiver.id)}
  >
    Open Chat
  </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* RIGHT: QUICK ACTIONS */}
                    <div className="space-y-8">
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 mb-6 text-center">Quick Actions</h2>
                            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-3">

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

                        {/* DATA PRIVACY REMINDER */}
                        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl shadow-slate-900/20">
                            <h4 className="font-bold text-md mb-2 flex items-center gap-2">
                                <span className="flex items-center justify-center shrink-0">
                                    <Lock size={24} className="text-teal-400"/>
                                </span>
                                <span className="leading-none pt-[1.5px]">
                                    Privacy First
                                </span>
                            </h4>
                            <p className="text-sm text-slate-400 leading-relaxed font-medium">
                                All check-in videos are deleted 1 week after the contract ends. Do not save pet media to your local device.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
