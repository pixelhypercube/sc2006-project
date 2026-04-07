"use client"
import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Pagination from "../components/Pagination";
import { 
    PawPrint, CheckCircle, AlertTriangle, CircleDollarSign, 
    ArrowRight, UserCheck, Settings, MapPin, Star, 
    BadgeCheck, Check, Minus, Clock, ShieldAlert,
    Mail, UserX, Eye, Search, ChevronUp, ChevronDown, Loader
} from "lucide-react";

interface Caregiver {
    id: string;
    name: string;
    email?: string;
    biography?: string;
    dailyRate: number;
    location?: string;
    experienceYears?: number;
    verified: boolean;
    averageRating: number;
    totalReviews: number;
    completedBookings: number;
    petPreferences?: Array<"DOG" | "CAT" | "BIRD" | "REPTILE" | "FISH" | "SMALL_ANIMAL">;
    createdAt?: Date | string;
    user?: {
        avatar?: string;
    };
}

interface Transaction {
    id: string;
    bookingId: string;
    date: Date | string;
    pet: string;
    owner: string;
    ownerEmail: string;
    caretaker: string;
    startDate: Date | string;
    endDate: Date | string;
    baseAmount: number;
    fee: number;
    total: number;
    status: string;
    method: string;
}

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("caretakers");
    
    // Search and Filter States
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [locationFilter, setLocationFilter] = useState("all");
    type PetType = "DOG" | "CAT" | "BIRD" | "REPTILE" | "FISH" | "SMALL_ANIMAL";
    const [petTypeFilter, setPetTypeFilter] = useState<"all" | PetType>("all");
    const [sortBy, setSortBy] = useState("");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "none">("asc");
    
    // Transaction filters
    const [transactionSearch, setTransactionSearch] = useState("");
    const [transactionMethodFilter, setTransactionMethodFilter] = useState("all");
    const [transactionStatusFilter, setTransactionStatusFilter] = useState("all");
    const [transactionMinAmount, setTransactionMinAmount] = useState<number | undefined>(undefined);
    const [transactionMaxAmount, setTransactionMaxAmount] = useState<number | undefined>(undefined);
    const [transactionStartDate, setTransactionStartDate] = useState<Date | undefined>(undefined);
    const [transactionEndDate, setTransactionEndDate] = useState<Date | undefined>(undefined);
    const [transactionSortBy, setTransactionSortBy] = useState("");
    const [transactionSortOrder, setTransactionSortOrder] = useState<"asc" | "desc" | "none">("none");
    
    // Report filters
    const [reportSearch, setReportSearch] = useState("");
    const [reportPriorityFilter, setReportPriorityFilter] = useState("all");
    const [reportStatusFilter, setReportStatusFilter] = useState("all");
    const [reportStartDate, setReportStartDate] = useState<Date | undefined>(undefined);
    const [reportEndDate, setReportEndDate] = useState<Date | undefined>(undefined);
    const [reportSortBy, setReportSortBy] = useState("");
    const [reportSortOrder, setReportSortOrder] = useState<"asc" | "desc" | "none">("none");

    // Data states
    const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [incidents, setIncidents] = useState<any[]>([]);
    const [loadingCaregivers, setLoadingCaregivers] = useState(true);
    const [loadingTransactions, setLoadingTransactions] = useState(true);
    const [stats, setStats] = useState([
        { label: "Active Care Contracts", value: "0", icon: (<PawPrint size={24}/>), color: "text-blue-600" },
        { label: "Pending HR Incidents", value: "0", icon: (<AlertTriangle size={24}/>), color: "text-red-600" },
        { label: "Revenue (5% Fee)", value: "$0", icon: (<CircleDollarSign size={24}/>), color: "text-teal-600" },
        { label: "Verification Queue", value: "0", icon: (<CheckCircle size={24}/>), color: "text-purple-600" }
    ]);

    // Fetch caregivers and transactions data
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoadingCaregivers(true);
                setLoadingTransactions(true);
                
                let verifiedCaregivers: Caregiver[] = [];
                let activeContractsCount = 0;
                let pendingVerificationsCount = 0;
                let totalRevenue = 0;
                let pendingIncidentsCount = 0;

                // Fetch caregivers
                const cargiverResponse = await fetch('/api/caregivers');
                if (cargiverResponse.ok) {
                    const data = await cargiverResponse.json();
                    verifiedCaregivers = (data.caregivers || []).filter((c: Caregiver) => c.verified);
                    setCaregivers(verifiedCaregivers);
                }

                // Fetch active contracts
                const contractsResponse = await fetch('/api/admin/contracts');
                if (contractsResponse.ok) {
                    const contractsData = await contractsResponse.json();
                    activeContractsCount = contractsData.count || 0;
                }

                // Fetch pending verifications from the same source used by the verification queue page.
                const pendingApplicationsResponse = await fetch('/api/admin/pending-applications');
                if (pendingApplicationsResponse.ok) {
                    const pendingApplicationsData = await pendingApplicationsResponse.json();
                    const pendingApplications = Array.isArray(pendingApplicationsData.applications)
                        ? pendingApplicationsData.applications
                        : [];
                    pendingVerificationsCount = pendingApplications.length;
                }

                // Fetch transactions
                const txResponse = await fetch('/api/admin/transactions');
                if (txResponse.ok) {
                    const txData = await txResponse.json();
                    const txList = (txData.transactions || []) as Transaction[];
                    setTransactions(txList);

                    // Calculate total revenue (5% fees)
                    totalRevenue = txList.reduce((sum, tx) => sum + tx.fee, 0);
                }

                // Fetch incidents
                const incidentsResponse = await fetch('/api/incidents', { credentials: 'include' });
                if (incidentsResponse.ok) {
                    const incidentsData = await incidentsResponse.json();
                    const incidentsList = (incidentsData.incidents || []);
                    setIncidents(incidentsList);
                    pendingIncidentsCount = incidentsList.filter((inc: any) => inc.status === 'PENDING').length;
                }

                // Update all stats at once
                setStats(prev => [
                    { ...prev[0], value: activeContractsCount.toString() },
                    { ...prev[1], value: pendingIncidentsCount.toString() },
                    { ...prev[2], value: `$${totalRevenue.toFixed(2)}` },
                    { ...prev[3], value: pendingVerificationsCount.toString() }
                ]);
            } catch (error) {
                console.error('Failed to fetch data:', error);
            } finally {
                setLoadingCaregivers(false);
                setLoadingTransactions(false);
            }
        };

        fetchData();
    }, []);

    const reports = incidents.map((incident: any) => ({
        id: incident.id,
        reporter: incident.reporter || 'Unknown',
        title: incident.title || incident.description,
        desc: incident.description || '',
        caretaker: incident.caretaker || 'Unknown',
        priority: incident.priority === 'HIGH' ? 'High' : incident.priority === 'MEDIUM' ? 'Medium' : 'Low',
        status: incident.status === 'PENDING' ? 'Pending' : incident.status === 'UNDER_REVIEW' ? 'Under Review' : incident.status === 'RESOLVED' ? 'Resolved' : 'Dismissed',
        datetime: new Date(incident.filed || incident.createdAt || Date.now()),
        filed: new Date(incident.filed).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    }));
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Handle report resolution
    const handleReportResolution = (reportId: string) => {
        alert(`Report ${reportId} has been resolved and marked as completed.`);
    };

    // Handle column click for sorting (cycles: asc -> desc -> none)
    const handleCaretakerSort = (column: string) => {
        if (sortBy === column) {
            if (sortOrder === "asc") setSortOrder("desc");
            else if (sortOrder === "desc") {
                setSortOrder("none");
                setSortBy("");
            }
        } else {
            setSortBy(column);
            setSortOrder("asc");
        }
    };

    const handleTransactionSort = (column: string) => {
        if (transactionSortBy === column) {
            if (transactionSortOrder === "asc") setTransactionSortOrder("desc");
            else if (transactionSortOrder === "desc") {
                setTransactionSortOrder("none");
                setTransactionSortBy("");
            }
        } else {
            setTransactionSortBy(column);
            setTransactionSortOrder("asc");
        }
    };

    const handleReportSort = (column: string) => {
        if (reportSortBy === column) {
            if (reportSortOrder === "asc") setReportSortOrder("desc");
            else if (reportSortOrder === "desc") {
                setReportSortOrder("none");
                setReportSortBy("");
            }
        } else {
            setReportSortBy(column);
            setReportSortOrder("asc");
        }
    };

    // Sort icon helper
    const SortIcon = ({ column, currentSort, order }: { column: string; currentSort: string; order: "asc" | "desc" | "none" }) => {
        if (currentSort !== column) return <span className="w-4 h-4 inline-block mx-1 opacity-0">▲</span>;
        if (order === "asc") return <ChevronUp size={12} className="inline-block mx-1 text-teal-600" />;
        if (order === "desc") return <ChevronDown size={12} className="inline-block mx-1 text-teal-600" />;
        return null;
    };

    // Filter and sort transactions
    const filteredTransactions = transactions
        .filter((tx) => {
            if (transactionSearch) {
                const query = transactionSearch.toLowerCase();
                return (
                    tx.id.toLowerCase().includes(query) ||
                    tx.owner.toLowerCase().includes(query) ||
                    tx.caretaker.toLowerCase().includes(query) ||
                    tx.pet.toLowerCase().includes(query)
                );
            }
            return true;
        })
        .filter((tx) => {
            if (transactionMethodFilter !== "all") {
                return tx.method === transactionMethodFilter;
            }
            return true;
        })
        .filter((tx) => {
            if (transactionStatusFilter !== "all") {
                return tx.status === transactionStatusFilter;
            }
            return true;
        })
        .filter((tx) => {
            if (transactionMinAmount && transactionMinAmount > 0 && tx.total < transactionMinAmount) {
                return false;
            }
            if (transactionMaxAmount && transactionMaxAmount < 500 && tx.total > transactionMaxAmount) {
                return false;
            }
            return true;
        })
        .filter((tx) => {
            const txDate = new Date(tx.date);
            if (transactionStartDate && txDate < transactionStartDate) {
                return false;
            }
            if (transactionEndDate && txDate > transactionEndDate) {
                return false;
            }
            return true;
        })
        .sort((a, b) => {
            let comparison = 0;
            switch (transactionSortBy) {
                case "id":
                    comparison = a.id.localeCompare(b.id);
                    break;
                case "owner":
                    comparison = a.owner.localeCompare(b.owner);
                    break;
                case "amount":
                    comparison = a.total - b.total;
                    break;
                case "date":
                    comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
                    break;
                default:
                    comparison = new Date(b.date).getTime() - new Date(a.date).getTime();
                    break;
            }
            return transactionSortOrder === "asc" ? comparison : -comparison;
        });

    // Filter and sort reports
    const filteredReports = reports
        .filter((report) => {
            if (reportSearch) {
                const query = reportSearch.toLowerCase();
                return (
                    String(report.id).toLowerCase().includes(query) ||
                    report.reporter.toLowerCase().includes(query) ||
                    report.title.toLowerCase().includes(query) ||
                    report.caretaker.toLowerCase().includes(query)
                );
            }
            return true;
        })
        .filter((report) => {
            if (reportPriorityFilter !== "all") {
                return report.priority === reportPriorityFilter;
            }
            return true;
        })
        .filter((report) => {
            if (reportStatusFilter !== "all") {
                return report.status === reportStatusFilter;
            }
            return true;
        })
        .filter((report) => {
            if (reportStartDate && report.datetime < reportStartDate) {
                return false;
            }
            if (reportEndDate && report.datetime > reportEndDate) {
                return false;
            }
            return true;
        })
        .sort((a, b) => {
            let comparison = 0;
            switch (reportSortBy) {
                case "id":
                    comparison = String(a.id).localeCompare(String(b.id));
                    break;
                case "reporter":
                    comparison = a.reporter.localeCompare(b.reporter);
                    break;
                case "priority":
                    // Sort by priority: High > Medium > Low
                    const priorityOrder: { [key: string]: number } = { "High": 3, "Medium": 2, "Low": 1 };
                    comparison = (priorityOrder[a.priority] || 0) - (priorityOrder[b.priority] || 0);
                    break;
                case "status":
                    comparison = a.status.localeCompare(b.status);
                    break;
                case "datetime":
                    comparison = a.datetime.getTime() - b.datetime.getTime();
                    break;
                default:
                    // Default sort: by priority (High first), then by date (most recent first)
                    const defaultPriorityOrder: { [key: string]: number } = { "High": 1, "Medium": 2, "Low": 3 };
                    const priorityComp = (defaultPriorityOrder[a.priority] || 0) - (defaultPriorityOrder[b.priority] || 0);
                    if (priorityComp !== 0) {
                        comparison = -priorityComp; // Higher priority first (desc)
                    } else {
                        const dateComp = b.datetime.getTime() - a.datetime.getTime();
                        comparison = -dateComp; // More recent first (desc)
                    }
            }
            return reportSortOrder === "asc" ? comparison : -comparison;
        });

    // Filter and sort caretakers based on search and filter states
    const filteredCaretakers = caregivers
        .filter((ct) => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                return (
                    ct.name.toLowerCase().includes(query) ||
                    (ct.email && ct.email.toLowerCase().includes(query)) ||
                    (ct.location && ct.location.toLowerCase().includes(query))
                );
            }
            return true;
        })
        .filter((ct) => {
            // Status filter (all verified in this view)
            return true;
        })
        .filter((ct) => {
            // Location filter
            if (locationFilter !== "all" && ct.location) {
                return ct.location === locationFilter;
            }
            return true;
        })
        .filter((ct) => {
            // Pet type filter
            if (petTypeFilter !== "all") {
                return (ct.petPreferences ?? []).includes(petTypeFilter);
            }
            return true;
        })
        .sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case "name":
                    comparison = a.name.localeCompare(b.name);
                    break;
                case "experience":
                    comparison = (a.experienceYears || 0) - (b.experienceYears || 0);
                    break;
                case "rate":
                    comparison = (a.dailyRate || 0) - (b.dailyRate || 0);
                    break;
                case "location":
                    comparison = (a.location || "").localeCompare(b.location || "");
                    break;
                default:
                    comparison = (b.totalReviews || 0) - (a.totalReviews || 0);
            }
            return sortOrder === "asc" ? comparison : -comparison;
        });

    // Calculate pagination values
    const totalItems = activeTab === "caretakers" ? filteredCaretakers.length : 
                       activeTab === "transactions" ? filteredTransactions.length : 
                       filteredReports.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    // Get paginated data based on active tab
    const paginatedData = activeTab === "caretakers" 
        ? filteredCaretakers.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        : activeTab === "transactions"
        ? filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize)
        : filteredReports.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            <Navbar/>

            <main className="max-w-7xl mx-auto w-full py-12 px-8">
                <div className="mb-10">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight">Admin Dashboard</h2>
                    <p className="text-slate-500 mt-2 text-base font-medium">Track daily platform performance and pending administrative tasks.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {stats.map((stat) => (
                        <div key={stat.label} className="bg-white p-8 rounded-4xl shadow-sm border border-slate-100 group transition-all hover:shadow-xl">
                            <div className="flex justify-between items-start mb-6">
                                <div className={`p-3 rounded-2xl bg-slate-50 ${stat.color}`}>{stat.icon}</div>
                                <span className="text-xs font-black bg-teal-50 text-teal-600 px-3 py-1 rounded-lg uppercase tracking-widest">Live</span>
                            </div>
                            <p className="text-3xl font-black text-slate-900">{stat.value}</p>
                            <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{stat.label}</p>
                        </div>
                    ))}
                </div>

                <div className="mb-12">
                    {/* Updated Tabs to match the image precisely */}
                    <div className="flex border-b border-slate-200 mb-6 gap-2">
                        <button onClick={() => setActiveTab("caretakers")} className={`px-4 py-3 text-sm transition-colors ${activeTab === "caretakers" ? "text-slate-900 font-bold border-b-2 border-slate-900" : "text-slate-500 font-medium hover:text-slate-900"}`}>
                            All Caretakers ({filteredCaretakers.length})
                        </button>
                        <button onClick={() => setActiveTab("transactions")} className={`px-4 py-3 text-sm transition-colors ${activeTab === "transactions" ? "text-slate-900 font-bold border-b-2 border-slate-900" : "text-slate-500 font-medium hover:text-slate-900"}`}>
                            Past Transactions ({transactions.length})
                        </button>
                        <button onClick={() => setActiveTab("reports")} className={`px-4 py-3 text-sm transition-colors ${activeTab === "reports" ? "text-slate-900 font-bold border-b-2 border-slate-900" : "text-slate-500 font-medium hover:text-slate-900"}`}>
                            Reports ({reports.length})
                        </button>
                    </div>
                    {/* Compact Search and Filter Controls */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                        {activeTab === "caretakers" && (
                            <div className="flex flex-wrap items-end gap-3">
                                <div className="flex-1 min-w-50">
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Search</label>
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            placeholder="Search name, email, or location..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 appearance-none pr-10"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="SUSPENDED">Suspended</option>
                                        <option value="LOCKED">Locked</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 translate-y-0.5 text-slate-400 pointer-events-none" />
                                </div>
                                <div className="relative">
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Location</label>
                                    <select
                                        value={locationFilter}
                                        onChange={(e) => setLocationFilter(e.target.value)}
                                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 appearance-none pr-10"
                                    >
                                        <option value="all">All Locations</option>
                                        <option value="Bukit Batok">Bukit Batok</option>
                                        <option value="Tampines">Tampines</option>
                                        <option value="Jurong East">Jurong East</option>
                                        <option value="Woodlands">Woodlands</option>
                                        <option value="Bedok">Bedok</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 translate-y-0.5 text-slate-400 pointer-events-none" />
                                </div>
                                <div className="relative">
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Pet Type</label>
                                    <select
                                        value={petTypeFilter}
                                        onChange={(e) => setPetTypeFilter(e.target.value as "all" | PetType)}
                                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 appearance-none pr-10"
                                    >
                                        <option value="all">All Pets</option>
                                        <option value="DOG">Dogs</option>
                                        <option value="CAT">Cats</option>
                                        <option value="BIRD">Birds</option>
                                        <option value="REPTILE">Reptiles</option>
                                        <option value="FISH">Fish</option>
                                        <option value="SMALL_ANIMAL">Small Mammals</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 translate-y-0.5 text-slate-400 pointer-events-none" />
                                </div>
                            </div>
                        )}

                        {activeTab === "transactions" && (
                            <div className="flex flex-col">
                                <div className="flex flex-wrap items-end gap-3">
                                    <div className="flex-1 min-w-50">
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Search</label>
                                        <div className="relative">
                                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            <input
                                                type="text"
                                                placeholder="Search ID, client, caretaker or pet..."
                                                value={transactionSearch}
                                                onChange={(e) => setTransactionSearch(e.target.value)}
                                                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                            /> 
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Payment Method</label>
                                        <select
                                            value={transactionMethodFilter}
                                            onChange={(e) => setTransactionMethodFilter(e.target.value)}
                                            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 appearance-none pr-10"
                                        >
                                            <option value="all">All Methods</option>
                                            <option value="Visa">Visa</option>
                                            <option value="PayNow">PayNow</option>
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3 top-1/2 translate-y-0.5 text-slate-400 pointer-events-none" />
                                    </div>
                                    <div className="relative">
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
                                        <select
                                            value={transactionStatusFilter}
                                            onChange={(e) => setTransactionStatusFilter(e.target.value)}
                                            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 appearance-none pr-10"
                                        >
                                            <option value="all">All Statuses</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Pending">Pending</option>
                                        </select>
                                        <ChevronDown size={16} className="absolute right-3 top-1/2 translate-y-0.5 text-slate-400 pointer-events-none" />
                                    </div>
                                    
                                    {/* Date Range Fields */}
                                    <div className="flex items-end gap-2">
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Start Date</label>
                                            <input
                                                type="date"
                                                value={transactionStartDate ? transactionStartDate.toISOString().split('T')[0] : ''}
                                                onChange={(e) => setTransactionStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                                                className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                            />
                                        </div>
                                        {/* <span className="text-slate-400 pb-2">-</span> */}
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">End Date</label>
                                            <input
                                                type="date"
                                                value={transactionEndDate ? transactionEndDate.toISOString().split('T')[0] : ''}
                                                onChange={(e) => setTransactionEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                                                className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                            />
                                        </div>
                                    </div>
                                    
                                    {/* Min/Max Fields */}
                                    <div className="flex items-end gap-2">
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Min ($)</label>
                                            <input
                                                type="number"
                                                value={transactionMinAmount ?? ''}
                                                onChange={(e) => setTransactionMinAmount(e.target.value === '' ? undefined : Number(e.target.value))}
                                                className="w-20 sm:w-24 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                            />
                                        </div>
                                        {/* <span className="text-slate-400 pb-2">-</span> */}
                                        <div>
                                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Max ($)</label>
                                            <input
                                                type="number"
                                                value={transactionMaxAmount ?? ''}
                                                onChange={(e) => setTransactionMaxAmount(e.target.value === '' ? undefined : Number(e.target.value))}
                                                className="w-20 sm:w-24 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                                
                            </div>
                        )}

                        {activeTab === "reports" && (
                            <div className="flex flex-wrap items-end gap-3">
                                <div className="flex-1 min-w-50">
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Search</label>
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        <input
                                            type="text"
                                            placeholder="Search ID, reporter, incident details, title or caretaker..."
                                            value={reportSearch}
                                            onChange={(e) => setReportSearch(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Priority</label>
                                    <select
                                        value={reportPriorityFilter}
                                        onChange={(e) => setReportPriorityFilter(e.target.value)}
                                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 appearance-none pr-10"
                                    >
                                        <option value="all">All Priorities</option>
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 translate-y-0.5 text-slate-400 pointer-events-none" />
                                </div>
                                <div className="relative">
                                    <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Status</label>
                                    <select
                                        value={reportStatusFilter}
                                        onChange={(e) => setReportStatusFilter(e.target.value)}
                                        className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 appearance-none pr-10"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="Pending">Pending</option>
                                        <option value="Resolved">Resolved</option>
                                    </select>
                                    <ChevronDown size={16} className="absolute right-3 top-1/2 translate-y-0.5 text-slate-400 pointer-events-none" />
                                </div>
                                
                                {/* Date Range Fields */}
                                <div className="flex items-end gap-2">
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Start Date</label>
                                        <input
                                            type="date"
                                            value={reportStartDate ? reportStartDate.toISOString().split('T')[0] : ''}
                                            onChange={(e) => setReportStartDate(e.target.value ? new Date(e.target.value) : undefined)}
                                            className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                        />
                                    </div>
                                    <span className="text-slate-400 pb-2">-</span>
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">End Date</label>
                                        <input
                                            type="date"
                                            value={reportEndDate ? reportEndDate.toISOString().split('T')[0] : ''}
                                            onChange={(e) => setReportEndDate(e.target.value ? new Date(e.target.value) : undefined)}
                                            className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    {/* RESULTS COUNT */}
                    <div className="text-left text-sm font-medium italic text-slate-500 mb-1">
                        {activeTab === "caretakers" && (
                            loadingCaregivers ? (
                                <span className="flex items-center gap-2"><Loader size={14} className="animate-spin" />Loading caregivers...</span>
                            ) : (
                                `Showing ${filteredCaretakers.length} of ${caregivers.length} caregiver${caregivers.length !== 1 ? 's' : ''}`
                            )
                        )}
                        {activeTab === "transactions" && (
                            loadingTransactions ? (
                                <span className="flex items-center gap-2"><Loader size={14} className="animate-spin" />Loading transactions...</span>
                            ) : (
                                `Showing ${filteredTransactions.length} of ${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`
                            )
                        )}
                        {activeTab === "reports" && `Showing ${filteredReports.length} of ${reports.length} report${reports.length !== 1 ? 's' : ''}`}
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-x-auto shadow-sm mb-3">
                        {/* Caretakers Tab */}
                        {activeTab === "caretakers" && (
                            <table className="w-full text-left border-collapse whitespace-nowrap min-w-225">
                                <thead className="sticky top-0 z-10 bg-slate-50/50">
                                    <tr className="border-b border-slate-200 bg-slate-50/50">
                                        <th 
                                            className="py-4 px-4 sm:px-6 text-xs font-black uppercase text-slate-500 cursor-pointer hover:text-slate-700 hover:bg-slate-50 transition-colors select-none"
                                            onClick={() => handleCaretakerSort('name')}
                                        >
                                            Caretaker <SortIcon column="name" currentSort={sortBy} order={sortOrder} />
                                        </th>
                                        <th 
                                            className="py-4 px-4 sm:px-6 text-xs font-black uppercase text-slate-500 cursor-pointer hover:text-slate-700 hover:bg-slate-50 transition-colors select-none"
                                            onClick={() => handleCaretakerSort('location')}
                                        >
                                            Location <SortIcon column="location" currentSort={sortBy} order={sortOrder} />
                                        </th>
                                        <th 
                                            className="py-4 px-4 sm:px-6 text-xs font-black uppercase text-slate-500 cursor-pointer hover:text-slate-700 hover:bg-slate-50 transition-colors select-none"
                                            onClick={() => handleCaretakerSort('rate')}
                                        >
                                            Daily Rate <SortIcon column="rate" currentSort={sortBy} order={sortOrder} />
                                        </th>
                                        <th 
                                            className="py-4 px-4 sm:px-6 text-xs font-black uppercase text-slate-500 cursor-pointer hover:text-slate-700 hover:bg-slate-50 transition-colors select-none"
                                            onClick={() => handleCaretakerSort('experience')}
                                        >
                                            Experience <SortIcon column="experience" currentSort={sortBy} order={sortOrder} />
                                        </th>
                                        <th className="py-4 px-6 text-sm font-medium text-slate-500">Rating</th>
                                        <th className="py-4 px-6 text-sm font-medium text-slate-500">Status</th>
                                        <th className="py-4 px-6 text-sm font-medium text-slate-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCaretakers.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((ct) => (
                                        <tr key={ct.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                            <td className="py-4 px-4 sm:px-6">
                                                <div className="flex items-center gap-3">
                                                    <img src={ct.user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ct.name}`} alt={ct.name} className="w-9 h-9 rounded-full object-cover" />
                                                    <div>
                                                        <div className="flex items-center gap-1">
                                                            <span className="font-bold flex gap-1 text-slate-900 text-sm items-center">
                                                                {ct.name} 
                                                                {ct.verified && (
                                                                    <BadgeCheck size={16} className="text-teal-500 shrink-0" fill="currentColor" stroke="white" />
                                                                )}
                                                            </span>
                                                        </div>
                                                        <div className="text-xs text-slate-500">{ct.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 sm:px-6">
                                                <div className="flex items-center gap-1 text-sm text-slate-600">
                                                    <MapPin size={14} className="text-slate-400 shrink-0" />
                                                    {ct.location}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 sm:px-6 text-sm font-bold text-slate-900">
                                                ${ct.dailyRate?.toFixed(2) || '0.00'}/day
                                            </td>
                                            <td className="py-4 px-4 sm:px-6 text-sm font-bold text-slate-900">
                                                {ct.experienceYears || 0} years
                                            </td>
                                            <td className="py-4 px-4 sm:px-6 text-sm font-bold text-slate-900">
                                                {ct.averageRating.toFixed(1)} ({ct.totalReviews})
                                            </td>
                                            <td className="py-4 px-4 sm:px-6">
                                                <span className={`px-2.5 py-1 rounded-2xl text-xs uppercase font-bold border ${
                                                    ct.verified
                                                        ? "bg-green-100 text-green-700 border-green-200"
                                                        : "bg-amber-100 text-amber-700 border-amber-200"
                                                }`}>
                                                    {ct.verified ? "Verified" : "Unverified"}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 sm:px-6">
                                                <button 
                                                    onClick={() => window.location.href = `/admin/verified?search=${encodeURIComponent(ct.email ?? "")}`}
                                                    className="bg-teal-600 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-teal-800 transition-colors"
                                                >
                                                    View
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {/* Transactions Tab */}
                        {activeTab === "transactions" && (
                            <table className="w-full text-left border-collapse whitespace-nowrap min-w-200">
                                <thead className="sticky top-0 z-10 bg-slate-50/50">
                                    <tr className="border-b border-slate-200 bg-slate-50/50">
                                        <th 
                                            className="py-4 px-4 sm:px-6 text-xs font-black uppercase text-slate-500 cursor-pointer hover:text-slate-700 hover:bg-slate-50 transition-colors select-none"
                                            onClick={() => handleTransactionSort('id')}
                                        >
                                            Transaction ID <SortIcon column="id" currentSort={transactionSortBy} order={transactionSortOrder} />
                                        </th>
                                        <th 
                                            className="py-4 px-4 sm:px-6 text-xs font-black uppercase text-slate-500 cursor-pointer hover:text-slate-700 hover:bg-slate-50 transition-colors select-none"
                                            onClick={() => handleTransactionSort('owner')}
                                        >
                                            Owner / Caretaker <SortIcon column="owner" currentSort={transactionSortBy} order={transactionSortOrder} />
                                        </th>
                                        <th className="py-4 px-4 sm:px-6 text-xs font-black uppercase text-slate-500">Pet / Dates</th>
                                        <th 
                                            className="py-4 px-4 sm:px-6 text-xs font-black uppercase text-slate-500 cursor-pointer hover:text-slate-700 hover:bg-slate-50 transition-colors select-none"
                                            onClick={() => handleTransactionSort('amount')}
                                        >
                                            Amount <SortIcon column="amount" currentSort={transactionSortBy} order={transactionSortOrder} />
                                        </th>
                                        <th className="py-4 px-4 sm:px-6 text-xs font-black uppercase text-slate-500">Method</th>
                                        <th 
                                            className="py-4 px-4 sm:px-6 text-xs font-black uppercase text-slate-500 cursor-pointer hover:text-slate-700 hover:bg-slate-50 transition-colors select-none"
                                            onClick={() => handleTransactionSort('date')}
                                        >
                                            Date & Time <SortIcon column="date" currentSort={transactionSortBy} order={transactionSortOrder} />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTransactions.length > 0 ? (
                                        filteredTransactions.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((tx) => (
                                            <tr key={tx.id} className="border-b border-slate-100 hover:bg-slate-50">
                                                <td className="py-4 px-4 sm:px-6 text-sm font-bold text-slate-900">{tx.id}</td>
                                                <td className="py-4 px-4 sm:px-6">
                                                    <p className="text-sm font-bold text-slate-900">{tx.owner}</p>
                                                    <p className="text-xs text-slate-500">Care by: {tx.caretaker}</p>
                                                </td>
                                                <td className="py-4 px-4 sm:px-6">
                                                    <p className="text-sm font-medium">{tx.pet}</p>
                                                    <p className="text-xs text-slate-400">{new Date(tx.startDate).toLocaleDateString()} - {new Date(tx.endDate).toLocaleDateString()}</p>
                                                </td>
                                                <td className="py-4 px-4 sm:px-6 text-sm font-black text-slate-900">${tx.total.toFixed(2)}</td>
                                                <td className="py-4 px-4 sm:px-6 text-xs font-bold text-slate-500 uppercase">{tx.method}</td>
                                                <td className="py-4 px-4 sm:px-6">
                                                    <p className="text-sm font-medium text-slate-700">{new Date(tx.date).toLocaleDateString()}</p>
                                                    <p className="text-xs text-slate-500 uppercase">{new Date(tx.date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="py-12 px-6 text-center text-slate-500">
                                                No transactions found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                        {/* Reports Tab */}
                        {activeTab === "reports" && (
                             <table className="w-full text-left border-collapse min-w-212.5">
                                <thead className="sticky top-0 z-10 bg-slate-50/50">
                                    <tr className="border-b border-slate-200 bg-slate-50/50">
                                        <th 
                                            className="py-4 px-4 sm:px-6 whitespace-nowrap text-xs font-black uppercase text-slate-500 cursor-pointer hover:text-slate-700 hover:bg-slate-50 transition-colors select-none"
                                            onClick={() => handleReportSort('id')}
                                        >
                                            ID <SortIcon column="id" currentSort={reportSortBy} order={reportSortOrder} />
                                        </th>
                                        <th 
                                            className="py-4 px-4 sm:px-6 whitespace-nowrap text-xs font-black uppercase text-slate-500 cursor-pointer hover:text-slate-700 hover:bg-slate-50 transition-colors select-none"
                                            onClick={() => handleReportSort('reporter')}
                                        >
                                            Reporter <SortIcon column="reporter" currentSort={reportSortBy} order={reportSortOrder} />
                                        </th>
                                        <th className="py-4 px-4 sm:px-6 text-xs font-black uppercase text-slate-500">Incident Details</th>
                                        <th 
                                            className="py-4 px-4 sm:px-6 whitespace-nowrap text-xs font-black uppercase text-slate-500 cursor-pointer hover:text-slate-700 hover:bg-slate-50 transition-colors select-none"
                                            onClick={() => handleReportSort('datetime')}
                                        >
                                            Filed <SortIcon column="datetime" currentSort={reportSortBy} order={reportSortOrder} />
                                        </th>
                                        <th 
                                            className="py-4 px-4 sm:px-6 whitespace-nowrap text-xs font-black uppercase text-slate-500 cursor-pointer hover:text-slate-700 hover:bg-slate-50 transition-colors select-none"
                                            onClick={() => handleReportSort('priority')}
                                        >
                                            Priority <SortIcon column="priority" currentSort={reportSortBy} order={reportSortOrder} />
                                        </th>
                                        <th 
                                            className="py-4 px-4 sm:px-6 whitespace-nowrap text-xs font-black uppercase text-slate-500 cursor-pointer hover:text-slate-700 hover:bg-slate-50 transition-colors select-none"
                                            onClick={() => handleReportSort('status')}
                                        >
                                            Status <SortIcon column="status" currentSort={reportSortBy} order={reportSortOrder} />
                                        </th>
                                        <th className="py-4 px-4 sm:px-6 whitespace-nowrap text-xs font-black uppercase text-slate-500">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredReports.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((report) => (
                                        <tr key={report.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-sm font-bold text-slate-900">{report.id}</td>
                                            <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-sm font-bold text-slate-900">{report.reporter}</td>
                                            {/* Given a minimum width so it doesn't crush, but allowed to wrap */}
                                            <td className="py-4 px-4 sm:px-6 min-w-62.5 max-w-75">
                                                <div className="font-bold text-slate-900 italic text-sm line-clamp-2">"{report.title}"</div>
                                                <div className="text-xs text-slate-500 mt-0.5">Against: {report.caretaker}</div>
                                            </td>
                                            <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                                                <p className="text-sm font-medium text-slate-700">{report.datetime.toLocaleDateString()}</p>
                                                <p className="text-xs text-slate-500 uppercase">{report.datetime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
                                            </td>
                                            <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                                                <span className={`px-3 py-1 text-xs font-black uppercase rounded-2xl border ${
                                                    report.priority.toLowerCase() === "high" ? "bg-red-50 text-red-700 border-red-200" :
                                                    report.priority.toLowerCase() === "medium" ? "bg-orange-50 text-orange-700 border-orange-200" :
                                                    "bg-blue-50 text-blue-700 border-blue-200"
                                                }`}>
                                                    {report.priority}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-2xl text-xs uppercase font-bold border ${
                                                    report.status.toLowerCase() === "resolved" ? "bg-green-100 text-green-700 border-green-200" : 
                                                    report.status.toLowerCase() === "pending" ? "bg-amber-100 text-amber-700 border-amber-200" : 
                                                    "bg-red-100 text-red-700 border-red-200"
                                                }`}>
                                                    {report.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                                                <button 
                                                    onClick={() => window.location.href = `/admin/incidents?search=${report.id}`}
                                                    className="bg-slate-900 text-white px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-colors"
                                                >
                                                    Review
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                    
                    {/* Pagination */}
                    {totalItems > 0 && (
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                            pageSize={pageSize}
                            onPageSizeChange={(size) => { setPageSize(size); setCurrentPage(1); }}
                            totalItems={totalItems}
                            startItem={startItem}
                            endItem={endItem}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}