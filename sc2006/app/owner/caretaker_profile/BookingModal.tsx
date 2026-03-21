"use client"
import { useRef, useState } from "react";
import { Receipt, ShieldCheck, ArrowRight, ChevronLeft } from "lucide-react";
import { Pet } from "@/app/generated/prisma/browser";
import { useBooking } from "@/hooks/useBooking";

interface BookingModalProps {
    caregiverName: string;
    caregiverId: string;
    pets: Pet[];
    onClose: () => void;
}

export default function BookingModal({ caregiverName, caregiverId, pets, onClose }: BookingModalProps) {
    // --- STATE MANAGEMENT ---
    const [step, setStep] = useState<1 | 2>(1);
    const { createBooking, loading } = useBooking();
    const [errorMsg, setErrorMsg] = useState("");
    const [successMsg, setSuccessMsg] = useState("");

    // Step 1 Form State
    const [selectedPet, setSelectedPet] = useState("");
    const [serviceType, setServiceType] = useState("In-Home Care");
    const [specialInstructions, setSpecialInstructions] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Step 2 Math State
    const dailyRate = 65;
    const days = startDate && endDate
        ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)))
        : 1;
    const subtotal = dailyRate * days;
    const platformFee = subtotal * 0.05;
    const total = subtotal + platformFee;

    // Overlay click handler
    const modalRef = useRef<HTMLDivElement>(null);
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
            onClose();
        }
    };

    return (
        <div onClick={handleOverlayClick} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            
            {step === 1 ? (
                <div ref={modalRef} className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden relative border border-slate-100 animate-in zoom-in-95 duration-200">
                    {/* HEADER */}
                    <div className="flex justify-between items-center p-6 border-b border-slate-100">
                        <div>
                            <h3 className="font-black text-xl text-slate-900 tracking-tight">Book {caregiverName}</h3>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors rounded-full p-2 hover:bg-slate-50">
                            ✕
                        </button>
                    </div>

                    {/* BODY */}
                    <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
                        {/* PET SELECTION */}
                        <div>
                            <label className="text-xs font-black text-slate-900 uppercase tracking-widest block mb-2">
                                Select Your Pet <span className="text-red-500">*</span>
                            </label>
                            <select 
                                value={selectedPet}
                                onChange={(e) => setSelectedPet(e.target.value)}
                                className="w-full border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-700 bg-slate-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white outline-none appearance-none transition-all"
                            >
                                <option value="" disabled>Choose a pet</option>
                                {pets.map((pet) => (
                                    <option key={pet.id} value={pet.id}>
                                        {pet.name} ({pet.type})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* SERVICE TYPE SELECTION */}
                        <div>
                            <label className="text-xs font-black text-slate-900 uppercase tracking-widest block mb-2">
                                Service Type
                            </label>
                            <select 
                                value={serviceType}
                                onChange={(e) => setServiceType(e.target.value)}
                                className="w-full border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-700 bg-slate-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white outline-none appearance-none transition-all"
                            >
                                <option value="In-Home Care">In-Home Care</option>
                                <option value="Drop-Off Care">Drop-Off Care</option>
                            </select>
                        </div>

                        {/* DATE PICKERS */}
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <label className="text-xs font-black text-slate-900 uppercase tracking-widest block mb-2">
                                    Start Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={startDate}
                                    min={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-700 bg-slate-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white outline-none transition-all"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs font-black text-slate-900 uppercase tracking-widest block mb-2">
                                    End Date <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={endDate}
                                    min={startDate || new Date().toISOString().split("T")[0]}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-700 bg-slate-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white outline-none transition-all"
                                />
                            </div>
                        </div>

                        {/* SPECIAL INSTRUCTIONS */}
                        <div>
                            <label className="text-xs font-black text-slate-900 uppercase tracking-widest block mb-2">
                                Special Instructions
                            </label>
                            <textarea 
                                value={specialInstructions}
                                onChange={(e) => setSpecialInstructions(e.target.value)}
                                placeholder="Any special care instructions..."
                                className="w-full border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-700 bg-slate-50 focus:ring-2 focus:ring-teal-500 focus:border-transparent focus:bg-white outline-none min-h-24 resize-none transition-all"
                            ></textarea>
                        </div>
                    </div>

                    {/* FOOTER ACTIONS */}
                    <div className="flex gap-3 p-6 bg-slate-50 border-t border-slate-100 rounded-b-[2.5rem]">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => setStep(2)}
                            disabled={!selectedPet || !startDate || !endDate}
                            className="flex-1 py-3.5 rounded-xl text-xs font-black uppercase tracking-widest bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-lg shadow-teal-600/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            Continue to Invoice
                        </button>
                    </div>
                </div>

            ) : (
                <div ref={modalRef} className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-slate-100 animate-in slide-in-from-right-4 duration-300">
                    <div className="p-8 bg-slate-900 text-white text-center relative">
                        <button 
                            onClick={() => setStep(1)} 
                            className="absolute left-6 top-6 text-slate-400 hover:text-white transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                            <Receipt size={32} className="text-teal-400" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">Confirm Request</h2>
                    </div>

                    <div className="p-8">
                        {/* SUMMARY INVOICE */}
                        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 mb-8">
                            <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-4">
                                <span className="text-sm font-bold text-slate-500">Caregiver</span>
                                <span className="text-sm font-black text-slate-900">{caregiverName}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-4">
                                <span className="text-sm font-bold text-slate-500">Duration</span>
                                <span className="text-sm font-black text-slate-900">{days} Days</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-4">
                                <span className="text-sm font-bold text-slate-500">Rate (${dailyRate}/day)</span>
                                <span className="text-sm font-bold text-slate-700">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-4">
                                <span className="text-sm font-bold text-slate-500">Platform Fee (5%)</span>
                                <span className="text-sm font-bold text-slate-700">${platformFee.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2">
                                <span className="text-base font-black text-slate-900 uppercase tracking-widest">Total</span>
                                <span className="text-3xl font-black text-teal-600">${total.toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 bg-teal-50/50 p-4 rounded-xl border border-teal-100 mb-8">
                            <ShieldCheck size={20} className="text-teal-600 shrink-0" />
                            <p className="text-xs text-teal-800 font-medium leading-relaxed">
                                By confirming, you agree to Pawsport's Trust & Safety terms. No charges are made until the caregiver accepts.
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={onClose} className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    setErrorMsg("");
                                    setSuccessMsg("");
                                    const result = await createBooking({
                                        caregiverId,
                                        petId: selectedPet,
                                        startDate,
                                        endDate,
                                        specialInstructions: specialInstructions || undefined,
                                        totalPrice: total,
                                    });
                                    if (result) {
                                        setSuccessMsg("Booking request sent successfully!");
                                        setTimeout(() => onClose(), 1500);
                                    } else {
                                        setErrorMsg("Caregiver is unavailable during the requested dates.");
                                    }
                                }}
                                disabled={loading}
                                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs font-black uppercase tracking-widest py-4 transition-all shadow-xl shadow-teal-600/20 active:scale-95 flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Sending..." : <> Send Request <ArrowRight size={16} /> </>}
                            </button>
                        </div>
                        {errorMsg && (
                            <div className="mt-2 p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg animate-pulse">
                                {errorMsg}
                            </div>
                        )}
                        {successMsg && (
                            <div className="mt-2 p-3 bg-green-50 border border-green-100 text-green-600 text-sm rounded-lg animate-pulse">
                                {successMsg}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}