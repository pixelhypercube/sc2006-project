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
  ChevronLeft
} from "lucide-react";

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
    
    const reviews = []; 
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
            <div className="bg-teal-500 pt-8 pb-12 px-6">
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
                                    <span className="leading-none pt-px">Verified Caregiver</span>
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
                                        {reviews.length > 0 ? `4.9 (${reviews.length} reviews)` : "No ratings yet"}
                                    </span>
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <span className="bg-teal-600/50 px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1.5">
                                    <Dog size={12} /> Dogs
                                </span>
                                <span className="bg-teal-600/50 px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1.5">
                                    <Cat size={12} /> Cats
                                </span>
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
                    {activeTab === 'About' && (
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-4 tracking-tight">Professional Bio</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {user?.biography || "No biography available."}
                            </p>
                        </div>
                    )}

                    {activeTab === 'Reviews' && (
                        <div className="bg-white p-16 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-2xl flex items-center justify-center mb-4">
                                <MessageSquareOff size={32} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900">No reviews yet</h3>
                            <p className="text-sm text-slate-400 max-w-xs mt-1">
                                You haven't received any public feedback yet.
                            </p>
                        </div>
                    )}

                    {activeTab === 'Services' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                                <h4 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-widest">Handling Capabilities</h4>
                                <div className="flex flex-wrap gap-2">
                                    {['Small (0-5kg)', 'Medium (5-20kg)', 'Oral Medication'].map(s => (
                                        <span key={s} className="px-3 py-1 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg border border-slate-100">
                                            {s}
                                        </span>
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