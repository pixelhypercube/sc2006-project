import { SlidersHorizontal, X } from "lucide-react";
import { useState, useRef } from "react";

interface FiltersModalProps {
    onClose: () => void;
    onApply: (data: {
        maxPrice: number,
        minExperience: string,
        verified: boolean
    }) => void,
    currentFilters: {
        maximumPrice: number,
        minExperience: string,
        verified: boolean
    }
}

export default function FiltersModal({ onClose, onApply, currentFilters }: FiltersModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    // states for filters inside modal
    const [maxPrice, setMaxPrice] = useState<number>(currentFilters.maximumPrice);
    const [minExperience, setMinExperience] = useState<string>(currentFilters.minExperience);
    const [verified, setVerified] = useState<boolean>(currentFilters.verified);

    const handleApply = () => {
        onApply({
            maxPrice,
            minExperience,
            verified
        });
        onClose();
    };

    return (
        <div 
            onClick={handleOverlayClick}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
        >
            <div 
                className="bg-white rounded-2xl w-full max-w-112.5 shadow-2xl overflow-hidden relative"
                ref={modalRef}    
            >
                
                {/* HEADER */}
                <div className="flex justify-between items-center p-5 border-b border-gray-100">
                    <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-2">
                        <SlidersHorizontal/>
                        Filters
                    </h3>
                    <button 
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 rounded-full p-2"
                    >
                        <X/>
                    </button>
                </div>

                {/* BODY */}
                <div className="p-6 space-y-8">
                    
                    {/* price range filter */}
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <label className="font-semibold text-gray-700">Maximum Price</label>
                            <span className="text-teal-600 font-bold">${maxPrice}/day</span>
                        </div>
                        <input 
                            type="range" 
                            min="10" 
                            max="500" 
                            step="5"
                            value={maxPrice}
                            onChange={(e) => setMaxPrice(Number(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-2">
                            <span>$10</span>
                            <span>$500+</span>
                        </div>
                    </div>

                    {/* experience level filter */}
                    <div>
                        <label className="font-semibold text-gray-700 mb-3 block">Minimum Experience</label>
                        <div className="flex flex-wrap gap-2">
                            {['All', '1+ years', '3+ years', '5+ years'].map(exp => (
                                <button
                                    key={exp}
                                    onClick={() => setMinExperience(exp)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                                        minExperience === exp 
                                        ? 'bg-teal-50 border-teal-500 text-teal-700' 
                                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                >
                                    {exp}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* verification filter */}
                    <div>
                        <label className="font-semibold text-gray-700 mb-3 block">Trust & Safety</label>
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={verified}
                                onChange={(e) => setVerified(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-teal-500 focus:ring-teal-500"
                            />
                            <span className="text-gray-700 flex items-center gap-2">
                                <span className="text-teal-500">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
                                </span>
                                Verified Caretakers Only
                            </span>
                        </label>
                    </div>

                </div>

                {/* FOOTER */}
                <div className="flex justify-between items-center p-5 bg-gray-50 border-t border-gray-100">
                    <button 
                        onClick={() => {
                            setMaxPrice(100);
                            setMinExperience("All");
                            setVerified(false);
                        }}
                        className="text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors underline"
                    >
                        Reset all
                    </button>
                    <button 
                        onClick={handleApply}
                        className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition-colors shadow-md"
                    >
                        Show Results
                    </button>
                </div>

            </div>
        </div>
    );
}