/**
 * Pagination Component
 * 
 * Reusable pagination component for table lists
 */
"use client"
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    pageSize: number;
    onPageSizeChange: (size: number) => void;
    totalItems: number;
    startItem: number;
    endItem: number;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    pageSize,
    onPageSizeChange,
    totalItems,
    startItem,
    endItem
}: PaginationProps) {
    const pageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;
        
        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push("...");
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push("...");
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push("...");
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push("...");
                pages.push(totalPages);
            }
        }
        return pages;
    };

    if (totalItems === 0) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border border-slate-200 bg-white rounded-xl">
            {/* Info & Page Size */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
                <span className="text-sm text-slate-500 font-medium whitespace-nowrap">
                    Showing {startItem} to {endItem} of {totalItems}
                </span>
                
                <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500 font-medium whitespace-nowrap">Per page:</span>
                    <div className="relative">
                        <select
                            value={pageSize}
                            onChange={(e) => onPageSizeChange(Number(e.target.value))}
                            className="px-3 py-1.5 pr-8 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 appearance-none cursor-pointer"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Page Navigation */}
            <div className="flex items-center gap-1">
                {/* Previous Button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft size={16} />
                </button>

                {/* First Page */}
                {currentPage > 3 && totalPages > 5 && (
                    <>
                        <button
                            onClick={() => onPageChange(1)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                currentPage === 1
                                    ? 'bg-teal-600 text-white'
                                    : 'border border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            1
                        </button>
                        <span className="px-2 text-slate-400">...</span>
                    </>
                )}

                {/* Page Numbers */}
                {pageNumbers().map((page, idx) => (
                    typeof page === 'number' ? (
                        <button
                            key={idx}
                            onClick={() => onPageChange(page)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                currentPage === page
                                    ? 'bg-teal-600 text-white'
                                    : 'border border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {page}
                        </button>
                    ) : (
                        <span key={idx} className="px-2 text-slate-400">...</span>
                    )
                ))}

                {/* Next Button */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
}