"use client"
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Link from "next/link";
import { 
    AlertCircle, Play, Search, Filter, 
    AlertTriangle, Clock, CheckCircle, 
    User, Calendar, X, 
    ChevronLeft, ChevronDown
} from "lucide-react";

type IncidentRecord = {
    id: string;
    bookingId: string;
    reporterId: string;
    caregiverId: string;
    type: "SAFETY" | "UNRESPONSIVE" | "OTHER";
    title: string;
    priority: "LOW" | "MEDIUM" | "HIGH";
    status: "PENDING" | "UNDER_REVIEW" | "RESOLVED" | "DISMISSED";
    description: string;
    attachmentUrl?: string | null;
    attachmentType?: string | null;
    attachmentName?: string | null;
    filed: string;
    resolvedAt?: string | null;
    resolutionNotes?: string | null;
    reporter: string;
    caretaker: string;
    bookingPetName: string;
    bookingStartDate: string;
    bookingEndDate: string;
    resolvedBy?: string | null;
};

export default function AdminIncidents() {
    const searchParams = useSearchParams();
    
    const [isEvidenceOpen, setIsEvidenceOpen] = useState(false);
    const [isResolveOpen, setIsResolveOpen] = useState(false);
    const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [resolutionNotes, setResolutionNotes] = useState("");
    const [isResolving, setIsResolving] = useState(false);
    const [resolutionError, setResolutionError] = useState<string | null>(null);
    const [resolutionStatus, setResolutionStatus] = useState<"RESOLVED" | "DISMISSED">("RESOLVED");
    
    // Get initial values from URL params (reads once on load, does not update URL later)
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");
    const [priorityFilter, setPriorityFilter] = useState(searchParams.get('priority') || "all");
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || "PENDING");

    // Get incident ID from URL params if available on load
    const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);

    const loadIncidents = async () => {
        setIsLoading(true);
        setLoadError(null);

        try {
            const response = await fetch('/api/incidents', { credentials: 'include' });
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(data.error || 'Failed to fetch incidents');
            }

            const records: IncidentRecord[] = (data.incidents ?? []).map((incident: any) => ({
                ...incident,
                filed: new Date(incident.filed).toLocaleDateString(),
                priority: incident.priority as IncidentRecord['priority'],
                status: incident.status as IncidentRecord['status'],
                type: incident.type as IncidentRecord['type'],
            }));

            setIncidents(records);
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : 'Failed to fetch incidents');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadIncidents();
    }, []);

    useEffect(() => {
        if (incidents.length === 0) return;

        const searchVal = searchParams.get('search');
        if (searchVal) {
            const found = incidents.find((incident) => incident.id.toLowerCase() === searchVal.toLowerCase());
            if (found) {
                setSelectedIncident(found);
                return;
            }
        }

        setSelectedIncident((current) => current ?? incidents.find((incident) => incident.priority === 'HIGH' && incident.status === 'PENDING') ?? incidents[0]);
    }, [incidents, searchParams]);

    // Filter incidents based on search and filters
    const filteredIncidents = incidents.filter(incident => {
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                incident.id.toLowerCase().includes(query) ||
                incident.title.toLowerCase().includes(query) ||
                incident.reporter.toLowerCase().includes(query) ||
                incident.caretaker.toLowerCase().includes(query)
            );
        }
        return true;
    }).filter(incident => {
        // Priority filter
        if (priorityFilter !== "all") {
            return incident.priority === priorityFilter;
        }
        return true;
    }).filter(incident => {
        // Status filter
        if (statusFilter !== "all") {
            return incident.status === statusFilter;
        }
        return true;
    });

    // Helper for dynamic card borders
    const getPriorityBorder = (priority: string) => {
        switch(priority) {
            case "HIGH": return "border-l-red-500";
            case "MEDIUM": return "border-l-orange-500";
            default: return "border-l-blue-400";
        }
    };

    const displayPriority = (priority: IncidentRecord['priority']) => priority.charAt(0) + priority.slice(1).toLowerCase();
    const displayStatus = (status: IncidentRecord['status']) => status.replace(/_/g, ' ');

    const handleOpenResolve = (incident: IncidentRecord, status: "RESOLVED" | "DISMISSED" = "RESOLVED") => {
        setSelectedIncident(incident);
        setResolutionStatus(status);
        setResolutionNotes("");
        setResolutionError(null);
        setIsResolveOpen(true);
    };

    const handleSubmitResolution = async () => {
        if (!selectedIncident) return;

        setIsResolving(true);
        setResolutionError(null);

        try {
            const response = await fetch('/api/incidents', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    incidentId: selectedIncident.id,
                    status: resolutionStatus,
                    resolutionNotes: resolutionNotes.trim() || undefined,
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || 'Failed to update incident');
            }

            await loadIncidents();
            setIsResolveOpen(false);
            setResolutionNotes("");
        } catch (error) {
            setResolutionError(error instanceof Error ? error.message : 'Failed to update incident');
        } finally {
            setIsResolving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">
            <Navbar />

            <main className="max-w-6xl mx-auto py-12 px-6">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex-1">
                        <Link href="/admin" className="text-teal-600 hover:text-teal-700 text-sm font-black uppercase tracking-widest flex items-center gap-1 mb-4 transition-transform hover:-translate-x-1">
                            <ChevronLeft size={16} /> Back to Dashboard
                        </Link>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            HR Incidents Management
                        </h1>
                        <p className="text-base text-slate-500 mt-2 font-medium">Review and resolve reported incidents from the system.</p>
                    </div>
                </div>

                {/* SEARCH AND FILTER CONTROLS */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
                    <div className="flex flex-wrap gap-4 items-center">
                        {/* Search Field */}
                        <div className="relative flex-1 min-w-62.5">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search by ID, title, reporter, or caretaker..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                            />
                        </div>

                        {/* Priority Filter */}
                        <div className="flex items-center gap-2">
                            <Filter size={16} className="text-slate-400" />
                            <div className="relative">
                                <select
                                    value={priorityFilter}
                                    onChange={(e) => setPriorityFilter(e.target.value)}
                                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 appearance-none pr-10"
                                >
                                    <option value="all">All Priorities</option>
                                    <option value="HIGH">High</option>
                                    <option value="MEDIUM">Medium</option>
                                    <option value="LOW">Low</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <Filter size={16} className="text-slate-400" />
                            <div className="relative">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 appearance-none pr-10"
                                >
                                    <option value="all">All Status</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="UNDER_REVIEW">Under Review</option>
                                    <option value="RESOLVED">Resolved</option>
                                    <option value="DISMISSED">Dismissed</option>
                                </select>
                                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Results Count */}
                <div className="text-md font-medium italic text-slate-400 ml-auto mb-2">
                    {isLoading
                        ? 'Loading incidents...'
                        : loadError
                            ? loadError
                            : `Showing ${filteredIncidents.length} of ${incidents.length} incident${incidents.length !== 1 ? 's' : ''}`}
                </div>

                {/* INCIDENT LIST */}
                <div className="space-y-4">
                    {!isLoading && !loadError && filteredIncidents.map((incident) => (
                        <div 
                            key={incident.id}
                            className={`bg-white border-y border-r border-slate-200 border-l-4 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:shadow-md ${getPriorityBorder(incident.priority)}`}
                        >
                            <div className="space-y-3 flex-1">
                                {/* Top Row: ID & Badges */}
                                <div className="flex items-center gap-3">
                                    <span className="text-md font-bold text-slate-500">
                                        Incident ID: {incident.id}
                                    </span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${
                                        incident.priority === "HIGH" ? "bg-red-50 text-red-700 border-red-200" :
                                        incident.priority === "MEDIUM" ? "bg-orange-50 text-orange-700 border-orange-200" :
                                        "bg-blue-50 text-blue-700 border-blue-200"
                                    }`}>
                                        {incident.priority === "HIGH" && <AlertTriangle size={12} strokeWidth={3} />}
                                        {displayPriority(incident.priority)} Priority
                                    </span>
                                     <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase border ${
                                         incident.status === "PENDING" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-600 border-slate-200"
                                     }`}>
                                         {incident.status === "PENDING" ? <Clock size={12} /> : <CheckCircle size={12} />}
                                         {displayStatus(incident.status)}
                                     </span>
                                </div>
                                
                                {/* Main Title */}
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">{incident.title}</h3>
                                </div>

                                {/* Bottom Row: Metadata Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                        <User size={14} className="text-slate-400" />
                                        <span>Reported by: <span className="font-semibold">{incident.reporter}</span></span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                        <User size={14} className="text-slate-400" />
                                        <span>Caretaker: <span className="font-semibold">{incident.caretaker}</span></span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                                        <Calendar size={14} className="text-slate-400" />
                                        <span>Filed: {incident.filed}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Actions Column */}
                            <div className="flex flex-col sm:flex-row gap-3 min-w-fit">
                                <button 
                                    onClick={() => {
                                        setSelectedIncident(incident);
                                        setIsEvidenceOpen(true);
                                    }}
                                    className="px-6 py-2.5 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 whitespace-nowrap"
                                >
                                    View Evidence
                                </button>
                                {incident.status === "PENDING" && (
                                    <button 
                                        onClick={() => {
                                            handleOpenResolve(incident, 'RESOLVED');
                                        }}
                                        className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95 whitespace-nowrap"
                                    >
                                        Resolve Incident
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {!isLoading && !loadError && filteredIncidents.length === 0 && (
                        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                            <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-900 mb-1">No incidents found</h3>
                            <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
                        </div>
                    )}
                </div>
            </main>

            {/* MODAL: VIEW EVIDENCE */}
            {isEvidenceOpen && selectedIncident && (
                <div className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center p-4 md:p-6" onClick={() => setIsEvidenceOpen(false)}>
                    {/* Increased max-width from 640px to 880px to accommodate the two columns */}
                    <div className="bg-white rounded-3xl w-full max-w-220 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col p-6 md:p-8 gap-6" onClick={(e) => e.stopPropagation()}>
                        
                        {/* Header */}
                        <div className="flex justify-between items-start">
                            <div>
                                <h2 className="font-bold text-[#1e293b] text-2xl mb-1">Evidence Review: {selectedIncident.id}</h2>
                                <p className="text-lg font-medium italic text-[#64748b]">{selectedIncident.title}</p>
                            </div>
                            <button onClick={() => setIsEvidenceOpen(false)} className="text-[#94a3b8] hover:text-[#475569] transition-colors p-1 -mr-2 -mt-2">
                                <X size={24} strokeWidth={2} />
                            </button>
                        </div>

                        {/* Two-Column Content Area */}
                        <div className="flex flex-col md:flex-row gap-6">
                            
                            {/* Left Column: Video Area (Takes up ~55% of width on desktop) */}
                            <div className="w-full md:w-[55%] flex flex-col">
                                {selectedIncident.attachmentUrl ? (
                                    selectedIncident.attachmentType?.startsWith('video/') ? (
                                        <div className="aspect-video w-full bg-[#111827] rounded-2xl overflow-hidden shadow-inner border border-slate-200">
                                            <video
                                                src={selectedIncident.attachmentUrl}
                                                controls
                                                className="w-full h-full object-contain bg-black"
                                            />
                                        </div>
                                    ) : (
                                        <div className="aspect-video w-full bg-slate-100 rounded-2xl overflow-hidden shadow-inner border border-slate-200">
                                            <img
                                                src={selectedIncident.attachmentUrl}
                                                alt={selectedIncident.attachmentName || 'Incident evidence'}
                                                className="w-full h-full object-contain"
                                            />
                                        </div>
                                    )
                                ) : (
                                    <div className="aspect-video w-full bg-[#1a1c29] rounded-2xl flex items-center justify-center text-white relative overflow-hidden group shadow-inner">
                                        <div className="w-16 h-16 flex items-center justify-center cursor-default drop-shadow-lg opacity-70">
                                            <Play fill="currentColor" size={48} className="ml-2 text-white" />
                                        </div>
                                        <p className="absolute bottom-5 left-6 text-xs font-bold uppercase tracking-widest text-[#cbd5e1] drop-shadow-md">No attachment uploaded</p>
                                    </div>
                                )}
                                {selectedIncident.attachmentUrl && (
                                    <p className="mt-2 text-xs text-slate-500 font-medium truncate">
                                        File: {selectedIncident.attachmentName || 'Uploaded evidence'}
                                    </p>
                                )}
                            </div>

                            {/* Right Column: Details (Takes up ~45% of width on desktop) */}
                            <div className="w-full md:w-[45%] flex flex-col gap-4">
                                
                                {/* Metadata Grid - Kept as 2x2 for compactness in the column */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Reporter */}
                                    <div className="p-3.5 bg-[#f0fdf4] rounded-xl border border-[#a7f3d0]">
                                        <p className="text-[10px] font-black text-[#059669] uppercase tracking-wider mb-1">Reporter</p>
                                        <p className="text-sm font-bold text-[#0f172a] truncate">{selectedIncident.reporter}</p>
                                    </div>
                                    
                                    {/* Caretaker */}
                                    <div className="p-3.5 bg-white rounded-xl border border-[#e2e8f0]">
                                        <p className="text-[10px] font-black text-[#64748b] uppercase tracking-wider mb-1">Caretaker</p>
                                        <p className="text-sm font-bold text-[#0f172a] truncate">{selectedIncident.caretaker}</p>
                                    </div>
                                    
                                    {/* Priority */}
                                    <div className={`p-3.5 rounded-xl border ${
                                        selectedIncident.priority === "HIGH" ? "bg-[#fff7ed] border-[#fed7aa]" :
                                        selectedIncident.priority === "MEDIUM" ? "bg-[#fffbeb] border-[#fde68a]" :
                                        "bg-[#eff6ff] border-[#bfdbfe]"
                                    }`}>
                                        <p className={`text-[10px] font-black uppercase tracking-wider mb-1 ${
                                            selectedIncident.priority === "HIGH" ? "text-[#ea580c]" :
                                            selectedIncident.priority === "MEDIUM" ? "text-[#d97706]" :
                                            "text-[#2563eb]"
                                        }`}>Priority</p>
                                        <p className="text-sm font-bold text-[#0f172a]">{selectedIncident.priority}</p>
                                    </div>
                                    
                                    {/* Filed Date */}
                                    <div className="p-3.5 bg-white rounded-xl border border-[#e2e8f0]">
                                        <p className="text-[10px] font-black text-[#64748b] uppercase tracking-wider mb-1">Filed Date</p>
                                        <p className="text-sm font-bold text-[#0f172a]">{selectedIncident.filed}</p>
                                    </div>
                                </div>
                                
                                {/* Incident Description */}
                                <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0] flex-1">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <AlertCircle size={14} className="text-[#64748b]" strokeWidth={2.5} /> 
                                        <p className="text-[11px] font-black uppercase tracking-wider text-[#64748b]">Description</p>
                                    </div>
                                    <p className="text-[14px] text-[#475569] leading-relaxed">{selectedIncident.description}</p>
                                </div>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="flex justify-end pt-4 mt-2 border-t border-[#f1f5f9]">
                            <button onClick={() => setIsEvidenceOpen(false)} className="px-8 py-3 bg-[#0d9488] text-white rounded-xl text-sm font-bold hover:bg-[#0f766e] transition-colors shadow-sm">
                                Close Review
                            </button>
                        </div>
                        
                    </div>
                </div>
            )}

            {/* MODAL: RESOLVE CASE */}
            {isResolveOpen && selectedIncident && (
                <div className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center p-6" onClick={() => setIsResolveOpen(false)}>
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 bg-slate-50">
                            <h2 className="font-bold text-lg text-slate-900">Final Resolution</h2>
                            <p className="text-sm text-slate-500">Case ID: {selectedIncident.id}</p>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">Resolution Notes</label>
                                <textarea 
                                    placeholder="Enter findings and action taken..."
                                    value={resolutionNotes}
                                    onChange={(e) => setResolutionNotes(e.target.value)}
                                    className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
                                />
                            </div>
                            {resolutionError && (
                                <p className="text-sm font-semibold text-red-600">{resolutionError}</p>
                            )}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setResolutionStatus('DISMISSED')}
                                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${
                                        resolutionStatus === 'DISMISSED'
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    Dismiss Case
                                </button>
                                <button
                                    onClick={() => setResolutionStatus('RESOLVED')}
                                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all shadow-lg ${
                                        resolutionStatus === 'RESOLVED'
                                            ? 'bg-red-600 text-white shadow-red-600/20'
                                            : 'bg-red-50 text-red-600 hover:bg-red-100 shadow-none'
                                    }`}
                                >
                                    Suspend User
                                </button>
                            </div>
                        </div>
                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                            <button onClick={() => setIsResolveOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
                            <button
                                onClick={handleSubmitResolution}
                                disabled={isResolving}
                                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-60 transition-all shadow-md"
                            >
                                {isResolving ? 'Submitting...' : 'Submit Resolution'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}