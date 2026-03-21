"use client"
import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { 
    Upload, 
    Mail, 
    User, 
    Phone, 
    Clock, 
    Check, 
    ClipboardList,
    Settings,
    Save,
    X,
    AlertTriangle
} from "lucide-react";

// DUMMY DATA
const initialUser = {
    initials: "",
    email: "",
    name: "",
    phone: ""
};

export default function OwnerProfile() {
    const { user, loading } = useAuth();
    const [profileData, setProfileData] = useState(initialUser);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState("personal");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    
    useEffect(() => {
    if (user && !loading) {
        setProfileData({
        initials: user.name?.[0] || '',
        email: user.email || '',
        name: user.name || '',
        phone: user.phone || ''
        });
    }
    }, [user, loading]);

    const dataUser = {
        initials: user?.name?.[0],
        email: user?.email,
        name: user?.name,
        phone: user?.phone
    };
    
    
    // State to manage form data
    //const [profileData, setProfileData] = useState(dataUser);
    // console.log(dataUser)
    // console.log(profileData)
    const [reports, setReports] = useState([
        {
            id: 1,
            title: "dog malnourished",
            date: "Feb 20, 2026 6:50 PM",
            description: "she forgot to feed the dog",
            regarding: "Sarah Chen",
            status: "Pending Review"
        }
    ]); 

    const handleSave = async () => {
        try {
        setSaving(true);
        setError(null);

        const res = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // to send cookies
            body: JSON.stringify({
            name: profileData.name,
            phone: profileData.phone,
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

        setIsEditing(false);
        } catch (err: any) {
        console.error(err);
        setError(err.message || 'Something went wrong');
        } finally {
        setSaving(false);
        }
    };
    if (loading) return <div>Loading...</div>;
    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            <Navbar />
            
            <main className="max-w-4xl mx-auto pt-12 px-6 pb-20">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">My Profile</h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">Manage your account and incident reports</p>
                    </div>
                    
                    {activeTab === "personal" && (
                        <button 
                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all shadow-md active:scale-95 ${
                                isEditing 
                                ? "bg-teal-600 text-white shadow-teal-600/20 hover:bg-teal-700" 
                                : "bg-white text-slate-900 border border-slate-200 hover:bg-slate-50"
                            }`}
                        >
                            {isEditing ? <><Save size={16} /> Save Changes</> : <><Settings size={16} /> Edit Profile</>}
                        </button>
                    )}
                </div>

                {/* TAB SWITCHER */}
                <div className="flex gap-2 mb-8 bg-slate-200/50 p-1 rounded-xl w-fit border border-slate-200/50">
                    {["personal", "incidents"].map((tab) => (
                        <button 
                            key={tab}
                            onClick={() => { setActiveTab(tab); setIsEditing(false); }}
                            className={`px-6 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
                                activeTab === tab 
                                ? "bg-white shadow-sm text-slate-900" 
                                : "text-slate-400 hover:text-slate-600"
                            }`}
                        >
                            {tab === "personal" ? "Identity" : `Reports (${reports.length})`}
                        </button>
                    ))}
                </div>

                <div className="bg-white border border-slate-100 rounded-[2rem] p-10 shadow-sm">
                    
                    {/* PERSONAL INFO TAB */}
                    {activeTab === "personal" && (
                        <div className="space-y-10 animate-in fade-in duration-300">
                            <div className="flex items-center gap-8">
                                <div className="w-24 h-24 bg-teal-500 rounded-3xl flex items-center justify-center text-white text-4xl font-black shadow-lg shadow-teal-500/20">
                                    {profileData.initials}
                                </div>
                                <div className="space-y-2">
                                    <button className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors">
                                        <Upload size={14} /> Change Avatar
                                    </button>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">JPG or PNG • Max 2MB</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Mail size={12} className="text-teal-500" /> Email Address
                                    </label>
                                    <input 
                                        type="email" 
                                        disabled
                                        defaultValue={profileData.email}
                                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-slate-400 text-sm font-medium cursor-not-allowed focus:outline-none"
                                    />
                                    <p className="text-[10px] font-bold text-slate-400 italic">Account identifier cannot be changed</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <User size={12} className="text-teal-500" /> Full Name
                                    </label>
                                    <input 
                                        type="text" 
                                        disabled={!isEditing}
                                        value={profileData.name}
                                        onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                                        className={`w-full px-5 py-3.5 border rounded-2xl text-sm font-bold transition-all focus:outline-none ${
                                            isEditing 
                                            ? "border-teal-500 bg-white ring-4 ring-teal-500/5" 
                                            : "border-slate-100 bg-slate-50 text-slate-900"
                                        }`}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <Phone size={12} className="text-teal-500" /> Phone Number
                                    </label>
                                    <input 
                                        type="tel" 
                                        disabled={!isEditing}
                                        value={profileData.phone}
                                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                                        className={`w-full px-5 py-3.5 border rounded-2xl text-sm font-bold transition-all focus:outline-none ${
                                            isEditing 
                                            ? "border-teal-500 bg-white ring-4 ring-teal-500/5" 
                                            : "border-slate-100 bg-slate-50 text-slate-900"
                                        }`}
                                    />
                                </div>
                            </div>

                            {isEditing && (
                                <div className="pt-6 border-t border-slate-50 flex items-center gap-4">
                                    <button 
                                        onClick={() => { setIsEditing(false); setProfileData(initialUser); }}
                                        className="text-xs font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors flex items-center gap-2"
                                    >
                                        <X size={14} /> Discard Changes
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* INCIDENT REPORTS TAB */}
                    {activeTab === "incidents" && (
                        <div className="animate-in fade-in duration-300">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">My Incident Reports</h2>
                                    <p className="text-sm font-medium text-slate-500 mt-1">Track issues and safety concerns</p>
                                </div>
                                <button 
                                    onClick={() => setIsModalOpen(true)}
                                    className="bg-red-50 text-red-600 border border-red-100 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-colors flex items-center gap-2 active:scale-95"
                                >
                                    <AlertTriangle size={14} /> File Report
                                </button>
                            </div>

                            {reports.length > 0 ? (
                                <div className="space-y-4">
                                    {reports.map((report) => (
                                        <div key={report.id} className="border border-slate-100 rounded-3xl p-8 bg-slate-50 hover:bg-white transition-colors shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-black text-lg text-slate-900">{report.title}</h3>
                                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Filed {report.date}</p>
                                                </div>
                                                <span className="px-3 py-1.5 bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-wider rounded-xl border border-amber-200 flex items-center gap-1.5">
                                                    <Clock size={12} /> {report.status}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-700 mt-4 leading-relaxed">{report.description}</p>
                                            <p className="text-sm font-bold text-slate-500 mt-6 flex items-center gap-2">
                                                <User size={14} className="text-slate-400" /> Regarding: <span className="text-slate-900">{report.regarding}</span>
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                                    <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-4 border border-teal-100">
                                        <Check size={28} className="text-teal-500" />
                                    </div>
                                    <p className="text-lg font-black text-slate-900">No incident reports filed</p>
                                    <p className="text-sm font-medium text-slate-500 mt-1">Your care network is running smoothly.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {/* MODAL OVERLAY - INCIDENT REPORT */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col max-h-[90vh]">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white shrink-0">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">File an Incident</h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Dispute Resolution Form</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-8 space-y-6 overflow-y-auto">
                            <div>
                                <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Related Booking (Optional)</label>
                                <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-700 focus:outline-none focus:border-teal-500 focus:bg-white transition-all">
                                    <option>Select a booking</option>
                                    <option>Dawg - Feb 16 to Feb 19</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Caretaker Email</label>
                                <input type="email" placeholder="Caretaker's email" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-all" />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Title <span className="text-red-500">*</span></label>
                                <input type="text" placeholder="Brief description of the issue" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-all" />
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Description <span className="text-red-500">*</span></label>
                                <textarea rows={4} placeholder="Provide detailed information about the incident..." className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-all resize-none"></textarea>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Priority</label>
                                <select className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-700 focus:outline-none focus:border-teal-500 focus:bg-white transition-all">
                                    <option>High</option>
                                    <option>Medium</option>
                                    <option>Low</option>
                                </select>
                            </div>

                            <div className="bg-teal-50/50 border border-teal-100 rounded-2xl p-5 mt-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-teal-800 flex items-center gap-2 mb-2">
                                    <ClipboardList size={14} /> Workflow Process
                                </h4>
                                <p className="text-sm font-medium text-teal-700 leading-relaxed">
                                    Our HR team will review this report, check system audit logs, and contact you via email within 24-48 hours.
                                </p>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-50 flex justify-end gap-3 bg-white shrink-0">
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="px-6 py-3.5 border border-slate-200 bg-white rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="px-6 py-3.5 bg-red-600 rounded-xl text-xs font-black uppercase tracking-widest text-white hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 active:scale-95 flex items-center gap-2"
                            >
                                <AlertTriangle size={16} /> Submit Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}