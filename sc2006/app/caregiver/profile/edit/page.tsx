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
  Info,
  Turtle,
  Rabbit,
  Fish,
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
  CheckCircle2,
  Footprints,
  Home
} from "lucide-react";

const petOptions = [
    { id: 'dogs', label: 'Dogs', icon: <Dog size={14} /> },
    { id: 'cats', label: 'Cats', icon: <Cat size={14} /> },
    { id: 'birds', label: 'Birds', icon: <Bird size={14} /> },
    { id: 'reptiles', label: 'Reptiles', icon: <Turtle size={14} /> },
    { id: 'small_mammals', label: 'Small Mammals', icon: <Rabbit size={14} /> },
    { id: 'fish', label: 'Fish', icon: <Fish size={14} /> },
];

const dogSizeOptions = [
    { id: 'small', label: 'Small (0-5kg)' },
    { id: 'medium', label: 'Medium (5-20kg)' },
    { id: 'large', label: 'Large (20kg+)' },
];

const serviceOptions = [
    { id: 'boarding', label: 'Pet Boarding', category: 'Core Care', icon: <Home size={14} /> },
    { id: 'house_sitting', label: 'House Sitting', category: 'Core Care', icon: <CheckCircle2 size={14} /> },
    { id: 'drop_in', label: 'Drop-in Visits', category: 'Core Care', icon: <Coffee size={14} /> },
    { id: 'daycare', label: 'Doggie Daycare', category: 'Core Care', icon: <Sun size={14} /> },
    { id: 'walking', label: 'Dog Walking', category: 'Core Care', icon: <Footprints size={14} /> },
    { id: 'bathing', label: 'Bathing & Brushing', category: 'Wellness', icon: <ShowerHead size={14} /> },
    { id: 'nails', label: 'Nail Trimming', category: 'Wellness', icon: <Scissors size={14} /> },
    { id: 'ears', label: 'Ear Cleaning', category: 'Wellness', icon: <Wind size={14} /> },
    { id: 'teeth', label: 'Teeth Brushing', category: 'Wellness', icon: <Sparkles size={14} /> },
    { id: 'deshedding', label: 'De-shedding', category: 'Wellness', icon: <Zap size={14} /> },
    { id: 'training_puppy', label: 'Puppy Training', category: 'Training', icon: <GraduationCap size={14} /> },
    { id: 'training_obedience', label: 'Obedience', category: 'Training', icon: <Target size={14} /> },
    { id: 'training_behavior', label: 'Behavioral', category: 'Training', icon: <Brain size={14} /> },
    { id: 'training_agility', label: 'Agility', category: 'Training', icon: <Trophy size={14} /> },
    { id: 'med_oral', label: 'Oral Medication', category: 'Medical', icon: <Pill size={14} /> },
    { id: 'med_inject', label: 'Injections', category: 'Medical', icon: <Syringe size={14} /> },
    { id: 'med_recovery', label: 'Post-Surgery', category: 'Medical', icon: <HeartPulse size={14} /> },
    { id: 'med_senior', label: 'Senior Care', category: 'Medical', icon: <Hourglass size={14} /> },
    { id: 'med_wound', label: 'Wound Care', category: 'Medical', icon: <Thermometer size={14} /> },
    { id: 'taxi', label: 'Pet Taxi', category: 'Logistics', icon: <Car size={14} /> },
    { id: 'wedding', label: 'Wedding Attendant', category: 'Logistics', icon: <PartyPopper size={14} /> },
    { id: 'cleaning', label: 'Tank Cleaning', category: 'Logistics', icon: <Trash2 size={14} /> }
];

export default function EditCaregiverProfile() {
    const [isSaving, setIsSaving] = useState(false);
    const { user, loading } = useAuth();
    
    // Core profile data
    const [profileData, setProfileData] = useState({
        email: "",
        name: "",
        phone: "",
        location: "",
        biography: "",
        dailyRate: 0,
        experience: 0,
        isAcceptingRequests: true
    });

    // Capabilities and Assets
    const [selectedPets, setSelectedPets] = useState<string[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    const isDogSelected = selectedPets.includes('dogs');

    useEffect(() => {
        if (user && !loading) {
            setProfileData({
                email: user.email || '',
                name: user.name || '',
                phone: user.phone || '',
                location: user.location || '',
                biography: user.biography || '',
                dailyRate: user.dailyRate || 0,
                experience: (user as any).experience || 0,
                isAcceptingRequests: (user as any).isAcceptingRequests ?? true
            });

            if ((user as any).selectedPets) setSelectedPets((user as any).selectedPets);
            if ((user as any).selectedSizes) setSelectedSizes((user as any).selectedSizes);
            if ((user as any).selectedServices) setSelectedServices((user as any).selectedServices);
        }
    }, [user, loading]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
        }
    };

    const handleToggle = (id: string, list: string[], setList: any) => {
        if (list.includes(id)) {
            setList(list.filter(i => i !== id));
        } else {
            setList([...list, id]);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    name: profileData.name,
                    phone: profileData.phone,
                    biography: profileData.biography,
                    location: profileData.location,
                    dailyRate: profileData.dailyRate,
                    experience: profileData.experience,
                    isAcceptingRequests: profileData.isAcceptingRequests,
                    selectedPets,
                    selectedSizes: isDogSelected ? selectedSizes : [],
                    selectedServices
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || 'Failed to update profile');
            }

            const data = await res.json();
            setProfileData(prev => ({
                ...prev,
                name: data.user.name || prev.name,
                phone: data.user.phone || prev.phone,
                biography: data.user.biography || prev.biography,
            }));
            
            // Temporary visual feedback
            alert("Profile saved successfully!");

        } catch (err: any) {
            console.error(err);
            alert("Error saving profile: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center font-bold">Loading Profile...</div>;

    const earningsPreview = (Number(profileData.dailyRate) * 0.95).toFixed(2);

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            <Navbar />

            <main className="max-w-5xl mx-auto px-6 pt-10">
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
                    <div className="lg:col-span-2 space-y-6">
                        {/* IDENTITY SECTION */}
                        <section className="bg-white rounded-4xl border border-slate-100 shadow-sm p-8">
                            <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                <User size={16} className="text-teal-600" /> Storefront Identity
                            </h2>
                            
                            <div className="flex flex-col md:flex-row gap-8 mb-8">
                                <label className="relative group cursor-pointer block">
                                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Edit Photo</label>
                                    <div className="w-32 h-32 rounded-3xl bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-slate-200 transition-colors overflow-hidden">
                                        {avatarPreview ? (
                                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={40} strokeWidth={1} />
                                        )}
                                    </div>
                                </label>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Display Name</label>
                                        <input 
                                            type="text" 
                                            value={profileData.name} 
                                            onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))} 
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/10 focus:border-teal-600 transition-all font-medium" 
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Service Location</label>
                                            <div className="relative">
                                                <MapPin size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input 
                                                    type="text" 
                                                    value={profileData.location} 
                                                    onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))} 
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-teal-600 font-medium" 
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Years of Experience</label>
                                            <div className="relative">
                                                <Clock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input 
                                                    type="number" 
                                                    value={profileData.experience} 
                                                    onChange={(e) => setProfileData(prev => ({ ...prev, experience: parseInt(e.target.value) || 0 }))} 
                                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-teal-600 font-medium" 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Biography</label>
                                <textarea 
                                    rows={5} 
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:border-teal-600 transition-all resize-none leading-relaxed"
                                    placeholder="Tell owners about your experience..."
                                    value={profileData.biography}
                                    onChange={(e) => setProfileData(prev => ({ ...prev, biography: e.target.value }))}
                                />
                                <p className="text-sm text-slate-400 mt-2 flex items-center gap-1 italic">
                                    <Info size={12} /> This bio is visible to all pet owners during their search.
                                </p>
                            </div>
                        </section>

                        {/* CAPABILITIES SECTION */}
                        <section className="bg-white rounded-4xl border border-slate-100 shadow-sm p-8">
                            <h2 className="text-md font-black text-slate-400 uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
                                <Briefcase size={16} className="text-teal-600" /> Handling Capabilities
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div>
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Pet Species</h4>
                                    <div className="space-y-3">
                                        {petOptions.map((item) => (
                                            <label key={item.id} className="flex items-center gap-3 cursor-pointer group">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedPets.includes(item.id)}
                                                    onChange={() => handleToggle(item.id, selectedPets, setSelectedPets)}
                                                    className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" 
                                                />
                                                <span className={`text-sm font-bold transition-colors flex items-center gap-2 ${selectedPets.includes(item.id) ? 'text-teal-600' : 'text-slate-600'}`}>
                                                    {item.icon} {item.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className={!isDogSelected ? "opacity-30 pointer-events-none" : ""}>
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">Dog Size Specialization</h4>
                                    <div className="space-y-3">
                                        {dogSizeOptions.map((size) => (
                                            <label key={size.id} className="flex items-center gap-3 cursor-pointer group">
                                                <input 
                                                    type="checkbox"
                                                    disabled={!isDogSelected}
                                                    checked={selectedSizes.includes(size.id)}
                                                    onChange={() => handleToggle(size.id, selectedSizes, setSelectedSizes)}
                                                    className="w-4 h-4 rounded border-slate-300 text-teal-600" 
                                                />
                                                <span className="text-sm font-bold text-slate-600">{size.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                <div className="md:col-span-2 mt-4 pt-10 border-t border-slate-100">
                                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Offered Services</h4>
                                    <div className="space-y-8">
                                        {['Core Care', 'Wellness', 'Training', 'Medical', 'Logistics'].map(category => (
                                            <div key={category}>
                                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">{category}</h5>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    {serviceOptions.filter(s => s.category === category).map((service) => {
                                                        const isSelected = selectedServices.includes(service.id);
                                                        return (
                                                            <label key={service.id} className={`flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all hover:-translate-y-0.5 ${isSelected ? 'border-teal-500 bg-teal-50/50 shadow-sm' : 'border-slate-200 bg-white hover:border-teal-300 hover:shadow-sm'}`}>
                                                                <input type="checkbox" className="hidden" checked={isSelected} onChange={() => handleToggle(service.id, selectedServices, setSelectedServices)} />
                                                                <div className={`p-2.5 rounded-xl shrink-0 transition-colors ${isSelected ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20' : 'bg-slate-100 text-slate-500'}`}>{service.icon}</div>
                                                                <span className={`text-sm font-bold leading-snug ${isSelected ? 'text-teal-950' : 'text-slate-700'}`}>{service.label}</span>
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* ECONOMICS SIDEBAR */}
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
                                            onChange={(e) => setProfileData(prev => ({ ...prev, dailyRate: parseFloat(e.target.value) || 0 }))}
                                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-2xl font-black focus:outline-none focus:border-teal-500 transition-all text-white"
                                        />
                                    </div>
                                    <p className="text-sm text-slate-500 mt-3">
                                        Earn <span className="text-teal-400 font-bold">${earningsPreview}</span> after fee.
                                    </p>
                                </div>
                                <div className="pt-6 border-t border-white/10">
                                    <label className="flex items-center justify-between cursor-pointer group">
                                        <div>
                                            <p className="text-sm font-bold text-white">Accepting Requests</p>
                                            <p className="text-xs text-slate-400">Show profile in results</p>
                                        </div>
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer"
                                            checked={profileData.isAcceptingRequests}
                                            onChange={(e) => setProfileData(prev => ({ ...prev, isAcceptingRequests: e.target.checked }))}
                                        />
                                        <div className="w-12 h-6 bg-slate-700 rounded-full relative peer-checked:bg-teal-500 transition-colors after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-6"></div>
                                    </label>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white rounded-4xl border border-slate-100 p-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-teal-50 text-teal-600 rounded-xl flex items-center justify-center">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase">Verification</h3>
                                    <p className="text-xs font-bold text-teal-600 uppercase tracking-widest">Verified Peer</p>
                                </div>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed text-xs">
                                To maintain your badge, ensure your information remains accurate.
                            </p>
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}