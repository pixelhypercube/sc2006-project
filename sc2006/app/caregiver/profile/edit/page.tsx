"use client"
import { useEffect, useState } from "react";
import Navbar from "../../../components/Navbar";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { 
  ChevronLeft, 
  Save, 
  User, 
  MapPin, 
  DollarSign, 
  Clock, 
  Briefcase, 
  Dog, 
  Cat, 
  Bird, 
  ShieldCheck,
  Info
} from "lucide-react";

export default function EditCaregiverProfile() {
    const [isSaving, setIsSaving] = useState(false);
    const { user, loading } = useAuth();
    const [profileData, setProfileData] = useState({
        email: "",
        name: "",
        phone: "",
        location: "",
        biography: "",
        dailyRate: 0,
    });

    useEffect(() => {
        if (user && !loading) {
            setProfileData({
                email: user.email || '',
                name: user.name || '',
                phone: user.phone || '',
                location: user.location || '',
                biography: user.biography || '',
                dailyRate: user.dailyRate || 0,
            });
        }
    }, [user, loading]);


    const handleSave = async() => {
        try {
        setIsSaving(true);

        const res = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // to send cookies
            body: JSON.stringify({
            name: profileData.name,
            phone: profileData.phone,
            biography: profileData.biography,
            location: profileData.location,
            dailyRate: profileData.dailyRate,
            }),
        });

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to update profile');
        }

        const data = await res.json();

        // Update local state with server-confirmed values
        setProfileData(prev => ({
            ...prev,
            initials: data.user.name?.[0] || '',
            name: data.user.name || '',
            phone: data.user.phone || '',
        }));

        } catch (err: any) {
        console.error(err);
        } finally {
        setIsSaving(false);
        }

        //TODO: do the API tingy
        setTimeout(() => setIsSaving(false), 2000);
    };
    if (loading) return <div>Loading...</div>;

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            <Navbar />

            <main className="max-w-5xl mx-auto px-6 pt-10">
                {/* TOP NAVIGATION BAR */}
                <div className="flex justify-between items-center mb-8">
                    <Link href="/caregiver/profile" className="text-slate-500 hover:text-teal-600 text-sm font-bold flex items-center gap-1 transition-colors group">
                        <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> 
                        Back to Profile
                    </Link>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-teal-600 hover:bg-teal-700 text-white font-black uppercase tracking-widest text-xs px-8 py-3 rounded-xl transition-all shadow-lg shadow-teal-600/20 flex items-center gap-2 active:scale-95 disabled:opacity-50"
                    >
                        {isSaving ? "Saving..." : <><Save size={16} /> Save Changes</>}
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* LEFT COLUMN: PRIMARY SETTINGS */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* SECTION 1: STOREFRONT IDENTITY */}
                        <section className="bg-white rounded-4xl border border-slate-100 shadow-sm p-8">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                <User size={16} className="text-teal-600" /> Storefront Identity
                            </h2>
                            
                            <div className="flex flex-col md:flex-row gap-8 mb-8">
                                <div className="relative group">
                                    <div className="w-32 h-32 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-slate-200 transition-colors cursor-pointer">
                                        <User size={40} strokeWidth={1} />
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-slate-100">
                                        <Save size={14} className="text-teal-600" />
                                    </div>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Display Name</label>
                                        <input type="text" value={profileData.name} onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-600 transition-all font-medium" />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Service Location</label>
                                            <div className="relative">
                                                <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input type="text" value={profileData.location} onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))} className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-teal-600 font-medium" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Years of Experience</label>
                                            <div className="relative">
                                                <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input type="text" defaultValue="5+ Years" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-teal-600 font-medium" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Professional Biography (UC5 Trust Factor)</label>
                                <textarea 
                                    rows={5} 
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-teal-600 transition-all resize-none leading-relaxed"
                                    placeholder="Tell owners about your experience, certifications, and how you care for pets..."
                                    value={profileData.biography}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, biography: e.target.value }))}
                                />
                                <p className="text-sm text-slate-400 mt-2 flex items-center gap-1 italic">
                                    <Info size={12} /> This bio is visible to all pet owners during their search.
                                </p>
                            </div>
                        </section>

                        {/* SECTION 2: HANDLING CAPABILITIES (The custom checkboxes) */}
                        <section className="bg-white rounded-4xl border border-slate-100 shadow-sm p-8">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                <Briefcase size={16} className="text-teal-600" /> Handling Capabilities
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Pet Species</h4>
                                    <div className="space-y-3">
                                        {[
                                            { id: 'dogs', label: 'Dogs', icon: <Dog size={14} /> },
                                            { id: 'cats', label: 'Cats', icon: <Cat size={14} /> },
                                            { id: 'birds', label: 'Birds', icon: <Bird size={14} /> },
                                        ].map((item) => (
                                            <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                                                <input type="checkbox" className="peer" defaultChecked={item.id !== 'birds'} />
                                                <span className="text-sm font-bold text-slate-600 group-hover:text-teal-600 transition-colors flex items-center gap-2">
                                                    {item.icon} {item.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Dog Size Specialization</h4>
                                    <div className="space-y-3">
                                        {['Small (0-5kg)', 'Medium (5-20kg)', 'Large (20kg+)'].map((size) => (
                                            <label key={size} className="flex items-center gap-3 cursor-pointer group">
                                                <input type="checkbox" className="peer" defaultChecked={size !== 'Large (20kg+)'} />
                                                <span className="text-sm font-bold text-slate-600 group-hover:text-teal-600 transition-colors">
                                                    {size}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* RIGHT COLUMN: SERVICE ECONOMICS */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        <section className="bg-slate-900 rounded-4xl p-8 text-white shadow-xl">
                            <h2 className="text-xs font-black text-teal-400 uppercase tracking-[0.2em] mb-6">Service Economics</h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Your Daily Rate</label>
                                    <div className="relative">
                                        <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-500" />
                                        <input 
                                            type="number" 
                                            value={profileData.dailyRate}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-2xl font-black focus:outline-none focus:border-teal-500 transition-all"
                                        />
                                    </div>
                                    <p className="text-sm text-slate-500 mt-3">
                                        This includes the 5% platform fee. You will earn <span className="text-teal-400 font-bold">$61.75</span> per day.
                                    </p>
                                </div>

                                <div className="pt-6 border-t border-white/10">
                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <div>
                                            <p className="text-sm font-bold text-white">Accepting Requests</p>
                                            <p className="text-xs text-slate-40">Show profile in search results</p>
                                        </div>
                                        <input type="checkbox" defaultChecked className="sr-only peer" />
                                        <div className="w-12 h-6 bg-slate-700 rounded-full relative peer-checked:bg-teal-500 transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
                                    </label>
                                </div>
                            </div>
                        </section>

                        {/* TRUST BADGE STATUS */}
                        <section className="bg-white rounded-4xl border border-slate-100 p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase">Verification</h3>
                                    <p className="text-xs font-bold text-teal-600 uppercase tracking-widest">Status: Verified</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Your background check is active. To maintain your <strong>Verified Peer</strong> badge, ensure your contact information remains up to date.
                            </p>
                        </section>

                    </div>
                </div>
            </main>
        </div>
    );
}