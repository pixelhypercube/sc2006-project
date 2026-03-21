"use client"
import { useState, useEffect, useCallback } from "react";
import { useParams } from 'next/navigation'; 
import Navbar from "../../../components/Navbar";
import BookingModal from "../BookingModal";
import { useUsers } from "@/hooks/useUsers";
import { usePets } from "@/hooks/usePets";
import { 
    ChevronLeft, 
    ShieldCheck, 
    MapPin, 
    Clock, 
    Star, 
    Dog, 
    Cat, 
    Bird, 
    Turtle, 
    Rabbit, 
    Fish,
    Calendar,
    MessageCircle,
    Home,
    CheckCircle2,
    Ban
} from "lucide-react";
import { Pet } from "@/app/generated/prisma/browser";

interface caregiver {
    name: string;
    location: string;
    // experience: string;
    // rating: number;
    // reviews: number;
    dailyRate: number;
    // imageUrl: string;
    verified: boolean;
    // petsHandled: string[];
    biography: string;
    // sizesHandled: string[];
}

const petIcons: Record<string, React.ReactNode> = {
    "dogs": <Dog size={14} />,
    "cats": <Cat size={14} />,
    "birds": <Bird size={14} />,
    "reptiles": <Turtle size={14} />,
    "small mammals": <Rabbit size={14} />,
    "fish": <Fish size={14} />
}

const dummycaregiver: caregiver = {
    name: "Sarah Chen",
    location: "Bukit Batok",
    // experience: "5+ years experience",
    // rating: 4.9,
    // reviews: 47,
    dailyRate: 65,
    verified: true,
    // petsHandled: ["dogs", "cats"],
    // sizesHandled: ["Small", "Medium", "Large"],
    // imageUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah",
    biography: "Professional pet sitter with over 5 years of experience. I treat every pet like my own family member. Specialized in dogs and cats, with certifications in pet first aid."
};

// --- NEW DEMO CONTENT DATA ---
const demoReviews = [
    { id: 1, user: "James Tan", rating: 5, date: "Feb 12, 2026", text: "Sarah was incredible with my poodle! She sent video updates every evening and followed the behavioral blueprint perfectly. Highly recommended!" },
    { id: 2, user: "Emily Lim", rating: 5, date: "Jan 28, 2026", text: "Very professional and patient. My cat usually hides from strangers but was comfortable with Sarah within a day. Will book again." },
    { id: 3, user: "Marcus Go", rating: 4, date: "Jan 15, 2026", text: "Great experience. Clear communication and very clean environment. My dog came back happy and well-fed." }
];

const serviceDetails = {
    houseRules: ["No pets on the sofa", "Vaccination records required", "Must be tick/flea treated"],
    amenities: ["Spacious Backyard", "Air-conditioned Room", "Nearby Pet Park", "24/7 Supervision"],
};

export default function caregiverProfile() {
    const params = useParams();
    const [activeTab, setActiveTab] = useState("About");
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const caregiverId = params.id as string;
    const [caregiver, setCaregiver] = useState<caregiver | null>(null);
    const [loading, setLoading] = useState(true);
    const { fetchPets } = usePets();
    const [pets, setPets] = useState<Pet[]>([]);
    
    const { fetchCaregiver } = useUsers();
    const loadCaregiver = useCallback(async () => {
    if (!caregiverId) return;
    setLoading(true);
    try {
        const data = await fetchCaregiver(caregiverId);
        const petsData = await fetchPets();
        setPets(petsData);
        setCaregiver(data.caregiver);
    } catch (error) {
        console.error('Failed to load caregiver:', error);
    } finally {
        setLoading(false);
    }
    }, [caregiverId, fetchCaregiver]);

    useEffect(() => {
    loadCaregiver();
    }, []);
  if (loading) return <div className="p-10">Loading profile...</div>;
  if (!caregiver) return <div className="p-10">Caregiver not found</div>;
    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            <Navbar />

            {/* HEADER SECTION */}
            <div className="bg-teal-600 pt-8 pb-12 px-6">
                <div className="max-w-5xl mx-auto">
                    <a href="#" onClick={() => history.back()} className="text-teal-50 hover:text-white flex items-center gap-1.5 mb-6 transition-colors text-sm font-bold">
                        <ChevronLeft size={16} /> Back to previous page
                    </a>

                    <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
                        <div className="flex gap-6 items-center">
                            {/* <img src={caregiver?.imageUrl} alt={caregiver?.name} className="w-32 h-32 bg-white rounded-3xl object-cover border-4 border-white/20 shadow-xl" /> */}
                            <div className="text-white">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-black tracking-tight">{caregiver?.name}</h1>
                                    <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-white/10">
                                        <ShieldCheck size={12} strokeWidth={3} /> Verified
                                    </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-sm text-teal-50 mb-5 font-medium">
                                    <span className="flex items-center gap-1.5"><MapPin size={16} /> {caregiver?.location}</span>
                                    {/* <span className="flex items-center gap-1.5"><Clock size={16} /> {caregiver?.experience}</span> */}
                                    {/* <span className="flex items-center gap-1.5 font-bold text-amber-300"><Star size={16} fill="currentColor" /> {caregiver?.rating} ({caregiver?.reviews})</span> */}
                                </div>
                                <div className="flex gap-2">
                                    {/* {caregiver?.petsHandled.map(pet => (
                                        <span key={pet} className="bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                            {petIcons[pet.toLowerCase()]} {pet}
                                        </span>
                                    ))} */}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl w-full md:w-80 shadow-2xl shadow-teal-900/20 mt-4 md:mt-0 border border-white/20">
                            <div className="text-center mb-6">
                                <div className="text-4xl font-black text-white">${caregiver?.dailyRate}</div>
                                <div className="text-teal-100 text-xs font-bold uppercase tracking-widest mt-1">per day</div>
                            </div>
                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => setIsBookingModalOpen(true)}
                                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-xs py-4 px-4 rounded-2xl transition-all shadow-lg shadow-orange-500/30 flex justify-center items-center gap-2 active:scale-95"
                                >
                                    <Calendar size={16} /> Book Now
                                </button>
                                <a 
                                    href="/owner/messages"
                                    className="w-full bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest text-xs py-4 px-4 rounded-2xl transition-all border border-white/20 flex justify-center items-center gap-2 active:scale-95"
                                >
                                    <MessageCircle size={16} /> Message
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* TABS NAVIGATION */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2 no-scrollbar">
                    {['About', 'Reviews', 'Services'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border shadow-sm shrink-0 ${activeTab === tab ? 'bg-white text-teal-600 border-teal-100 ring-2 ring-teal-500/5' : 'bg-slate-100/50 text-slate-400 hover:bg-slate-100 border-transparent'}`}>
                            {/* {tab === 'Reviews' ? `Reviews (${caregiver?.reviews})` : tab} */}
                        </button>
                    ))}
                </div>

                <div className="space-y-6">
                    {/* ABOUT TAB */}
                    {activeTab === 'About' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                                <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Biography</h2>
                                <p className="text-slate-600 leading-relaxed font-medium">{caregiver?.biography}</p>
                            </div>
                            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                                <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Dog Sizes Handled</h2>
                                <div className="flex flex-wrap gap-3">
                                    {/* {caregiver?.sizesHandled.map(size => (
                                        <span key={size} className="px-5 py-2.5 bg-slate-50 text-slate-700 rounded-2xl text-sm font-bold border border-slate-100 transition-colors">{size}</span>
                                    ))} */}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* REVIEWS TAB */}
                    {activeTab === 'Reviews' && (
                        <div className="space-y-4 animate-in fade-in duration-300">
                            {demoReviews.map(review => (
                                <div key={review.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="font-black text-slate-900">{review.user}</h4>
                                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{review.date}</p>
                                        </div>
                                        <div className="flex gap-0.5 text-amber-400">
                                            {[...Array(review.rating)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                                        </div>
                                    </div>
                                    <p className="text-slate-600 text-sm leading-relaxed font-medium">"{review.text}"</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* SERVICES TAB */}
                    {activeTab === 'Services' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
                            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                                <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><Home size={16} className="text-teal-500" /> Amenities</h2>
                                <div className="grid grid-cols-1 gap-4">
                                    {serviceDetails.amenities.map(item => (
                                        <div key={item} className="flex items-center gap-3 text-slate-700 font-bold text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            <CheckCircle2 size={18} className="text-teal-500" /> {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                                <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><Ban size={16} className="text-red-500" /> House Rules</h2>
                                <div className="grid grid-cols-1 gap-4">
                                    {serviceDetails.houseRules.map(rule => (
                                        <div key={rule} className="flex items-center gap-3 text-slate-700 font-bold text-sm bg-red-50/30 p-3 rounded-xl border border-red-100/50">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-400" /> {rule}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODALS */}
            {isBookingModalOpen && caregiver &&(
                <BookingModal caregiverName={caregiver.name} caregiverId={caregiverId} pets={pets} onClose={() => setIsBookingModalOpen(false)} />
            )}
        </div>
    );
}
