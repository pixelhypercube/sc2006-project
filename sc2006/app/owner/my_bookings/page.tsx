"use client"
import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Link from "next/link";
import { useBooking } from "@/hooks/useBooking";
import { useAuth } from "@/hooks/useAuth";
import ReviewModal from "./ReviewModal"; // Import the new modal here
import { 
    Clock, 
    Calendar, 
    MapPin, 
    MessageCircle, 
    CalendarDays, 
    Activity,
    Star,
    CheckCircle,
    DollarSign,
    AlertCircle,
    Check
} from "lucide-react";

export default function Bookings() {
    const [activeTab, setActiveTab] = useState("active");
    const [reviewCaregiver, setReviewCaregiver] = useState<{ id: string; name: string } | null>(null);
    const [bookings, setBookings] = useState<any[]>([]);
    const [paymentLoading, setPaymentLoading] = useState<string | null>(null);
    const { user } = useAuth();
    const { fetchBooking, loading, error } = useBooking();

    useEffect(() => {
        if (user?.id) {
            loadBookings();
        }}, [user]);

    const loadBookings = async () => {
        if (!user?.id) return;
        const data = await fetchBooking({ownerId: user.id});
        console.log("Fetched Bookings:", data);

        // Map fetched data to expected format
        const mappedBookings = (data || []).map((b: any) => ({
            id: b.id,
            petName: b.pet?.name ?? 'Unknown Pet',
            caregiverId: b.caregiver?.id ?? '',
            caregiverName: b.caregiver?.name ?? 'Unknown Caregiver',
            dates: `${new Date(b.startDate).toLocaleDateString()} - ${new Date(b.endDate).toLocaleDateString()}`,
            location: 'In Home',
            price: b.totalPrice ?? 0,
            status: b.status,
            hasReview: !!b.review,
        }));

        setBookings(mappedBookings);
    };

    const filteredBookings = bookings.filter(b => {
        if (activeTab === "active") {
            return ["PENDING", "ACTIVE", "CONFIRMED","IN_PROGRESS"].includes(b.status.toUpperCase());
        } else {
            return ["COMPLETED", "CANCELLED", "DECLINED"].includes(b.status.toUpperCase());
        }
    });
    console.log("Filtered Bookings:", filteredBookings);

    const handlePayment = async (bookingId: string, amount: number) => {
        setPaymentLoading(bookingId);
        try {
            // Update booking payment status locally to simulate payment
            setBookings(prev => prev.map(b => 
                b.id === bookingId ? { ...b, paymentStatus: "PAID" } : b
            ));
        } catch (err) {
            console.error("Payment failed:", err);
        } finally {
            setPaymentLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            <Navbar />
            
            <main className="max-w-4xl mx-auto pt-12 px-6">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">My Bookings</h1>
                        <p className="text-slate-500 mt-2 text-base font-medium">Track your pet's care schedule and live updates.</p>
                    </div>
                </div>

                {/* TAB SWITCHER */}
                <div className="flex gap-2 mb-10 bg-slate-200/50 p-1.5 rounded-xl w-fit border border-slate-200/50">
                    {["active", "past"].map((tab) => {                                                                                    
                         const count = tab === "active"                                                                                    
                             ? bookings.filter(b => ["PENDING", "ACTIVE", "CONFIRMED", "IN_PROGRESS"].includes(b.status)).length                          
                             : bookings.filter(b => ["COMPLETED", "CANCELLED", "DECLINED"].includes(b.status)).length;                                 
                         return (                                                                                                          
                             <button                                                                                                       
                                 key={tab}                                                                                                 
                                 onClick={() => setActiveTab(tab)}                                                                         
                                 className={`px-8 py-2.5 rounded-lg text-sm font-black uppercase tracking-widest transition-all ${         
                                     activeTab === tab                                                                                     
                                     ? "bg-white shadow-sm text-slate-900"                                                                 
                                     : "text-slate-400 hover:text-slate-600"                                                               
                                 }`}>                                                                                                             
                                {tab} ({count})                                                                                           
                            </button>                                                                                                     
                        );                                                                                                                
                    })}
                </div>

                <div className="space-y-6">
                    {filteredBookings.length > 0 ? (
                        filteredBookings.map((booking) => (
                            <div key={booking.id} className="bg-white border border-slate-100 rounded-4xl p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-4">
                                        <h3 className="text-2xl font-black text-slate-900">{booking.petName}</h3>
                                        <span className={`px-3.5 py-1.5 text-xs font-black rounded-xl border uppercase tracking-widest flex items-center gap-1.5 ${
                                            booking.status === 'Active' 
                                            ? "bg-teal-50 text-teal-600 border-teal-100 animate-pulse" 
                                            : booking.status === 'Completed'
                                            ? "bg-slate-50 text-slate-600 border-slate-200"
                                            : "bg-amber-50 text-amber-600 border-amber-100"
                                        }`}>
                                            {booking.status === 'Active' && <Activity size={12} strokeWidth={3} />}
                                            {booking.status === 'Confirmed' && <Clock size={12} strokeWidth={3} />}
                                            {booking.status === 'Completed' && <CheckCircle size={12} strokeWidth={3} />}
                                            {booking.status === 'Active' ? 'Live Now' : booking.status}
                                        </span>
                                    </div>
                                    <p className="text-slate-500 text-base font-medium">Care provided by <span className="text-slate-900 font-bold">{booking.caregiverName}</span></p>
                                    
                                    <div className="flex flex-wrap gap-x-8 gap-y-3 mt-4 text-sm font-bold text-slate-600 bg-slate-50 w-fit px-5 py-3 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <span className="text-teal-500"><Calendar size={16} /></span> {booking.dates}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-teal-500"><MapPin size={16} /></span> {booking.location}
                                        </div>
                                    </div>

                                    {/* PAYMENT REQUEST SECTION */}
                                    {booking.paymentStatus === "PENDING" && booking.paymentAmount && (
                                        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <AlertCircle size={18} className="text-amber-600" />
                                                <div>
                                                    <p className="text-xs font-black uppercase text-amber-600 tracking-widest">Payment Pending</p>
                                                    <p className="text-lg font-black text-amber-900">${booking.paymentAmount.toFixed(2)}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handlePayment(booking.id, booking.paymentAmount)}
                                                disabled={paymentLoading === booking.id}
                                                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-lg transition-all active:scale-95"
                                            >
                                                {paymentLoading === booking.id ? "Processing..." : "Pay Now"}
                                            </button>
                                        </div>
                                    )}

                                    {booking.paymentStatus === "PAID" && (
                                        <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
                                            <Check size={18} className="text-emerald-600" strokeWidth={3} />
                                            <div>
                                                <p className="text-xs font-black uppercase text-emerald-600 tracking-widest">Payment Completed</p>
                                                <p className="text-sm font-bold text-emerald-900">${booking.paymentAmount?.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-3 w-full md:w-auto">
                                    <Link 
                                        href={`/owner/messages`}
                                        className="flex-1 px-6 py-3.5 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 active:scale-95"
                                    >
                                        <MessageCircle size={16} /> Message
                                    </Link>
                                    
                                    {booking.status === "Active" && (
                                        <Link 
                                            href={`/owner/active_care`}
                                            className="flex-1 px-8 py-3.5 bg-teal-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 text-center flex items-center justify-center gap-2 active:scale-95"
                                        >
                                            <Activity size={16} /> Active Hub
                                        </Link>
                                    )}

                                    {booking.status === "COMPLETED" && !booking.hasReview && (
                                        <button
                                            onClick={() => setReviewCaregiver({ id: booking.id, name: booking.caregiverName })}
                                            className="flex-1 px-8 py-3.5 bg-amber-50 text-amber-600 border border-amber-200 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-100 transition-all text-center flex items-center justify-center gap-2 active:scale-95"
                                        >
                                            <Star size={16} fill="currentColor" /> Leave Review
                                        </button>
                                    )}
                                    {booking.status === "COMPLETED" && booking.hasReview && (
                                        <span className="flex-1 px-8 py-3.5 bg-slate-50 text-slate-400 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-center flex items-center justify-center gap-2">
                                            <Star size={16} fill="currentColor" /> Reviewed
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-white border-2 border-dashed border-slate-200 rounded-[2.5rem] p-20 text-center flex flex-col items-center shadow-sm">
                            <div className="text-slate-200 mb-6 bg-slate-50 p-6 rounded-full">
                                <CalendarDays size={48} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">No {activeTab} bookings</h3>
                            <p className="text-slate-500 mb-8 font-medium mt-2">Ready to find the perfect match for your pet?</p>
                            <Link href="/owner/search_caregivers" className="bg-teal-600 text-white text-xs uppercase tracking-widest px-10 py-4 rounded-2xl font-black hover:bg-teal-700 transition-all shadow-xl shadow-teal-600/20 active:scale-95">
                                Browse Caregivers
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            {/* REVIEW MODAL */}
            {reviewCaregiver && (
                <ReviewModal
                    bookingId={reviewCaregiver.id}
                    caregiverName={reviewCaregiver.name}
                    onClose={() => setReviewCaregiver(null)}
                    onSubmitted={loadBookings}
                />
            )}
        </div>
    );
}