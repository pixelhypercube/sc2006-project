"use client"
import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { 
  User, 
  ShieldCheck, 
  MapPin, 
  Star, 
  Dog, 
  Cat, 
  Calendar,
  MessageSquareOff,
  Settings,
  ChevronLeft,
  Footprints,
  Home,
  CheckCircle2,
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
  Scissors,
  Bird,
  Turtle,
  Rabbit,
  Fish
} from "lucide-react";

const handledSizes = ["Small (0-5kg)", "Medium (5-20kg)", "Large (20kg+)"];

const serviceDetails = [
    // 1. CORE BOARDING & CARE (TIMED)
    {
        name: "Pet Boarding",
        category: "Core Care",
        description: "Your pet stays overnight in my home and is treated like family.",
        icon: <Home size={18} className="text-teal-500"/>
    },
    {
        name: "House Sitting",
        category: "Core Care",
        description: "I'll stay overnight in your home to watch over your pets and property.",
        icon: <CheckCircle2 size={18} className="text-teal-500"/>
    },
    {
        name: "Drop-in Visits",
        category: "Core Care",
        description: "30 or 60-minute visits to feed, play, and give potty breaks.",
        icon: <Coffee size={18} className="text-teal-500"/>
    },
    {
        name: "Doggie Daycare",
        category: "Core Care",
        description: "Daytime care in my home, usually from 8 AM to 6 PM.",
        icon: <Sun size={18} className="text-teal-500"/>
    },
    {
        name: "Dog Walking",
        category: "Core Care",
        description: "A 30-60 minute personalized walk around the neighborhood.",
        icon: <Footprints size={18} className="text-teal-500"/>
    },

    // 2. WELLNESS & MAINTENANCE (TASK-BASED)
    {
        name: "Bathing & Brushing",
        category: "Wellness",
        description: "A relaxing bath and thorough brushing to keep coats shiny.",
        icon: <ShowerHead size={18} className="text-teal-500"/>
    },
    {
        name: "Nail Trimming",
        category: "Wellness",
        description: "Safe and quick clipping or grinding of pet nails.",
        icon: <Scissors size={18} className="text-teal-500"/>
    },
    {
        name: "Ear Cleaning",
        category: "Wellness",
        description: "Gentle cleaning to prevent infections, especially for floppy ears.",
        icon: <Wind size={18} className="text-teal-500"/>
    },
    {
        name: "Teeth Brushing",
        category: "Wellness",
        description: "Daily dental hygiene to maintain fresh breath and healthy gums.",
        icon: <Sparkles size={18} className="text-teal-500"/>
    },
    {
        name: "De-shedding Treatment",
        category: "Wellness",
        description: "Heavy brushing and treatment to minimize shedding at home.",
        icon: <Zap size={18} className="text-teal-500"/>
    },

    // 3. TRAINING & EDUCATION
    {
        name: "Puppy Training",
        category: "Training",
        description: "Early socialization and essential potty training foundations.",
        icon: <GraduationCap size={18} className="text-teal-500"/>
    },
    {
        name: "Obedience Training",
        category: "Training",
        description: "Mastering commands like sit, stay, heel, and recall.",
        icon: <Target size={18} className="text-teal-500"/>
    },
    {
        name: "Behavioral Consultation",
        category: "Training",
        description: "Addressing leash pulling, anxiety, or specific behavioral issues.",
        icon: <Brain size={18} className="text-teal-500"/>
    },
    {
        name: "Agility Training",
        category: "Training",
        description: "Guided exercise through tunnels, jumps, and weave poles.",
        icon: <Trophy size={18} className="text-teal-500"/>
    },

    // 4. MEDICAL & SPECIALIZED CARE
    {
        name: "Oral Medication",
        category: "Medical",
        description: "Experienced administration of pills, tablets, or liquid medicine.",
        icon: <Pill size={18} className="text-teal-500"/>
    },
    {
        name: "Injection Administration",
        category: "Medical",
        description: "Safe administration of Insulin or other required injections.",
        icon: <Syringe size={18} className="text-teal-500"/>
    },
    {
        name: "Post-Surgery Recovery",
        category: "Medical",
        description: "Wound monitoring and ensuring restricted activity for healing.",
        icon: <HeartPulse size={18} className="text-teal-500"/>
    },
    {
        name: "Senior Pet Care",
        category: "Medical",
        description: "Extra patience and assistance for pets with mobility issues.",
        icon: <Hourglass size={18} className="text-teal-500"/>
    },
    {
        name: "Wound Care",
        category: "Medical",
        description: "Cleaning minor abrasions or changing bandages as instructed.",
        icon: <Thermometer size={18} className="text-teal-500"/>
    },

    // 5. LOGISTICS & EXTRAS
    {
        name: "Pet Taxi",
        category: "Logistics",
        description: "Safe transport to the vet, groomers, or other appointments.",
        icon: <Car size={18} className="text-teal-500"/>
    },
    {
        name: "Wedding Attendant",
        category: "Logistics",
        description: "Helping your pet be part of your special day without the stress.",
        icon: <PartyPopper size={18} className="text-teal-500"/>
    },
    {
        name: "Tank & Cage Cleaning",
        category: "Logistics",
        description: "Cleaning and maintenance for fish, reptiles, or small mammals.",
        icon: <Trash2 size={18} className="text-teal-500"/>
    }
];

// const demoReviews = [
//     { id: 1, user: "James Tan", rating: 5, date: "Feb 12, 2026", text: "Sarah was incredible with my poodle! She sent video updates every evening and followed the behavioral blueprint perfectly. Highly recommended!" },
//     { id: 2, user: "Emily Lim", rating: 5, date: "Jan 28, 2026", text: "Very professional and patient. My cat usually hides from strangers but was comfortable with Sarah within a day. Will book again." },
//     { id: 3, user: "Marcus Goh", rating: 4, date: "Jan 15, 2026", text: "Great experience. Clear communication and very clean environment. My dog came back happy and well-fed." }
// ];

const petsHandled = ["dogs", "cats"];

const petIcons: Record<string, React.ReactNode> = {
    "dogs": <Dog size={14} />,
    "cats": <Cat size={14} />,
    "birds": <Bird size={14} />,
    "reptiles": <Turtle size={14} />,
    "small mammals": <Rabbit size={14} />,
    "fish": <Fish size={14} />
}

const initialUser = {
    initials: "",
    email: "",
    name: "",
    phone: "",
    location: "",
    biography: "",
    dailyRate: 0,
};

export default function CaretakerProfile() {
    const [activeTab, setActiveTab] = useState("About");
    
    const reviews: any[] = []; // use 'any' type just in case
    const { user, loading } = useAuth();
        const [profileData, setProfileData] = useState(initialUser);
        useEffect(() => {
        if (user && !loading) {
            setProfileData({
            initials: user.name?.[0] || '',
            email: user.email || '',
            name: user.name || '',
            phone: user.phone || '',
            location: user.location || '',
            biography: user.biography || '',
            dailyRate: user.dailyRate || 0,
            });
        }
        }, [user, loading]);
    if (loading) return <div>Loading...</div>;
    return (
        <div className="min-h-screen bg-gray-50 font-sans pb-20">
            <Navbar />

            {/* HEADER */}
            <div className="bg-teal-600  pt-8 pb-12 px-6">
                <div className="max-w-5xl mx-auto flex justify-between items-center mb-8">
                    <Link href="/caregiver" className="text-teal-50 hover:text-white text-sm font-bold flex items-center gap-1 transition-colors">
                        <ChevronLeft size={16} /> Back to Console
                    </Link>
                    
                    <Link 
                        href="/caregiver/profile/edit" 
                        className="bg-white/20 hover:bg-white/30 text-white text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all flex items-center gap-2 border border-white/10 shadow-sm backdrop-blur-sm"
                    >
                        <Settings size={14} /> Edit Profile
                    </Link>
                </div>

                {/* HEADER */}
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-8 items-start justify-between">
                    <div className="flex gap-6 items-center">
                        <div className="w-32 h-32 rounded-2xl bg-white/20 border-4 border-white/20 flex items-center justify-center shadow-lg text-white/80">
                            <User size={48} strokeWidth={1.5} />
                        </div>
                        <div className="text-white">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold">{profileData.name}</h1>
                                <span className="bg-white/20 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest border border-white/10 flex items-center gap-1">
                                    <ShieldCheck size={12} strokeWidth={3} />
                                    <span className="leading-none pt-px">Verified</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-teal-50 mb-4">
                                <span className="flex items-center gap-1">
                                    <MapPin size={14} className="text-teal-200" />
                                    <span className="leading-none pt-px">{profileData.location || "Bukit Batok"}</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <Star size={14} className="text-yellow-300" fill="currentColor" />
                                    <span className="leading-none pt-px">
                                        {reviews.length > 0 ? `4.9 (${reviews.length} Reviews)` : "No ratings yet"}
                                    </span>
                                </span>
                            </div>
                            <div className="flex gap-2">
                                {petsHandled.map(pet => (
                                    <span key={pet} className="bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                        {petIcons[pet.toLowerCase()]} {pet}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* PRICING CARD */}
                    <div className="bg-white/10 backdrop-blur-md border border-white/10 p-6 rounded-2xl w-full md:w-72 shadow-xl">
                        <div className="text-center">
                            <p className="text-3xl font-black text-white">${profileData.dailyRate?.toFixed(2)}</p>
                            <p className="text-teal-100 text-xs font-medium">per day (Incl. platform fees)</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* BODY */}
            <div className="max-w-5xl mx-auto px-6 py-8">
                <div className="flex gap-2 mb-8">
                    {['About', `Reviews (${reviews.length})`, 'Services'].map(tab => {
                        const label = tab.split(' ')[0];
                        return (
                            <button 
                                key={tab}
                                onClick={() => setActiveTab(label)}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                                    activeTab === label 
                                    ? 'bg-white text-slate-900 border-slate-200 shadow-sm' 
                                    : 'bg-transparent text-slate-400 border-transparent hover:text-slate-600'
                                }`}
                            >
                                {tab}
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-6">
                    {/* ABOUT TAB */}
                    {activeTab === 'About' && (
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-left">Biography</h2>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {user?.biography || "No biography available."}
                            </p>
                        </div>
                    )}

                    {/* REVIEWS TAB */}
                    {activeTab === 'Reviews' && (
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-left">Reviews</h2>
                            {
                                reviews.length<=0 ?
                                (
                                    <div className="bg-white p-16 flex flex-col items-center text-center">
                                        <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-2xl flex items-center justify-center mb-4">
                                            <MessageSquareOff size={32} strokeWidth={1.5} />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">No Reviews yet</h3>
                                        <p className="text-sm text-slate-400 max-w-xs mt-1">
                                            You haven't received any reviews yet.
                                        </p>
                                    </div>
                                ) : 
                                (
                                    /* REVIEWS GRID CONTAINER */
                                    <div className="space-y-6">
                                        {/* REVIEWS CARDS */}
                                        {reviews.map(review => (
                                            <div key={review.id} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col h-full hover:border-teal-100 hover:shadow-md transition-all">
                                                <div className="flex justify-between items-start mb-6">
                                                    {/* User Info & Avatar */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-black text-sm border border-teal-100">
                                                            {review.user.charAt(0)} {/* Grabs the first letter of their name */}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-black text-slate-900 text-sm">{review.user}</h4>
                                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{review.date}</p>
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

                                                {/* Review Text */}
                                                <p className="text-slate-600 text-sm leading-relaxed font-medium flex-1 italic text-left">
                                                    "{review.text}"
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )
                            }
                        </div>
                    )}
                    {/* SERVICES TAB */}
                    {activeTab === 'Services' && (
                        <div className="animate-in fade-in slide-in-from-bottom-2 duration-400">
                            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                                <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                    Services Offered
                                </h2>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {serviceDetails.map((service) => (
                                        <div 
                                            key={service.name} 
                                            className="p-5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-4 hover:bg-white hover:border-teal-100 hover:shadow-md transition-all group"
                                        >
                                            {/* Icon Container */}
                                            <div className="p-3 bg-white rounded-xl shadow-sm group-hover:bg-teal-50 transition-colors">
                                                {service.icon}
                                            </div>
                                            
                                            {/* Service Text */}
                                            <div>
                                                <h3 className="text-slate-900 font-bold text-sm mb-1">
                                                    {service.name}
                                                </h3>
                                                <p className="text-slate-500 text-xs leading-relaxed font-medium">
                                                    {service.description}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}