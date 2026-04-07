"use client"
import { useState, useEffect } from "react";
import Navbar from "../../components/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useBooking } from "@/hooks/useBooking";

type TransactionRow = {
    id: string;
    date: string;
    petName: string;
    ownerName: string;
    gross: number;
    fee: number;
    net: number;
    status: "Pending Clearance" | "Paid Out";
};

function calculateBookingDays(startDate: string | Date, endDate: string | Date) {
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Normalize to midnight to avoid partial-day drift from time-of-day offsets.
    const startMidnight = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endMidnight = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const diffMs = endMidnight.getTime() - startMidnight.getTime();

    // Inclusive range: same-day booking counts as 1 day, Jan 1 -> Jan 3 counts as 3 days.
    return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
}

// CSV Export Function - Dynamic and Safe with Friendly Headers
const downloadCSV = (transactions: TransactionRow[]) => {
    if (!transactions || transactions.length === 0) {
        alert('No data to export');
        return;
    }

    // Dynamically extract headers from the first transaction object
    // Based on your data structure, this will be: id, date, petName, ownerName, gross, fee, net, status
    const firstTransaction = transactions[0];
    const headers = Object.keys(firstTransaction);
    
    // Map technical field names to user-friendly column headers
    const headerMapping: Record<string, string> = {
        'id': 'Transaction ID',
        'date': 'Date',
        'petName': 'Pet Name',
        'ownerName': 'Owner Name',
        'gross': 'Gross Booking',
        'fee': 'Platform Fee',
        'net': 'Net Payout',
        'status': 'Status'
    };
    
    // Get friendly column headers
    const friendlyHeaders = headers.map(header => headerMapping[header] || header);
    
    // Format values safely for CSV
    const formatValue = (value: any): string => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'number') return value.toFixed(2);
        if (typeof value === 'string') {
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            const escaped = value.replace(/"/g, '""');
            return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
        }
        return String(value);
    };

    // Convert data to CSV format
    const csvContent = [
        friendlyHeaders.join(','),
        ...transactions.map(tx => 
            headers.map(header => formatValue(tx[header as keyof typeof firstTransaction])).join(',')
        )
    ].join('\n');

    // Create download link with dynamic filename
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_export_${timestamp}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export default function CaregiverTransactions() {
    const { user } = useAuth();
    const { fetchBooking, loading, error } = useBooking();
    const [transactions, setTransactions] = useState<TransactionRow[]>([]);

    useEffect(() => {
        const loadTransactions = async () => {
            if (!user?.id) return;

            const bookings = await fetchBooking({ caregiverId: user.id });
            const mappedTransactions: TransactionRow[] = (bookings || [])
                .filter((booking: any) => String(booking.status ?? "").toUpperCase() === "COMPLETED")
                .map((booking: any): TransactionRow => {
                    const days = calculateBookingDays(booking.startDate, booking.endDate);
                    const dailyRate = Number(booking.caregiver?.caregiverProfile?.dailyRate ?? 0);
                    const rateBasedGross = Number((dailyRate * days).toFixed(2));
                    const gross = Number((rateBasedGross || booking.payment?.amount || booking.totalPrice || 0).toFixed(2));
                    const fee = Number((gross * 0.05).toFixed(2));
                    const net = Number((gross - fee).toFixed(2));
                    const paidOut = String(booking.payment?.status ?? "").toUpperCase() === "COMPLETED";
                    const status: TransactionRow["status"] = paidOut ? "Paid Out" : "Pending Clearance";
                    const transactionDate = booking.payment?.paidAt ?? booking.endDate ?? booking.updatedAt ?? booking.createdAt;

                    return {
                        id: booking.id,
                        date: new Date(transactionDate).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                        }),
                        petName: booking.pet?.name ?? "Unknown Pet",
                        ownerName: booking.owner?.name ?? "Unknown Owner",
                        gross,
                        fee,
                        net,
                        status,
                    };
                })
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setTransactions(mappedTransactions);
        };

        loadTransactions();
    }, [user?.id]);

    const totalNet = transactions.reduce((sum, tx) => sum + tx.net, 0);
    const pendingNet = transactions
        .filter((tx) => tx.status === "Pending Clearance")
        .reduce((sum, tx) => sum + tx.net, 0);
    const totalFees = transactions.reduce((sum, tx) => sum + tx.fee, 0);
    const pendingJobsCount = transactions.filter((tx) => tx.status === "Pending Clearance").length;

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            <Navbar />

            <main className="max-w-5xl mx-auto px-6 py-10">
                {/* HEADER */}
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-slate-900">Earnings & Payouts</h1>
                    <p className="text-slate-500 mt-1">Track your completed jobs and platform fee deductions.</p>
                </div>

                {/* EARNINGS SUMMARY CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Net Earnings</p>
                        <p className="text-3xl font-black text-teal-600">${totalNet.toFixed(2)}</p>
                        <p className="text-xs text-slate-400 mt-2">Available to withdraw</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Clearance</p>
                        <p className="text-3xl font-black text-slate-800">${pendingNet.toFixed(2)}</p>
                        <p className="text-xs text-amber-500 font-medium mt-2 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span> {pendingJobsCount} active job{pendingJobsCount === 1 ? "" : "s"}
                        </p>
                    </div>
                    <div className="bg-teal-50 p-6 rounded-2xl shadow-sm border border-teal-100">
                        <p className="text-xs font-bold text-teal-600/70 uppercase tracking-widest mb-1">Platform Fees Paid</p>
                        <p className="text-3xl font-black text-teal-800">${totalFees.toFixed(2)}</p>
                        <p className="text-xs text-teal-600 mt-2 font-medium">5% per transaction</p>
                    </div>
                </div>

                {/* TRANSACTIONS TABLE */}
                <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 bg-white flex justify-between items-center">
                        <h2 className="font-bold text-slate-800">Transaction History</h2>
                        <button 
                            onClick={() => downloadCSV(transactions)}
                            className="text-xs font-bold text-teal-600 hover:text-teal-700 transition-colors"
                        >
                            Download CSV
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        {loading && <p className="px-6 py-4 text-sm text-slate-500">Loading transactions...</p>}
                        {!loading && error && <p className="px-6 py-4 text-sm text-red-500">{error}</p>}
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Booking Info</th>
                                    <th className="px-6 py-4 text-right">Gross Booking</th>
                                    <th className="px-6 py-4 text-right">Platform Fee (5%)</th>
                                    <th className="px-6 py-4 text-right">Net Payout</th>
                                    <th className="px-6 py-4 text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {!loading && !error && transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-6 text-center text-sm text-slate-500">
                                            No completed bookings yet.
                                        </td>
                                    </tr>
                                )}

                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="text-sm font-bold text-slate-900">{tx.petName} <span className="text-slate-400 font-medium">({tx.ownerName})</span></p>
                                            <p className="text-xs text-slate-400 mt-0.5">{tx.id} • {tx.date}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-slate-600 font-medium">
                                            ${tx.gross.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm text-red-400 font-medium">
                                            -${tx.fee.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-teal-600">
                                            ${tx.net.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                                tx.status === 'Paid Out' 
                                                ? 'bg-green-50 text-green-600 border border-green-100' 
                                                : 'bg-amber-50 text-amber-600 border border-amber-100'
                                            }`}>
                                                {tx.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}