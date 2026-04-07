"use client"
import { useEffect, useState } from "react";
import { Dog, Calendar, MapPin, Inbox, Check, X } from "lucide-react";
import Navbar from "../../components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useBooking } from "@/hooks/useBooking";
import { Booking } from "@/app/generated/prisma/browser";

// Used Omit to remove the raw ID fields from the base Prisma Booking type
type BookingWithRelations = Omit<Booking, "ownerId" | "caregiverId" | "petId"> & {
    owner: { id: string; name: string; avatar: string | null; email: string };
    caregiver: {
        id: string;
        name: string;
        avatar: string | null;
        email: string;
        caregiverProfile?: { dailyRate: number | null } | null;
    };
    pets: { pet: { id: string; name: string; type: string; breed: string | null; photo: string | null } }[];
    payment: { id: string; status: string; amount: number } | null;
};

function calculateBookingDays(startDate: string | Date, endDate: string | Date) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

const MOCK_BOOKINGS: BookingWithRelations[] = [
    {
        id: "REQ-88291",
        startDate: new Date("2026-07-01"),
        endDate: new Date("2026-07-05"),
        createdAt: new Date("2026-06-15"),
        updatedAt: new Date("2026-06-15"),
        status: "PENDING",
        totalPrice: 150.00,
        specialInstructions: "Buster gets a little anxious during thunderstorms. Please keep him indoors and play his favorite jazz playlist if it rains!",
        owner: { id: "o1", name: "Sarah Jenkins", email: "sarah.j@example.com", avatar: null },
        caregiver: { id: "c1", name: "Current User", email: "me@example.com", avatar: null },
        pets: [
            {
                pet: {
                    id: "p1",
                    name: "Buster",
                    type: "Dog",
                    breed: "Golden Retriever",
                    photo: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=150&q=80"
                }
            }
        ],
        payment: { id: "pay1", status: "PRE_AUTHORIZED", amount: 150.00 }
    },
    {
        id: "REQ-99302",
        startDate: new Date("2026-07-10"),
        endDate: new Date("2026-07-12"),
        createdAt: new Date("2026-06-20"),
        updatedAt: new Date("2026-06-20"),
        status: "PENDING",
        totalPrice: 75.50,
        specialInstructions: null,
        owner: { id: "o2", name: "David Chen", email: "d.chen@example.com", avatar: null },
        caregiver: { id: "c1", name: "Current User", email: "me@example.com", avatar: null },
        pets: [
            {
                pet: {
                    id: "p2",
                    name: "Luna",
                    type: "Cat",
                    breed: "Siamese",
                    photo: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=150&q=80"
                }
            }
        ],
        payment: { id: "pay2", status: "PENDING", amount: 75.50 }
    }
];

export default function IncomingRequests() {
    const { user, loading: authLoading } = useAuth();
    const { fetchBooking, updateBookingStatus, loading, error } = useBooking();
    const [bookings, setBookings] = useState<BookingWithRelations[]>([]);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        fetchBooking({ caregiverId: user.id }).then((data) =>
            setBookings((data as unknown as BookingWithRelations[]).filter((b) => b.status === "PENDING"))
        );
    }, [user]);

    const handleAction = async (bookingId: string, status: "CONFIRMED" | "DECLINED") => {
        setActionLoading(bookingId);
        const result = await updateBookingStatus(bookingId, status);
        if (result) {
            setBookings((prev) => prev.filter((b) => b.id !== bookingId));
        }
        setActionLoading(null);
    };

    const pendingRequests = bookings;

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-gray-50 font-sans">
                <Navbar />
                <main className="max-w-4xl mx-auto pt-12 px-6">
                    <p className="text-slate-500 font-medium">Loading...</p>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Navbar/>

            <main className="max-w-4xl mx-auto pt-12 px-6 pb-20">
                <div className="mb-8">
                    <h1 className="text-3xl font-black tracking-tight text-slate-900">Booking Requests</h1>
                    <p className="text-slate-500 mt-1 font-medium">Review and respond to new care inquiries.</p>
                </div>

                {error && (
                    <p className="text-red-500 mb-4 font-medium">{error}</p>
                )}

                {pendingRequests.length > 0 ? (
                    <div className="space-y-6">
                        {pendingRequests.map((req) => {
                            const pet = req.pets?.[0]?.pet;
                            const startDate = new Date(req.startDate).toLocaleDateString("en-SG", { month: "short", day: "numeric", year: "numeric" });
                            const endDate = new Date(req.endDate).toLocaleDateString("en-SG", { month: "short", day: "numeric", year: "numeric" });
                            const days = calculateBookingDays(req.startDate, req.endDate);
                            const rateBasedGross = Number((Number(req.caregiver?.caregiverProfile?.dailyRate ?? 0) * days).toFixed(2));
                            const gross = rateBasedGross || Number(req.totalPrice ?? 0);
                            const estimatedNet = Number((gross * 0.95).toFixed(2));

                            return (
                                <div key={req.id} className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden flex flex-col md:flex-row transition-all hover:shadow-md">
                                    {/* PET PREVIEW SIDEBAR */}
                                    <div className="md:w-48 bg-teal-50 flex flex-col items-center justify-center p-8 border-r border-gray-50">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-4 border border-teal-100/50">
                                            {pet?.photo ? (
                                                <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover rounded-2xl" />
                                            ) : (
                                                <Dog size={32} className="text-teal-600" />
                                            )}
                                        </div>
                                        <p className="font-bold text-slate-900 text-sm mb-1">{pet?.name ?? "—"}</p>
                                        <p className="text-[10px] text-teal-600 font-black uppercase tracking-widest">
                                            {pet ? `${pet.type}${pet.breed ? ` (${pet.breed})` : ""}` : "—"}
                                        </p>
                                    </div>

                                    {/* REQUEST DETAILS */}
                                    <div className="flex-1 p-8">
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">Request from {req.owner?.name ?? "Owner"}</h3>
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">ID: {req.id}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-teal-600">${estimatedNet.toFixed(2)}</p>
                                                <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Est. Earnings</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                                                <div className="text-slate-400"><Calendar size={16} /></div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Dates</p>
                                                    <p className="text-xs font-bold text-slate-700 leading-none pt-px">{startDate} – {endDate}</p>
                                                </div>
                                            </div>
                                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                                                <div className="text-slate-400"><MapPin size={16} /></div>
                                                <div>
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Owner</p>
                                                    <p className="text-xs font-bold text-slate-700 leading-none pt-px">{req.owner?.email ?? "—"}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {req.specialInstructions && (
                                            <div className="mb-10">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Special Instructions</p>
                                                <div className="bg-teal-50/30 p-5 rounded-2xl border border-teal-50 italic text-sm text-slate-600 leading-relaxed">
                                                    "{req.specialInstructions}"
                                                </div>
                                            </div>
                                        )}

                                        {/* ACTION BUTTONS */}
                                        <div className="flex flex-col sm:flex-row gap-3">
                                            <button
                                                onClick={() => handleAction(req.id, "CONFIRMED")}
                                                disabled={actionLoading === req.id}
                                                className="flex-1 flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-lg shadow-teal-600/20 active:scale-[0.98]">
                                                <Check size={16} /> {actionLoading === req.id ? "Processing..." : "Accept Request"}
                                            </button>

                                            <button
                                                onClick={() => handleAction(req.id, "DECLINED")}
                                                disabled={actionLoading === req.id}
                                                className="flex-1 flex items-center justify-center gap-2 border-2 border-slate-100 hover:bg-slate-50 disabled:opacity-50 text-slate-400 hover:text-slate-600 text-xs font-black uppercase tracking-widest py-4 rounded-xl transition-all active:scale-[0.98]">
                                                <X size={16} /> Decline
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-24 text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-3xl flex items-center justify-center mb-6">
                            <Inbox size={40} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">No pending requests</h3>
                        <p className="text-slate-500 mt-2 font-medium">New pet owner inquiries will appear here.</p>
                    </div>
                )}
            </main>
        </div>
    );
}