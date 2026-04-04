"use client"
import { useState, useRef } from "react";
import { Star, X, MessageSquareQuote } from "lucide-react";
import { useToast } from "../../context/ToastContext";

interface ReviewModalProps {
    bookingId: string;
    caregiverName: string;
    onClose: () => void;
    onSubmitted: () => void;
}

export default function ReviewModal({ bookingId, caregiverName, onClose, onSubmitted }: ReviewModalProps) {
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    const handleOverlayClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    const handleSubmit = async () => {
        if (rating === 0) return;
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ bookingId, rating, comment }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to submit review');
            }
            onSubmitted();
            onClose();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={handleOverlayClick}
        >
            <div
                ref={modalRef}
                className="bg-white rounded-4xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col"
            >
                <div className="p-8 border-b border-slate-50 flex justify-between items-start bg-white">
                    <div>
                        <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mb-4">
                            <MessageSquareQuote size={24} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Rate your experience</h2>
                        <p className="text-sm font-medium text-slate-500 mt-1">How was your booking with {caregiverName}?</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {/* STAR RATING INTERFACE */}
                    <div className="flex justify-center gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                onClick={() => setRating(star)}
                                className="transition-transform hover:scale-110 focus:outline-none"
                            >
                                <Star
                                    size={40}
                                    className={`transition-colors ${
                                        (hoveredRating || rating) >= star
                                        ? "text-amber-400 fill-amber-400 drop-shadow-md"
                                        : "text-slate-200"
                                    }`}
                                    strokeWidth={1.5}
                                />
                            </button>
                        ))}
                    </div>

                    <div>
                        <label className="block text-xs font-black text-slate-900 uppercase tracking-widest mb-2">Public Review</label>
                        <textarea
                            rows={4}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder={`Leave a note about how ${caregiverName} cared for your pet...`}
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:border-teal-500 focus:bg-white transition-all resize-none"
                        ></textarea>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-50 flex gap-3 bg-white">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3.5 border border-slate-200 bg-white rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        Skip
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={rating === 0 || isSubmitting}
                        className="flex-1 px-6 py-3.5 bg-teal-600 rounded-xl text-xs font-black uppercase tracking-widest text-white hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Submitting..." : "Submit Review"}
                    </button>
                </div>
            </div>
        </div>
    );
}
