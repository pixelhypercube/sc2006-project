"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Link from "next/link";
import Pagination from "../../components/Pagination";
import {
  AlertCircle,
  Play,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle,
  User,
  Calendar,
  X,
  ChevronLeft,
  ChevronDown,
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
  desc: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  attachmentName?: string | null;
  filed: string;
  datetime: Date;
  reporter: string;
  caretaker: string;
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

  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [priorityFilter, setPriorityFilter] = useState(searchParams.get("priority") || "all");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "PENDING");

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);

  const loadIncidents = async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const response = await fetch("/api/incidents", { credentials: "include" });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch incidents");
      }

      const records: IncidentRecord[] = (data.incidents ?? []).map((incident: any) => ({
        id: incident.id,
        bookingId: incident.bookingId,
        reporterId: incident.reporterId,
        caregiverId: incident.caregiverId,
        type: incident.type,
        title: incident.title,
        priority: incident.priority,
        status: incident.status,
        desc: incident.description,
        attachmentUrl: incident.attachmentUrl,
        attachmentType: incident.attachmentType,
        attachmentName: incident.attachmentName,
        filed: new Date(incident.filed).toLocaleDateString(),
        datetime: new Date(incident.filed),
        reporter: incident.reporter,
        caretaker: incident.caretaker,
      }));

      setIncidents(records);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Failed to fetch incidents");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
  }, []);

  useEffect(() => {
    if (incidents.length === 0) return;

    const searchVal = searchParams.get("search");
    if (searchVal) {
      const found = incidents.find((incident) => incident.id.toLowerCase() === searchVal.toLowerCase());
      if (found) {
        setSelectedIncident(found);
        return;
      }
    }

    setSelectedIncident(
      (current) => current ?? incidents.find((incident) => incident.priority === "HIGH" && incident.status === "PENDING") ?? incidents[0]
    );
  }, [incidents, searchParams]);

  const filteredIncidents = incidents
    .filter((incident) => {
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
    })
    .filter((incident) => {
      if (priorityFilter !== "all") {
        return incident.priority === priorityFilter;
      }
      return true;
    })
    .filter((incident) => {
      if (statusFilter !== "all") {
        return incident.status === statusFilter;
      }
      return true;
    });

  const totalItems = filteredIncidents.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const paginatedIncidents = filteredIncidents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "border-l-red-500";
      case "MEDIUM":
        return "border-l-orange-500";
      default:
        return "border-l-blue-400";
    }
  };

  const displayPriority = (priority: IncidentRecord["priority"]) =>
    priority.charAt(0) + priority.slice(1).toLowerCase();

  const displayStatus = (status: IncidentRecord["status"]) => status.replace(/_/g, " ");

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
      const response = await fetch("/api/incidents", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          incidentId: selectedIncident.id,
          status: resolutionStatus,
          resolutionNotes: resolutionNotes.trim() || undefined,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || "Failed to update incident");
      }

      await loadIncidents();
      setIsResolveOpen(false);
      setResolutionNotes("");
    } catch (error) {
      setResolutionError(error instanceof Error ? error.message : "Failed to update incident");
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
            <Link
              href="/admin"
              className="text-teal-600 hover:text-teal-700 text-sm font-black uppercase tracking-widest flex items-center gap-1 mb-4 transition-transform hover:-translate-x-1"
            >
              <ChevronLeft size={16} /> Back to Dashboard
            </Link>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              HR Incident Management
            </h1>
            <p className="text-base text-slate-500 mt-2 font-medium">
              Review and resolve reported incidents from the system.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center">
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

        <div className="text-md font-medium italic text-slate-400 ml-auto mb-2">
          {isLoading
            ? "Loading incidents..."
            : loadError
            ? loadError
            : `Showing ${filteredIncidents.length} of ${incidents.length} incident${incidents.length !== 1 ? "s" : ""}`}
        </div>

        <div className="space-y-4">
          {!isLoading && !loadError &&
            paginatedIncidents.map((incident) => (
              <div
                key={incident.id}
                className={`bg-white border-y border-r border-slate-200 border-l-4 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-8 transition-all hover:shadow-md ${getPriorityBorder(incident.priority)}`}
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-black text-slate-500 tracking-wider">Incident ID: {incident.id}</span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        incident.priority === "HIGH"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : incident.priority === "MEDIUM"
                          ? "bg-orange-50 text-orange-700 border-orange-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {incident.priority === "HIGH" && <AlertTriangle size={12} strokeWidth={3} />}
                      {displayPriority(incident.priority)} Priority
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        incident.status === "PENDING"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-100 text-slate-600 border-slate-200"
                      }`}
                    >
                      {incident.status === "PENDING" ? <Clock size={12} /> : <CheckCircle size={12} />}
                      {displayStatus(incident.status)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-1">{incident.title}</h3>
                    <p className="text-sm font-medium text-slate-600 line-clamp-3 leading-relaxed max-w-4xl">
                      {incident.desc}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2">
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <User size={14} className="text-slate-400" />
                      <span>
                        Reported by: <span className="font-semibold text-slate-900">{incident.reporter}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-600">
                      <User size={14} className="text-slate-400" />
                      <span>
                        Caretaker: <span className="font-semibold text-slate-900">{incident.caretaker}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-slate-500">
                      <Calendar size={14} className="text-slate-400" />
                      <span>
                        Filed: {incident.datetime.toLocaleDateString()} at {incident.datetime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col gap-3 min-w-40">
                  <button
                    onClick={() => {
                      setSelectedIncident(incident);
                      setIsEvidenceOpen(true);
                    }}
                    className="w-full px-6 py-2.5 border-2 border-slate-100 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95 whitespace-nowrap"
                  >
                    View Evidence
                  </button>
                  {incident.status === "PENDING" && (
                    <button
                      onClick={() => handleOpenResolve(incident, "RESOLVED")}
                      className="w-full px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-all shadow-md active:scale-95 whitespace-nowrap"
                    >
                      Resolve Incident
                    </button>
                  )}
                </div>
              </div>
            ))}

          {!isLoading && !loadError && paginatedIncidents.length === 0 && (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-bold text-slate-900 mb-1">No incidents found</h3>
              <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
            </div>
          )}
        </div>

        {totalItems > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            totalItems={totalItems}
            startItem={startItem}
            endItem={endItem}
          />
        )}
      </main>

      {isEvidenceOpen && selectedIncident && (
        <div className="fixed inset-0 bg-black/50 z-100 flex items-center justify-center p-4 md:p-6" onClick={() => setIsEvidenceOpen(false)}>
          <div
            className="bg-white rounded-3xl w-full max-w-220 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col p-6 md:p-8 gap-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="font-bold text-slate-900 text-2xl mb-1">Evidence Review: {selectedIncident.id}</h2>
                <p className="text-lg font-medium italic text-slate-500">{selectedIncident.title}</p>
              </div>
              <button onClick={() => setIsEvidenceOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors p-1 -mr-2 -mt-2">
                <X size={24} strokeWidth={2} />
              </button>
            </div>

            <div className="flex flex-col md:flex-row gap-6 overflow-y-auto">
              <div className="w-full md:w-[55%] flex flex-col">
                {selectedIncident.attachmentUrl ? (
                  selectedIncident.attachmentType?.startsWith("video/") ? (
                    <div className="aspect-video w-full bg-slate-900 rounded-2xl overflow-hidden shadow-inner border border-slate-200">
                      <video src={selectedIncident.attachmentUrl} controls className="w-full h-full object-contain bg-black" />
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-slate-100 rounded-2xl overflow-hidden shadow-inner border border-slate-200">
                      <img
                        src={selectedIncident.attachmentUrl}
                        alt={selectedIncident.attachmentName || "Incident evidence"}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )
                ) : (
                  <div className="aspect-video w-full bg-slate-900 rounded-2xl flex items-center justify-center text-white relative overflow-hidden group shadow-inner">
                    <div className="w-16 h-16 flex items-center justify-center cursor-default drop-shadow-lg opacity-70">
                      <Play fill="currentColor" size={48} className="ml-2 text-white" />
                    </div>
                    <p className="absolute bottom-5 left-6 text-xs font-bold uppercase tracking-widest text-slate-300 drop-shadow-md">
                      No attachment uploaded
                    </p>
                  </div>
                )}
                {selectedIncident.attachmentUrl && (
                  <p className="mt-2 text-xs text-slate-500 font-medium truncate">
                    File: {selectedIncident.attachmentName || "Uploaded evidence"}
                  </p>
                )}
              </div>

              <div className="w-full md:w-[45%] flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">Reporter's Email</p>
                    <p className="text-sm font-bold text-slate-900 truncate" title={selectedIncident.reporter}>
                      {selectedIncident.reporter}
                    </p>
                  </div>
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Caretaker</p>
                    <p className="text-sm font-bold text-slate-900 truncate">{selectedIncident.caretaker}</p>
                  </div>
                  <div
                    className={`p-3.5 rounded-xl border ${
                      selectedIncident.priority === "HIGH"
                        ? "bg-orange-50 border-orange-200"
                        : selectedIncident.priority === "MEDIUM"
                        ? "bg-amber-50 border-amber-200"
                        : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <p
                      className={`text-[10px] font-black uppercase tracking-wider mb-1 ${
                        selectedIncident.priority === "HIGH"
                          ? "text-orange-600"
                          : selectedIncident.priority === "MEDIUM"
                          ? "text-amber-600"
                          : "text-blue-600"
                      }`}
                    >
                      Priority
                    </p>
                    <p className="text-sm font-bold text-slate-900">{selectedIncident.priority}</p>
                  </div>
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Filed Date & Time</p>
                    <p className="text-sm font-bold text-slate-900">{selectedIncident.datetime.toLocaleDateString()}</p>
                    <p className="text-xs font-medium text-slate-500">
                      {selectedIncident.datetime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex-1 flex flex-col max-h-47.5">
                  <div className="flex items-center gap-1.5 mb-2 shrink-0">
                    <AlertCircle size={14} className="text-slate-500" strokeWidth={2.5} />
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-500">Description</p>
                  </div>
                  <div className="overflow-y-auto pr-3 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full">
                    <p className="text-[14px] text-slate-600 leading-relaxed">{selectedIncident.desc}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={() => setIsEvidenceOpen(false)} className="px-8 py-3 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-colors shadow-sm">
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}

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
              {resolutionError && <p className="text-sm font-semibold text-red-600">{resolutionError}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => setResolutionStatus("DISMISSED")}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-colors ${
                    resolutionStatus === "DISMISSED"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Dismiss Case
                </button>
                <button
                  onClick={() => setResolutionStatus("RESOLVED")}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all shadow-lg ${
                    resolutionStatus === "RESOLVED"
                      ? "bg-red-600 text-white shadow-red-600/20"
                      : "bg-red-50 text-red-600 hover:bg-red-100 shadow-none"
                  }`}
                >
                  Suspend User
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
              <button onClick={() => setIsResolveOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">
                Cancel
              </button>
              <button
                onClick={handleSubmitResolution}
                disabled={isResolving}
                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 disabled:opacity-60 transition-all shadow-md"
              >
                {isResolving ? "Submitting..." : "Submit Resolution"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
