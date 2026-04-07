"use client"
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Link from "next/link";
import { 
  ChevronLeft, 
  ShieldCheck, 
  XCircle, 
  MapPin, 
  Search,
  SlidersHorizontal,
  CheckCircle,
  User,
  DollarSign,
  Car,
  Briefcase,
  FileText,
  ChevronDown,
  Loader
} from "lucide-react";
import { useToast } from "../../context/ToastContext";

interface CaregiverApplication {
  id: string;
  name: string;
  email: string;
  biography?: string;
  dailyRate: number;
  location?: string;
  experienceYears?: number;
  petPreferences?: string[];
  availabilityStartDate?: string;
  availabilityEndDate?: string;
  verificationDocs?: string[];
  avatar?: string;
  phone?: string;
  createdAt: string;
}

export default function VerifiedQueue() {
    const searchParams = useSearchParams();
    const { fireToast } = useToast();

    // Get initial values from URL params (reads once on load, does not update URL later)
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || "all");
    
    // Data states
    const [applications, setApplications] = useState<CaregiverApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Fetch pending applications on mount
    useEffect(() => {
      const fetchApplications = async () => {
        try {
          setLoading(true);
          setError(null);
          const response = await fetch('/api/admin/pending-applications');
          
          if (!response.ok) {
            throw new Error('Failed to fetch applications');
          }
          
          const data = await response.json();
          setApplications(data.applications || []);
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to load applications';
          setError(errorMsg);
          fireToast('danger', 'Error', errorMsg);
        } finally {
          setLoading(false);
        }
      };

      fetchApplications();
    }, [fireToast]);

    // Sort caretakers: by creation date (newest first)
    const sortedCaretakers = [...applications].sort((a, b) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Filter caretakers based on search and filters
    const filteredCaretakers = sortedCaretakers.filter(caretaker => {
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                caretaker.name.toLowerCase().includes(query) ||
                caretaker.email.toLowerCase().includes(query) ||
                (caretaker.location && caretaker.location.toLowerCase().includes(query)) ||
                (caretaker.petPreferences && caretaker.petPreferences.some(pet => pet.toLowerCase().includes(query)))
            );
        }
        return true;
    });

    // Helper for status badge styling
    const getStatusBadge = () => {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200">
                <ShieldCheck size={12} strokeWidth={3} />
                Pending
            </span>
        );
    };

    const handleAction = async (caregiverId: string, action: 'approve' | 'reject') => {
        try {
            setActionLoading(caregiverId);
            const response = await fetch('/api/admin/pending-applications', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, caregiverId }),
            });

            if (!response.ok) {
                throw new Error(`Failed to ${action} application`);
            }

            // Remove the application from the list
            setApplications(applications.filter(app => app.id !== caregiverId));
            
            const message = action === 'approve' ? 'Verified Badge Issued' : 'Request Rejected';
            const description = action === 'approve' ? 'Caregiver has been approved' : 'Caregiver application has been rejected';
            fireToast(action === 'approve' ? 'success' : 'danger', message, description);
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : `Failed to ${action} application`;
            fireToast('danger', 'Error', errorMsg);
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            <Navbar />

            <main className="max-w-6xl mx-auto px-8 py-12">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex-1">
                        <Link href="/admin" className="text-teal-600 hover:text-teal-700 text-sm font-black uppercase tracking-widest flex items-center gap-1 mb-4 transition-transform hover:-translate-x-1">
                            <ChevronLeft size={16} /> Back to Dashboard
                        </Link>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            Caregiver Verifications
                        </h1>
                        <p className="text-base text-slate-500 mt-2 font-medium">Review caregiver applications and manage verified status.</p>
                    </div>
                </div>

                {/* SEARCH AND FILTER CONTROLS */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                    <div className="flex flex-wrap gap-4 items-center">
                        {/* Search Field */}
                        <div className="relative flex-1 min-w-[250px]">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by name, email, location, or pets..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                            />
                        </div>
                    </div>
                    
                </div>

                {/* Results Count or Loading/Error State */}
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader size={24} className="text-teal-600 animate-spin" />
                        <span className="ml-3 text-slate-600 font-medium">Loading applications...</span>
                    </div>
                ) : error ? (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                        <p className="text-red-700 font-bold">{error}</p>
                    </div>
                ) : (
                    <>
                        <div className="text-md font-medium italic text-slate-400 ml-auto mb-2">
                            Showing {filteredCaretakers.length} of {applications.length} caregiver{applications.length !== 1 ? 's' : ''}
                        </div>

                <div className="space-y-4">
                    {filteredCaretakers.length > 0 ? filteredCaretakers.map((caretaker) => (
                        <div key={caretaker.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                            {/* Avatar */}
                            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-slate-100 flex-shrink-0">
                                <img
                                    src={caretaker.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${caretaker.name}`}
                                    alt={caretaker.name}
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Main Info */}
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h3 className="text-xl font-bold text-slate-900">{caretaker.name}</h3>
                                    {getStatusBadge()}
                                </div>
                                <p className="text-sm text-slate-500">{caretaker.email}</p>
                                {caretaker.phone && <p className="text-sm text-slate-500">{caretaker.phone}</p>}
                                
                                {/* Metadata Row */}
                                <div className="flex flex-wrap gap-4 mt-3">
                                    {caretaker.location && (
                                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                            <MapPin size={14} className="text-slate-400" />
                                            <span>{caretaker.location}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                        <DollarSign size={14} className="text-slate-400" />
                                        <span>${caretaker.dailyRate}/day</span>
                                    </div>
                                    {caretaker.experienceYears !== undefined && (
                                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                            <Briefcase size={14} className="text-slate-400" />
                                            <span>{caretaker.experienceYears} years</span>
                                        </div>
                                    )}
                                </div>

                                {/* Biography */}
                                {caretaker.biography && (
                                    <div className="mt-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
                                        <p className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <FileText size={12} className="text-slate-400" /> Biography
                                        </p>
                                        <p className="text-sm text-slate-600 leading-relaxed">{caretaker.biography}</p>
                                    </div>
                                )}

                                {/* Pets Tags */}
                                {caretaker.petPreferences && caretaker.petPreferences.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {caretaker.petPreferences.map((pet, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
                                                {pet}
                                            </span>
                                        ))}
                                    </div>
                                )}

                                {/* Documents and Availability */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                    {/* Documents */}
                                    {caretaker.verificationDocs && caretaker.verificationDocs.length > 0 && (
                                        <div>
                                            <p className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Documents</p>
                                            <div className="flex flex-wrap gap-2">
                                                {caretaker.verificationDocs.map((doc, idx) => (
                                                    <span key={idx} className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                                                        <FileText size={14} className="text-slate-400" />
                                                        {doc}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Availability */}
                                    {(caretaker.availabilityStartDate || caretaker.availabilityEndDate) && (
                                        <div>
                                            <p className="text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Availability</p>
                                            <div className="bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                                                <p className="text-sm font-medium text-slate-700">
                                                    {caretaker.availabilityStartDate && new Date(caretaker.availabilityStartDate).toLocaleDateString()} 
                                                    {caretaker.availabilityEndDate && ` - ${new Date(caretaker.availabilityEndDate).toLocaleDateString()}`}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-3 min-w-fit">
                                <button 
                                    onClick={() => handleAction(caretaker.id, 'approve')}
                                    disabled={actionLoading === caretaker.id}
                                    className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-teal-600/20 active:scale-95 flex items-center gap-2 disabled:cursor-not-allowed"
                                >
                                    {actionLoading === caretaker.id ? (
                                        <>
                                            <Loader size={16} className="animate-spin" /> Processing
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck size={16} /> Approve
                                        </>
                                    )}
                                </button>
                                <button 
                                    onClick={() => handleAction(caretaker.id, 'reject')}
                                    disabled={actionLoading === caretaker.id}
                                    className="px-6 py-2.5 border-2 border-slate-200 text-slate-500 hover:text-red-500 hover:border-red-200 text-sm font-bold rounded-xl transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    )) : (
                        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 py-16 text-center">
                            <div className="w-16 h-16 bg-slate-50 text-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <User size={32} />
                            </div>
                            {searchQuery ? (
                                <>
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">No Results Found</h3>
                                    <p className="text-slate-500 font-medium mt-2">No caregivers match your search for "{searchQuery}".</p>
                                </>
                            ) : (
                                <>
                                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">All Clear</h3>
                                    <p className="text-slate-500 font-medium mt-2">No pending caregiver applications at this time.</p>
                                </>
                            )}
                        </div>
                    )}
                </div>
                    </>
                )}
            </main>
        </div>
    );
}