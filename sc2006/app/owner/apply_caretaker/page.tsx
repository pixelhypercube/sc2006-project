"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { 
    BadgeCheck, 
    Upload, 
    DollarSign, 
    MapPin, 
    Calendar,
    Clock,
    CheckCircle,
    AlertCircle,
    User,
    Briefcase,
    FileText,
    PawPrint,
    X
} from "lucide-react";
import CaregiverAvailabilityModal from "../../components/CaregiverAvailabilityModal";

const PET_TYPES = ["DOG", "CAT", "BIRD", "FISH", "REPTILE", "SMALL_ANIMAL"];

export default function ApplyCaretaker() {
    const router = useRouter();
    const { user, loading, refetchUser } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const [applicationStatus, setApplicationStatus] = useState<"PENDING" | "APPROVED" | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        biography: "",
        dailyRate: "",
        location: "",
        experienceYears: "",
        petPreferences: [] as string[],
        verificationDocs: [] as { name: string; content: string }[],
    });

    // Date range availability state
    const [dateRangeAvailability, setDateRangeAvailability] = useState<{
        startDate: Date;
        endDate: Date;
    } | null>(null);

    // Date picker state
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
    const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);

    useEffect(() => {
        if (!loading && user) {
            checkApplicationStatus();
        }
    }, [user, loading]);

    const checkApplicationStatus = async () => {
        try {
            const res = await fetch(`/api/caregivers/${user?.id}`);
            if (res.ok) {
                const data = await res.json();
                if (data.caregiver) {
                    setHasApplied(true);
                    setApplicationStatus(data.caregiver.verified ? "APPROVED" : "PENDING");
                    setFormData({
                        biography: data.caregiver.biography || "",
                        dailyRate: data.caregiver.dailyRate?.toString() || "",
                        location: data.caregiver.location || "",
                        experienceYears: data.caregiver.experienceYears?.toString() || "",
                        petPreferences: data.caregiver.petPreferences || [],
                        verificationDocs: data.caregiver.verificationDocs || [],
                    });
                }
            }
        } catch (err) {
            console.error("Error checking application status:", err);
        }
    };

    const handlePetPreferenceToggle = (petType: string) => {
        setFormData(prev => ({
            ...prev,
            petPreferences: prev.petPreferences.includes(petType)
                ? prev.petPreferences.filter(p => p !== petType)
                : [...prev.petPreferences, petType]
        }));
    };

    const addDateRangeAvailability = (start: Date, end: Date | null) => {
        if (!start || !end) return;
        
        setDateRangeAvailability({
            startDate: start,
            endDate: end
        });
        setShowDatePicker(false);
        setSelectedStartDate(start);
        setSelectedEndDate(end);
    };

    const removeDateRangeAvailability = () => {
        setDateRangeAvailability(null);
        setSelectedStartDate(null);
        setSelectedEndDate(null);
    };

    const handleFileUpload = (file: File) => {
        if (!file) return;
        
        // Convert file to base64 for storage
        const reader = new FileReader();
        reader.onload = (event) => {
            if (event.target?.result) {
                setFormData(prevFormData => ({
                    ...prevFormData,
                    verificationDocs: [...prevFormData.verificationDocs, { name: file.name, content: event.target!.result as string }]
                }));
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            // Validate required fields
            if (!formData.dailyRate) {
                throw new Error("Daily rate is required");
            }

            const payload = {
                biography: formData.biography || undefined,
                dailyRate: parseFloat(formData.dailyRate),
                location: formData.location || undefined,
                experienceYears: formData.experienceYears ? parseInt(formData.experienceYears) : undefined,
                petPreferences: formData.petPreferences,
                verificationDocs: formData.verificationDocs,
                availability: dateRangeAvailability ? [{
                    startDate: dateRangeAvailability.startDate,
                    endDate: dateRangeAvailability.endDate
                }] : []
            };

            const res = await fetch("/api/caregivers/apply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to submit application");
            }

            setSuccess(true);
            setHasApplied(true);
            setApplicationStatus("PENDING");
            
            // Refresh user data to update navbar
            await refetchUser();
            
            // Redirect after 3 seconds
            setTimeout(() => {
                router.push("/caregiver");
            }, 3000);

        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                    <p className="text-slate-400 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50">
                <Navbar />
                <div className="flex items-center justify-center h-[calc(100vh-64px)]">
                    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-12 shadow-lg max-w-md text-center">
                        <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-teal-100">
                            <CheckCircle size={40} className="text-teal-600" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-3">Application Submitted!</h2>
                        <p className="text-slate-600 font-medium mb-6">
                            Your caretaker application is now pending HR review. You'll be notified once approved.
                        </p>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            Redirecting to dashboard...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-24">
            <Navbar />
            
            <main className="max-w-4xl mx-auto pt-6 px-4 sm:pt-12 sm:px-6">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-3 mb-3">
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                            {hasApplied ? "Caretaker Application" : "Become a Caretaker"}
                        </h1>
                        {applicationStatus === "APPROVED" && (
                            <BadgeCheck size={32} className="text-teal-500" />
                        )}
                        {applicationStatus === "PENDING" && (
                            <Clock size={32} className="text-amber-500" />
                        )}
                    </div>
                    <p className="text-slate-500 text-base font-medium">
                        {hasApplied 
                            ? applicationStatus === "APPROVED" 
                                ? "Your application has been approved! You can now accept bookings."
                                : "Your application is pending HR approval. You can still accept bookings, but won't have the verified badge yet."
                            : "Join our network of trusted pet caretakers and start earning today."
                        }
                    </p>
                </div>

                {/* Status Banner */}
                {hasApplied && (
                    <div className={`mb-8 p-6 rounded-2xl border-2 flex items-center gap-4 ${
                        applicationStatus === "APPROVED" 
                            ? "bg-teal-50 border-teal-200" 
                            : "bg-amber-50 border-amber-200"
                    }`}>
                        {applicationStatus === "APPROVED" ? (
                            <>
                                <CheckCircle size={24} className="text-teal-600 shrink-0" />
                                <div>
                                    <p className="font-black text-teal-900 text-sm uppercase tracking-widest">Verified Caretaker</p>
                                    <p className="text-sm font-medium text-teal-700 mt-1">
                                        You have full access to all caretaker features and the verified badge.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <AlertCircle size={24} className="text-amber-600 shrink-0" />
                                <div>
                                    <p className="font-black text-amber-900 text-sm uppercase tracking-widest">Pending Verification</p>
                                    <p className="text-sm font-medium text-amber-700 mt-1">
                                        You can accept bookings now, but the verified badge will appear after HR approval.
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Application Form */}
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Personal Information */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                                <User size={20} className="text-teal-600" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900">Personal Information</h2>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2">
                                    Biography
                                </label>
                                <textarea
                                    rows={4}
                                    value={formData.biography}
                                    onChange={(e) => setFormData({...formData, biography: e.target.value})}
                                    placeholder="Tell pet owners about your experience, passion for animals, and what makes you a great caretaker..."
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-all resize-none sm:px-5 sm:py-3.5 sm:rounded-2xl"
                                    disabled={hasApplied}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                                <div>
                                    <label className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <MapPin size={12} className="text-teal-500" /> Location
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.location}
                                        onChange={(e) => setFormData({...formData, location: e.target.value})}
                                        placeholder="e.g., Central Singapore"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-all sm:px-5 sm:py-3.5 sm:rounded-2xl"
                                        disabled={hasApplied}
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Briefcase size={12} className="text-teal-500" /> Years of Experience
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.experienceYears}
                                        onChange={(e) => setFormData({...formData, experienceYears: e.target.value})}
                                        placeholder="0"
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-all sm:px-5 sm:py-3.5 sm:rounded-2xl"
                                        disabled={hasApplied}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <DollarSign size={12} className="text-teal-500" /> Daily Rate (SGD) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.dailyRate}
                                    onChange={(e) => setFormData({...formData, dailyRate: e.target.value})}
                                    placeholder="65.00"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-all sm:px-5 sm:py-3.5 sm:rounded-2xl"
                                    disabled={hasApplied}
                                />
                                <p className="text-xs font-medium text-slate-400 mt-2">
                                    Platform fee: 5% • You'll receive ${formData.dailyRate ? (parseFloat(formData.dailyRate) * 0.95).toFixed(2) : "0.00"} per day
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Pet Preferences */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                                <PawPrint size={20} className="text-teal-600" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900">Pet Preferences</h2>
                        </div>

                        <p className="text-sm font-medium text-slate-600 mb-4">
                            Select the types of pets you're comfortable caring for
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {PET_TYPES.map((petType) => (
                                <button
                                    key={petType}
                                    type="button"
                                    onClick={() => !hasApplied && handlePetPreferenceToggle(petType)}
                                    disabled={hasApplied}
                                    className={`p-4 rounded-xl border-2 text-sm font-black uppercase tracking-wider transition-all ${
                                        formData.petPreferences.includes(petType)
                                            ? "bg-teal-50 border-teal-500 text-teal-700"
                                            : "bg-slate-50 border-slate-100 text-slate-600 hover:border-slate-200"
                                    } ${hasApplied ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                                >
                                    {petType.replace("_", " ")}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* SIMPLE AVAILABILITY SECTION */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                                <Calendar size={20} className="text-teal-600" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900">Availability Schedule</h2>
                        </div>

                        <div className="flex flex-col gap-4">
                            <p className="text-sm font-medium text-slate-600">
                                Select the dates you are available to care for pets.
                            </p>
                            
                            {dateRangeAvailability ? (
                                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex gap-6 items-center">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">Start Date</p>
                                                <p className="font-bold text-slate-900">{dateRangeAvailability.startDate.toLocaleDateString()}</p>
                                            </div>
                                            <div className="w-8 h-px bg-slate-300 hidden sm:block"></div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase mb-1">End Date</p>
                                                <p className="font-bold text-slate-900">{dateRangeAvailability.endDate.toLocaleDateString()}</p>
                                            </div>
                                        </div>
                                        
                                        {!hasApplied && (
                                            <div className="flex gap-3">
                                                <button 
                                                    type="button" 
                                                    onClick={() => setShowDatePicker(true)} 
                                                    className="flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-3 bg-teal-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20"
                                                >
                                                    Change
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={removeDateRangeAvailability} 
                                                    className="flex-1 sm:flex-none px-4 py-2 sm:px-6 sm:py-3 bg-red-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                                                >
                                                    Clear
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => !hasApplied && setShowDatePicker(true)}
                                        disabled={hasApplied}
                                        className="px-8 py-4 bg-teal-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <Calendar size={18} />
                                        Select Dates
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upload Verification Document(s) */}
                    <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                                <FileText size={20} className="text-teal-600" />
                            </div>
                            <h2 className="text-xl font-black text-slate-900">Upload Verification Document(s)</h2>
                        </div>

                        <div className="space-y-4">
                            <p className="text-sm font-medium text-slate-600">
                                Upload a government-issued ID or certification (optional but recommended for faster approval)
                            </p>
                            <div 
                                className={`border-2 border-dashed rounded-2xl p-8 transition-all cursor-pointer ${
                                    formData.verificationDocs.length > 0 
                                        ? 'border-teal-300 bg-teal-50' 
                                        : 'border-slate-200 hover:border-teal-300'
                                }`}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.add('border-teal-400', 'bg-teal-50');
                                }}
                                onDragLeave={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('border-teal-400', 'bg-teal-50');
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('border-teal-400', 'bg-teal-50');
                                    const files = e.dataTransfer.files;
                                    if (files && files.length > 0) {
                                        Array.from(files).forEach(handleFileUpload);
                                    }
                                }}
                                onClick={() => {
                                    if (!hasApplied) {
                                        document.getElementById('verification-upload-input')?.click();
                                    }
                                }}
                            >
                                <div className="text-center">
                                    <Upload size={32} className={`mx-auto mb-3 ${formData.verificationDocs.length > 0 ? 'text-teal-600' : 'text-slate-300'}`} />
                                    <p className="text-sm font-bold text-slate-600 mb-2">
                                        {formData.verificationDocs.length > 0 ? 'Add More Documents' : 'Click to upload or drag and drop'}
                                    </p>
                                    <p className="text-xs font-medium text-slate-400">
                                        PDF, JPG, or PNG • Max 10MB
                                    </p>
                                </div>
                                
                                {/* Document List */}
                                {formData.verificationDocs.length > 0 && (
                                    <div className="mt-6 space-y-3">
                                        <div className="flex items-center justify-between text-xs font-medium text-slate-600 border-b border-slate-200 pb-2">
                                            <span>Selected Documents ({formData.verificationDocs.length})</span>
                                            <span className="text-teal-600 font-black uppercase tracking-widest">Ready to Upload</span>
                                        </div>
                                        <div className="space-y-2">
                                            {formData.verificationDocs.map((doc, index) => (
                                                <div key={index} className="flex items-center justify-between bg-white border border-slate-200 rounded-lg p-3 min-h-15">
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center shrink-0">
                                                            <FileText size={16} className="text-teal-600" />
                                                        </div>
                                                        <div className="text-left flex-1 min-w-0">
                                                            <div className="font-medium text-slate-900 text-sm truncate">{doc.name}</div>
                                                            <div className="text-xs text-slate-500 truncate">
                                                                {doc.content.substring(0, 50)}...
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {!hasApplied && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setFormData({
                                                                    ...formData,
                                                                    verificationDocs: formData.verificationDocs.filter((_, i) => i !== index)
                                                                });
                                                            }}
                                                            className="ml-3 text-red-500 hover:text-red-700 transition-colors shrink-0"
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                
                                <input
                                    id="verification-upload-input"
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png"
                                    multiple
                                    onChange={(e) => {
                                        const files = e.target.files;
                                        if (files && files.length > 0) {
                                            Array.from(files).forEach(handleFileUpload);
                                        }
                                    }}
                                    className="hidden"
                                    disabled={hasApplied}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 flex items-center gap-3">
                            <AlertCircle size={24} className="text-red-600 shrink-0" />
                            <p className="text-sm font-bold text-red-700">{error}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    {!hasApplied && (
                        <div className="flex flex-col sm:flex-row justify-end gap-4">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 border border-slate-200 bg-white rounded-xl sm:rounded-2xl text-sm font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full sm:w-auto px-6 py-3 sm:px-8 sm:py-4 bg-teal-600 text-white rounded-xl sm:rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <>Processing...</>
                                ) : (
                                    <>
                                        <CheckCircle size={18} />
                                        Submit Application
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </form>
            </main>

            {/* Availability Date Range Modal */}
            {showDatePicker && (
                <CaregiverAvailabilityModal
                    onClose={() => setShowDatePicker(false)}
                    onConfirm={(start: Date, end: Date | null) => {
                        addDateRangeAvailability(start, end);
                    }}
                    initialStartDate={selectedStartDate}
                    initialEndDate={selectedEndDate}
                />
            )}
        </div>
    );
}