"use client"
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Link from "next/link";
import Pagination from "../../components/Pagination";
import { 
    DollarSign, Search, Filter, 
    CheckCircle, XCircle, Clock,
    User, Calendar, ChevronLeft, ChevronDown,
    AlertCircle, FileText,
    FileSearch,
    ClipboardCheck
} from "lucide-react";

// Mock refund requests data
const mockRefundRequests = [
    { 
        id: "REF-001", 
        bookingId: "BKG-442",
        owner: "jane.teo@gmail.com", 
        ownerName: "Jane Teo",
        caretaker: "Sarah Chen",
        amount: 195.00,
        reason: "Caretaker failed to feed my dog or refill water bowl during 3-day sitting. Pet camera confirmed food bowl untouched.",
        status: "Pending",
        datetime: new Date("2026-02-15T14:30:00"),
        transactionId: "TXN-442-001"
    },
    { 
        id: "REF-002", 
        bookingId: "BKG-441",
        owner: "peter.tan@example.com", 
        ownerName: "Peter Tan",
        caretaker: "Mike Tan",
        amount: 220.00,
        reason: "Cat developed gastroenteritis after 4-day sitting. Vet bills exceeded $300. Suspect inappropriate feeding.",
        status: "Pending",
        datetime: new Date("2026-02-14T11:15:00"),
        transactionId: "TXN-441-001"
    },
    { 
        id: "REF-003", 
        bookingId: "BKG-439",
        owner: "alex.goh@example.com", 
        ownerName: "Alex Goh",
        caretaker: "James Lee",
        amount: 80.00,
        reason: "Family heirloom vase ($200) broken during care. Requesting partial refund for damages.",
        status: "Approved",
        datetime: new Date("2026-02-12T15:20:00"),
        transactionId: "TXN-439-001"
    },
    { 
        id: "REF-004", 
        bookingId: "BKG-438",
        owner: "jenny.lee@example.com", 
        ownerName: "Jenny Lee",
        caretaker: "Lisa Wong",
        amount: 150.00,
        reason: "Caretaker lost spare house key during 3-day service. Requires lock replacement costing $150.",
        status: "Rejected",
        datetime: new Date("2026-02-11T13:00:00"),
        transactionId: "TXN-438-001"
    },
    { 
        id: "REF-005", 
        bookingId: "BKG-436",
        owner: "susan.tan@example.com", 
        ownerName: "Susan Tan",
        caretaker: "Michelle Tay",
        amount: 280.00,
        reason: "Dog escaped from yard during care. Found 2 blocks away. Very dangerous situation requiring full refund.",
        status: "Approved",
        datetime: new Date("2026-02-09T16:45:00"),
        transactionId: "TXN-436-001"
    },
    { 
        id: "REF-006", 
        bookingId: "BKG-435",
        owner: "david.lim@example.com", 
        ownerName: "David Lim",
        caretaker: "Daniel Tan",
        amount: 70.00,
        reason: "Only 2 photos sent during 7-day care. No communication for 5 days. Requesting partial refund.",
        status: "Rejected",
        datetime: new Date("2026-02-08T12:15:00"),
        transactionId: "TXN-435-001"
    },
];

export default function AdminRefunds() {
    const searchParams = useSearchParams();
    
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isProcessOpen, setIsProcessOpen] = useState(false);
    const [processAction, setProcessAction] = useState<'approve' | 'reject'>('approve');
    const [processNote, setProcessNote] = useState('');
    
    // Get initial values from URL params
    const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || "");
    const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || "all");
    
    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(5);

    // Mock refund requests data
    const [refundRequests] = useState(mockRefundRequests);

    // Get selected refund from URL params if available
    const [selectedRefund, setSelectedRefund] = useState(() => {
        const searchVal = searchParams.get('search');
        if (searchVal) {
            const found = refundRequests.find(r => r.id.toLowerCase() === searchVal.toLowerCase());
            if (found) return found;
        }
        return refundRequests.find(r => r.status === "Pending") || refundRequests[0];
    });

    // Filter refund requests based on search and filters
    const filteredRequests = refundRequests.filter(request => {
        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                request.id.toLowerCase().includes(query) ||
                request.bookingId.toLowerCase().includes(query) ||
                request.owner.toLowerCase().includes(query) ||
                request.ownerName.toLowerCase().includes(query) ||
                request.caretaker.toLowerCase().includes(query)
            );
        }
        return true;
    }).filter(request => {
        // Status filter
        if (statusFilter !== "all") {
            return request.status === statusFilter;
        }
        return true;
    });

    // Pagination calculations
    const totalItems = filteredRequests.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);
    const paginatedRequests = filteredRequests.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    // Stats
    const pendingCount = refundRequests.filter(r => r.status === "Pending").length;
    const approvedCount = refundRequests.filter(r => r.status === "Approved").length;
    const rejectedCount = refundRequests.filter(r => r.status === "Rejected").length;
    const totalPendingAmount = refundRequests.filter(r => r.status === "Pending").reduce((sum, r) => sum + r.amount, 0);

    const getStatusBadge = (status: string) => {
        switch(status) {
            case "Pending":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-amber-50 text-amber-700 border border-amber-200">
                        <Clock size={12} strokeWidth={3} />
                        {status}
                    </span>
                );
            case "Approved":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-teal-50 text-teal-700 border border-teal-200">
                        <CheckCircle size={12} strokeWidth={3} />
                        {status}
                    </span>
                );
            case "Rejected":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-widest bg-red-50 text-red-700 border border-red-200">
                        <XCircle size={12} strokeWidth={3} />
                        {status}
                    </span>
                );
            default:
                return null;
        }
    };

    const handleProcessRefund = () => {
        // TODO: Call API to process refund
        const action = processAction === 'approve' ? 'approved' : 'rejected';
        alert(`Refund ${selectedRefund?.id} has been ${action}. Owner will be notified.`);
        setIsProcessOpen(false);
        setProcessNote('');
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
                            Refund Requests
                        </h1>
                        <p className="text-base text-slate-500 mt-2 font-medium">Review and process refund requests from pet owners.</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pending</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{pendingCount}</p>
                            </div>
                            <div className="w-10 h-10 bg-amber-50 rounded-lg flex items-center justify-center">
                                <Clock size={20} className="text-amber-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Approved</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{approvedCount}</p>
                            </div>
                            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                                <CheckCircle size={20} className="text-teal-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Rejected</p>
                                <p className="text-2xl font-bold text-slate-900 mt-1">{rejectedCount}</p>
                            </div>
                            <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                                <XCircle size={20} className="text-red-600" />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Pending Amount</p>
                                <p className="text-2xl font-bold text-teal-600 mt-1">${totalPendingAmount.toFixed(2)}</p>
                            </div>
                            <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center">
                                <DollarSign size={20} className="text-teal-600" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* SEARCH AND FILTER CONTROLS */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="flex-1 min-w-[200px]">
                            <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Search</label>
                            <div className="relative">
                                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="Search ID, booking, owner or caretaker..."
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
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-3 top-1/2 translate-y-0.5 text-slate-400 pointer-events-none" />
                        </div>
                        
                        {/* Date Range Fields */}
                        <div className="flex items-end gap-2">
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">Start Date</label>
                                <input
                                    type="date"
                                    className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                />
                            </div>
                            <span className="text-slate-400 pb-2">-</span>
                            <div>
                                <label className="block text-xs font-black text-slate-500 uppercase tracking-widest mb-1.5">End Date</label>
                                <input
                                    type="date"
                                    className="w-32 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* REFUND REQUESTS LIST */}
                <div className="space-y-4 mb-3">
                    {paginatedRequests.map((request) => (
                        <div 
                            key={request.id}
                            className="relative overflow-hidden bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-stretch justify-between gap-6"
                        >
                            {/* Status Color Bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                                request.status === 'Approved' ? 'bg-teal-500' :
                                request.status === 'Pending' ? 'bg-amber-500' :
                                request.status === 'Rejected' ? 'bg-red-500' : 'bg-slate-300'
                            }`} />

                            {/* Left Side: Information */}
                            <div className="flex-1 space-y-4 pl-2">
                                
                                {/* Header Row: ID, Status, and Amount */}
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <span className="text-md font-black text-slate-900 tracking-wider">
                                            {request.id}
                                        </span>
                                        {getStatusBadge(request.status)}
                                    </div>
                                    {/* Amount is now prominently anchored on the right */}
                                    <div className="text-xl font-black text-slate-900">
                                        ${request.amount.toFixed(2)}
                                    </div>
                                </div>

                                {/* Users Involved */}
                                <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                                    <div className="flex items-center gap-3">
                                        {/* Upgraded Avatar using their initial */}
                                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold">
                                            {request.ownerName.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-md font-bold text-slate-900">{request.ownerName}</p>
                                            <p className="text-sm font-medium text-slate-500">{request.owner}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="hidden sm:block w-px h-8 bg-slate-200"></div>
                                    
                                    <div className="flex items-center gap-2">
                                        <User size={14} className="text-slate-400" />
                                        <span className="text-md text-slate-600">
                                            Caretaker: <span className="font-bold text-slate-900">{request.caretaker}</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Shaded Reason Box */}
                                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5">
                                    <p className="text-xs font-black text-slate-600 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                                        <AlertCircle size={12} /> Reason for request
                                    </p>
                                    <p className="text-sm text-slate-700 leading-relaxed line-clamp-2">
                                        {request.reason}
                                    </p>
                                </div>

                                {/* Footer Metadata */}
                                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                                        <Calendar size={14} className="text-slate-400" />
                                        <span>Filed: <span className="font-bold text-black">{request.datetime.getDate()}/{request.datetime.getMonth() + 1}/{request.datetime.getFullYear()}</span></span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                                        <FileText size={14} className="text-slate-400" />
                                        <span>Booking: <span className="font-bold text-black">{request.bookingId}</span></span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-500">
                                        <FileText size={14} className="text-slate-400" />
                                        <span>Transaction ID: <span className="font-bold text-black">{request.transactionId}</span></span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Right Side: Actions (Now with a left border divider on desktop) */}
                            <div className="flex flex-col justify-center gap-3 min-w-[200px] pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-slate-100 md:pl-6">
                                <button 
                                    onClick={() => {
                                        setSelectedRefund(request);
                                        setIsDetailOpen(true);
                                    }}
                                    className="w-full px-4 py-2 border-2 border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                    <FileSearch size={16} className="text-slate-400" />
                                    Details
                                </button>
                                {request.status === "Pending" && (
                                    <button 
                                        onClick={() => {
                                            setSelectedRefund(request);
                                            setIsProcessOpen(true);
                                        }}
                                        className="w-full px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold hover:bg-teal-700 transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <ClipboardCheck size={16} />
                                        Process
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {paginatedRequests.length === 0 && (
                        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                            <AlertCircle size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-900 mb-1">No refund requests found</h3>
                            <p className="text-slate-500">Try adjusting your search or filter criteria.</p>
                        </div>
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
            </main>

            {/* MODAL: VIEW DETAILS */}
            {isDetailOpen && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 md:p-6" onClick={() => setIsDetailOpen(false)}>
                    <div className="bg-white rounded-[24px] w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 bg-slate-50 shrink-0">
                            <h2 className="font-bold text-xl text-slate-900">Refund Request Details</h2>
                            <p className="text-sm font-semibold text-slate-500">Request ID: {selectedRefund?.id}</p>
                        </div>
                        
                        <div className="p-6 space-y-4 overflow-y-auto">
                            {/* Status */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-500">Status</span>
                                {selectedRefund && getStatusBadge(selectedRefund.status)}
                            </div>
                            
                            {/* Amount */}
                            <div className="flex items-center justify-between p-4 bg-teal-50 rounded-xl">
                                <span className="text-sm font-medium text-teal-700">Refund Amount</span>
                                <span className="text-2xl font-bold text-teal-600">${selectedRefund?.amount.toFixed(2)}</span>
                            </div>
                            
                            {/* Booking Info */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-500">Booking ID</span>
                                    <span className="text-sm font-bold text-slate-900">{selectedRefund?.bookingId}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-500">Transaction ID</span>
                                    <span className="text-sm font-bold text-slate-900">{selectedRefund?.transactionId}</span>
                                </div>
                            </div>
                            
                            {/* Owner Info */}
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Owner</p>
                                <p className="text-sm font-bold text-slate-900">{selectedRefund?.ownerName}</p>
                                <p className="text-sm text-slate-500">{selectedRefund?.owner}</p>
                            </div>
                            
                            {/* Caretaker Info */}
                            <div className="p-4 bg-slate-50 rounded-xl">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Caretaker</p>
                                <p className="text-sm font-bold text-slate-900">{selectedRefund?.caretaker}</p>
                            </div>
                            
                            {/* Reason */}
                            <div className="p-4 bg-amber-50 rounded-xl">
                                <p className="text-xs font-black text-amber-700 uppercase tracking-widest mb-2">Reason for Refund</p>
                                <p className="text-sm text-amber-900">{selectedRefund?.reason}</p>
                            </div>
                            
                            {/* Date */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-slate-500">Filed On</span>
                                <span className="text-sm font-bold text-slate-900">
                                    {selectedRefund?.datetime.getDate()}/{selectedRefund?.datetime.getMonth() + 1}/{selectedRefund?.datetime.getFullYear()}
                                </span>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 shrink-0 mt-auto">
                            <button onClick={() => setIsDetailOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Close</button>
                            {selectedRefund?.status === "Pending" && (
                                <button 
                                    onClick={() => {
                                        setIsDetailOpen(false);
                                        setIsProcessOpen(true);
                                    }}
                                    className="px-6 py-2.5 bg-teal-600 text-white rounded-xl text-sm font-bold hover:bg-teal-700 transition-all shadow-md"
                                >
                                    Process Request
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: PROCESS REFUND */}
            {isProcessOpen && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 md:p-6" onClick={() => setIsProcessOpen(false)}>
                    <div className="bg-white rounded-[24px] w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6 border-b border-slate-100 bg-slate-50 shrink-0">
                            <h2 className="font-bold text-xl text-slate-900">Process Refund</h2>
                            <p className="text-sm font-semibold text-slate-500">Request ID: {selectedRefund?.id}</p>
                        </div>
                        
                        <div className="p-6 space-y-6 overflow-y-auto">
                            {/* Refund Summary */}
                            <div className="p-4 bg-teal-50 rounded-xl">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-teal-700">Refund Amount</span>
                                    <span className="text-2xl font-bold text-teal-600">${selectedRefund?.amount.toFixed(2)}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-teal-600">To</span>
                                    <span className="text-teal-900 font-medium">{selectedRefund?.ownerName}</span>
                                </div>
                            </div>
                            
                            {/* Action Selection */}
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-3">Action</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setProcessAction('approve')}
                                        className={`p-4 rounded-xl border-2 transition-all ${
                                            processAction === 'approve'
                                                ? 'bg-teal-50 border-teal-500 text-teal-700'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        <CheckCircle size={24} className="mx-auto mb-2" />
                                        <span className="text-sm font-bold">Approve</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setProcessAction('reject')}
                                        className={`p-4 rounded-xl border-2 transition-all ${
                                            processAction === 'reject'
                                                ? 'bg-red-50 border-red-500 text-red-700'
                                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                                        }`}
                                    >
                                        <XCircle size={24} className="mx-auto mb-2" />
                                        <span className="text-sm font-bold">Reject</span>
                                    </button>
                                </div>
                            </div>
                            
                            {/* Notes */}
                            <div>
                                <label className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-2">
                                    {processAction === 'approve' ? 'Approval Notes' : 'Rejection Reason'} (Optional)
                                </label>
                                <textarea 
                                    value={processNote}
                                    onChange={(e) => setProcessNote(e.target.value)}
                                    placeholder={`Enter ${processAction === 'approve' ? 'approval' : 'rejection'} notes...`}
                                    className="w-full h-24 p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 shrink-0 mt-auto">
                            <button onClick={() => setIsProcessOpen(false)} className="px-6 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
                            <button 
                                onClick={handleProcessRefund}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md ${
                                    processAction === 'approve'
                                        ? 'bg-teal-600 text-white hover:bg-teal-700'
                                        : 'bg-red-600 text-white hover:bg-red-700'
                                }`}
                            >
                                {processAction === 'approve' ? 'Approve & Process' : 'Reject Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}