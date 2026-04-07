"use client"
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from 'next/navigation'; 
import Navbar from "../../../components/Navbar";
import BookingModal from "../BookingModal";
import { useUsers } from "@/hooks/useUsers";
import { usePets } from "@/hooks/usePets";
import { useAuth } from "@/hooks/useAuth";
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
    Ban,
    Footprints,
    Info,
    Briefcase,
    Trash2,
    PartyPopper,
    Car,
    Thermometer,
    Hourglass,
    HeartPulse,
    Syringe,
    Pill,
    Trophy,
    Brain,
    Target,
    GraduationCap,
    Zap,
    Sparkles,
    Wind,
    ShowerHead,
    Sun,
    Coffee,
    Scissors
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
    availabilityStartDate?: string | null;
    availabilityEndDate?: string | null;
    // sizesHandled: string[];
    avatar?: string;
    services?: string[];
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
    { id: 3, user: "Marcus Goh", rating: 4, date: "Jan 15, 2026", text: "Great experience. Clear communication and very clean environment. My dog came back happy and well-fed." }
];

const serviceDetails = [
    // 1. CORE BOARDING & CARE (TIMED)
    {
        id: "BOARDING",
        name: "Pet Boarding",
        category: "Core Care",
        description: "Your pet stays overnight in my home and is treated like family.",
        icon: <Home size={18} className="text-teal-500"/>
    },
    {
        id: "HOUSE_SITTING",
        name: "House Sitting",
        category: "Core Care",
        description: "I'll stay overnight in your home to watch over your pets and property.",
        icon: <CheckCircle2 size={18} className="text-teal-500"/>
    },
    {
        id: "DROP_IN",
        name: "Drop-in Visits",
        category: "Core Care",
        description: "30 or 60-minute visits to feed, play, and give potty breaks.",
        icon: <Coffee size={18} className="text-teal-500"/>
    },
    {
        id: "DAYCARE",
        name: "Doggie Daycare",
        category: "Core Care",
        description: "Daytime care in my home, usually from 8 AM to 6 PM.",
        icon: <Sun size={18} className="text-teal-500"/>
    },
    {
        id: "WALKING",
        name: "Dog Walking",
        category: "Core Care",
        description: "A 30-60 minute personalized walk around the neighborhood.",
        icon: <Footprints size={18} className="text-teal-500"/>
    },

    // 2. WELLNESS & MAINTENANCE (TASK-BASED)
    {
        id: "BATHING",
        name: "Bathing & Brushing",
        category: "Wellness",
        description: "A relaxing bath and thorough brushing to keep coats shiny.",
        icon: <ShowerHead size={18} className="text-teal-500"/>
    },
    {
        id: "NAILS",
        name: "Nail Trimming",
        category: "Wellness",
        description: "Safe and quick clipping or grinding of pet nails.",
        icon: <Scissors size={18} className="text-teal-500"/>
    },
    {
        id: "EARS",
        name: "Ear Cleaning",
        category: "Wellness",
        description: "Gentle cleaning to prevent infections, especially for floppy ears.",
        icon: <Wind size={18} className="text-teal-500"/>
    },
    {
        id: "TEETH",
        name: "Teeth Brushing",
        category: "Wellness",
        description: "Daily dental hygiene to maintain fresh breath and healthy gums.",
        icon: <Sparkles size={18} className="text-teal-500"/>
    },
    {
        id: "DESHEDDING",
        name: "De-shedding Treatment",
        category: "Wellness",
        description: "Heavy brushing and treatment to minimize shedding at home.",
        icon: <Zap size={18} className="text-teal-500"/>
    },

    // 3. TRAINING & EDUCATION
    {
        id: "TRAINING_PUPPY",
        name: "Puppy Training",
        category: "Training",
        description: "Early socialization and essential potty training foundations.",
        icon: <GraduationCap size={18} className="text-teal-500"/>
    },
    {
        id: "TRAINING_OBEDIENCE",
        name: "Obedience Training",
        category: "Training",
        description: "Mastering commands like sit, stay, heel, and recall.",
        icon: <Target size={18} className="text-teal-500"/>
    },
    {
        id: "TRAINING_BEHAVIOR",
        name: "Behavioral Consultation",
        category: "Training",
        description: "Addressing leash pulling, anxiety, or specific behavioral issues.",
        icon: <Brain size={18} className="text-teal-500"/>
    },
    {
        id: "TRAINING_AGILITY",
        name: "Agility Training",
        category: "Training",
        description: "Guided exercise through tunnels, jumps, and weave poles.",
        icon: <Trophy size={18} className="text-teal-500"/>
    },

    // 4. MEDICAL & SPECIALIZED CARE
    {
        id: "MED_ORAL",
        name: "Oral Medication",
        category: "Medical",
        description: "Experienced administration of pills, tablets, or liquid medicine.",
        icon: <Pill size={18} className="text-teal-500"/>
    },
    {
        id: "MED_INJECT",
        name: "Injection Administration",
        category: "Medical",
        description: "Safe administration of Insulin or other required injections.",
        icon: <Syringe size={18} className="text-teal-500"/>
    },
    {
        id: "MED_RECOVERY",
        name: "Post-Surgery Recovery",
        category: "Medical",
        description: "Wound monitoring and ensuring restricted activity for healing.",
        icon: <HeartPulse size={18} className="text-teal-500"/>
    },
    {
        id: "MED_SENIOR",
        name: "Senior Pet Care",
        category: "Medical",
        description: "Extra patience and assistance for pets with mobility issues.",
        icon: <Hourglass size={18} className="text-teal-500"/>
    },
    {
        id: "MED_WOUND",
        name: "Wound Care",
        category: "Medical",
        description: "Cleaning minor abrasions or changing bandages as instructed.",
        icon: <Thermometer size={18} className="text-teal-500"/>
    },

    // 5. LOGISTICS & EXTRAS
    {
        id: "TAXI",
        name: "Pet Taxi",
        category: "Logistics",
        description: "Safe transport to the vet, groomers, or other appointments.",
        icon: <Car size={18} className="text-teal-500"/>
    },
    {
        id: "WEDDING",
        name: "Wedding Attendant",
        category: "Logistics",
        description: "Helping your pet be part of your special day without the stress.",
        icon: <PartyPopper size={18} className="text-teal-500"/>
    },
    {
        id: "CLEANING",
        name: "Tank & Cage Cleaning",
        category: "Logistics",
        description: "Cleaning and maintenance for fish, reptiles, or small mammals.",
        icon: <Trash2 size={18} className="text-teal-500"/>
    }
];

// const serviceDetails = {
//     houseRules: ["No pets on the sofa", "Vaccination records required", "Must be tick/flea treated"],
//     amenities: ["Spacious Backyard", "Air-conditioned Room", "Nearby Pet Park", "24/7 Supervision"],
// };

export default function caregiverProfile() {
    const params = useParams();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("About");
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isMessaging, setIsMessaging] = useState(false);
    const caregiverId = params.id as string;
    const [caregiver, setCaregiver] = useState<caregiver | null>(null);
    const [loading, setLoading] = useState(true);
    const [reviews, setReviews] = useState<any[]>([]);
    const { fetchPets } = usePets();
    const [pets, setPets] = useState<Pet[]>([]);
    const { user } = useAuth();
    
    const { fetchCaregiver } = useUsers();
    const loadCaregiver = useCallback(async () => {
    if (!caregiverId) return;
    setLoading(true);
    try {
        const data = await fetchCaregiver(caregiverId);
        const petsData = await fetchPets();
        setPets(petsData);
        setCaregiver(data.caregiver);
        
        // Fetch reviews for this caregiver
        const reviewsRes = await fetch(`/api/reviews?caregiverId=${caregiverId}`);
        const reviewsData = await reviewsRes.json();
        setReviews(reviewsData.reviews || []);
    } catch (error) {
        console.error('Failed to load caregiver:', error);
    } finally {
        setLoading(false);
    }
    }, [caregiverId, fetchCaregiver]);

    useEffect(() => {
        loadCaregiver();
    }, []);

    async function handleMessageClick() {
        if (!user || isMessaging) return;
        setIsMessaging(true);
        try {
            // Fetch or create a chat via the API
            const res = await fetch(
                `/api/chats?ownerId=${user.id}&caregiverId=${caregiverId}`
            );
            const data = await res.json();

            if (data.chatId) {
                // Redirect to messages page with the chatId
                router.push(`/owner/messages?chatId=${data.chatId}`);
            } else {
                alert(data.error || 'Failed to start chat');
            }
        } catch (err) {
            console.error('Failed to start chat:', err);
            alert('Failed to start chat');
        } finally {
            setIsMessaging(false);
        }
    }

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
                            <div className="w-32 h-32 rounded-3xl bg-teal-500 border-4 border-white/20 shadow-xl overflow-hidden flex items-center justify-center shrink-0">
                                {caregiver?.avatar ? (
                                    <img src={caregiver.avatar} alt={caregiver?.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-white text-4xl font-black">{caregiver?.name?.[0]}</div>
                                )}
                            </div>
                            <div className="text-white">
                                <div className="flex items-center gap-3 mb-2">
                                    <h1 className="text-3xl font-black tracking-tight">{caregiver?.name}</h1>
                                    {caregiver?.verified && (
                                        <span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg flex items-center gap-1.5 border border-white/10">
                                            <ShieldCheck size={12} strokeWidth={3} /> Verified
                                        </span>
                                    )}
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
                                <button 
                                    onClick={handleMessageClick}
                                    disabled={isMessaging}
                                    className="w-full bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest text-xs py-4 px-4 rounded-2xl transition-all border border-white/20 flex justify-center items-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <MessageCircle size={16} /> {isMessaging ? "Starting Chat..." : "Message"}
                                </button>
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
                            {tab === 'Reviews' ? `${tab}` : tab}
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
                            {reviews.length === 0 ? (
                                <div className="bg-white p-16 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
                                    <Star size={32} className="text-slate-200 mb-4" strokeWidth={1.5} />
                                    <h3 className="text-lg font-bold text-slate-900">No Reviews yet</h3>
                                    <p className="text-sm text-slate-400 max-w-xs mt-1">
                                        No reviews have been left for this caregiver.
                                    </p>
                                </div>
                            ) : (
                                reviews.map(review => (
                                    <div key={review.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                                        <div className="flex justify-between items-start mb-4">
                                            {/* User Info & Avatar */}
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-black text-sm border border-teal-100">
                                                    {review.fromUser?.name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 text-sm">{review.fromUser?.name || 'Anonymous'}</h4>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                                        {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                    </p>
                                                </div>
                                            </div>
                                            {/* Stars */}
                                            <div className="flex gap-0.5 text-amber-400">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star 
                                                        key={i} 
                                                        size={14} 
                                                        fill={i < review.rating ? "currentColor" : "none"} 
                                                        className={i < review.rating ? "text-amber-400" : "text-slate-200"}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <p className="text-slate-600 text-sm leading-relaxed font-medium">"{review.comment || '—'}"</p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* SERVICES TAB */}
                    {activeTab === 'Services' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
                                <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                    Services Offered
                                </h2>
                                
                                {caregiver?.services && caregiver.services.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {serviceDetails
                                            .filter(service => caregiver.services?.includes(service.id))
                                            .map((service) => (
                                            <div 
                                                key={service.id} 
                                                className="group p-5 rounded-2xl bg-slate-50 border border-slate-100 hover:border-teal-200 hover:bg-white hover:shadow-md transition-all duration-300 flex items-start gap-4"
                                            >
                                                <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-teal-50 transition-colors">
                                                    {service.icon}
                                                </div>
                                                <div>
                                                    <h3 className="text-slate-900 font-black text-sm uppercase tracking-wide mb-1">
                                                        {service.name}
                                                    </h3>
                                                    <p className="text-slate-500 text-xs leading-relaxed font-medium">
                                                        {service.description}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <p className="text-slate-500 text-sm\">No services selected yet.</p>
                                    </div>
                                )}

                                {caregiver?.services && caregiver.services.length > 0 && (
                                    <p className="text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-8 flex items-center justify-center gap-2">
                                        <Info size={12} /> Prices for these services are customizable during booking
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                    {/* {activeTab === 'Services' && (
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
                    )} */}
                </div>
            </div>

            {/* MODALS */}
            {isBookingModalOpen && caregiver &&(
                <BookingModal
                    caregiverName={caregiver.name}
                    caregiverId={caregiverId}
                    dailyRate={caregiver.dailyRate}
                    pets={pets}
                    availabilityStartDate={caregiver.availabilityStartDate ?? null}
                    availabilityEndDate={caregiver.availabilityEndDate ?? null}
                    onClose={() => setIsBookingModalOpen(false)}
                />
            )}
        </div>
    );
}
