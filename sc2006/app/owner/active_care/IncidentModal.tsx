"use client"
import { useState, type ReactNode } from 'react';
import {
    AlertTriangle,
    X,
    Dog,
    Smartphone,
    FileText,
    ShieldAlert,
    Paperclip,
    Image as ImageIcon,
    Video,
} from 'lucide-react';

interface IncidentModalProps {
    onClose: () => void;
    bookingId?: string;
    petName?: string;
    caregiverName?: string;
}

type IncidentType = 'SAFETY' | 'UNRESPONSIVE' | 'OTHER';

const INCIDENT_TYPE_OPTIONS: Array<{ id: IncidentType; label: string; icon: ReactNode }> = [
    { id: 'SAFETY', label: 'Safety/Well-being Concern', icon: <Dog size={24} /> },
    { id: 'UNRESPONSIVE', label: 'Caretaker Unresponsive', icon: <Smartphone size={24} /> },
    { id: 'OTHER', label: 'Other Issue', icon: <FileText size={24} /> },
];

export default function IncidentModal({ onClose, bookingId, petName, caregiverName }: IncidentModalProps) {
    const [step, setStep] = useState(1);
    const [incidentType, setIncidentType] = useState<IncidentType | null>(null);
    const [description, setDescription] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSelectType = (type: IncidentType) => {
        setIncidentType(type);
        setErrorMessage(null);
        setStep(2);
    };

    const handleSubmit = async () => {
        if (!bookingId) {
            setErrorMessage('Missing booking context. Please report this from My Bookings.');
            return;
        }

        if (!incidentType) {
            setErrorMessage('Please select an incident type.');
            return;
        }

        if (description.trim().length < 10) {
            setErrorMessage('Please provide at least 10 characters in the description.');
            return;
        }

        if (attachment) {
            const isImage = attachment.type.startsWith('image/');
            const isVideo = attachment.type.startsWith('video/');

            if (!isImage && !isVideo) {
                setErrorMessage('Attachment must be a photo or video file.');
                return;
            }

            const maxBytes = isVideo ? 25 * 1024 * 1024 : 10 * 1024 * 1024;
            if (attachment.size > maxBytes) {
                setErrorMessage(isVideo ? 'Video must be 25MB or smaller.' : 'Image must be 10MB or smaller.');
                return;
            }
        }

        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            const formData = new FormData();
            formData.append('bookingId', bookingId);
            formData.append('type', incidentType);
            formData.append('description', description.trim());
            if (attachment) {
                formData.append('attachment', attachment);
            }

            const res = await fetch('/api/incidents', {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                setErrorMessage(data.error || 'Failed to submit incident report.');
                return;
            }

            setIsSubmitted(true);
            setTimeout(() => onClose(), 1200);
        } catch {
            setErrorMessage('Failed to submit incident report.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-red-50/30">
                    <div className="flex items-center gap-3">
                        <span className="text-red-600">
                            <AlertTriangle size={20} />
                        </span>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">Report Incident</h2>
                            {(petName || caregiverName || bookingId) && (
                                <p className="text-xs font-semibold text-slate-500 mt-1">
                                    {petName ? `${petName}` : 'Booking'}
                                    {caregiverName ? ` with ${caregiverName}` : ''}
                                    {bookingId ? ` (${bookingId.slice(0, 8)})` : ''}
                                </p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6">
                    {step === 1 ? (
                        <>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Please select the nature of the concern. This will flag the arrangement for <strong>immediate HR review</strong>.
                            </p>

                            <div className="grid grid-cols-1 gap-3">
                                {INCIDENT_TYPE_OPTIONS.map((type) => (
                                    <button
                                        key={type.id}
                                        onClick={() => handleSelectType(type.id)}
                                        className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:border-red-200 hover:bg-red-50/50 transition-all text-left group"
                                    >
                                        <span className="text-slate-400 group-hover:text-red-600 transition-colors">{type.icon}</span>
                                        <span className="font-bold text-slate-700 group-hover:text-red-700">{type.label}</span>
                                    </button>
                                ))}
                            </div>

                            {errorMessage && <p className="text-sm text-red-600 font-semibold">{errorMessage}</p>}
                        </>
                    ) : (
                        <>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Description of Incident</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Please provide specific details about what happened..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none transition-all resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Attachment (Optional)</label>
                                    <label className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-slate-600 hover:border-red-300 hover:bg-red-50/40 transition-all cursor-pointer flex items-center gap-2">
                                        <Paperclip size={16} className="text-slate-400" />
                                        <span>{attachment ? attachment.name : 'Attach a photo or video'}</span>
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0] ?? null;
                                                setAttachment(file);
                                                setErrorMessage(null);
                                            }}
                                        />
                                    </label>
                                    <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                                        <span className="flex items-center gap-1">
                                            {attachment?.type.startsWith('video/') ? <Video size={12} /> : <ImageIcon size={12} />}
                                            {attachment ? `${(attachment.size / (1024 * 1024)).toFixed(2)} MB` : 'Images up to 10MB, videos up to 25MB'}
                                        </span>
                                        {attachment && (
                                            <button
                                                type="button"
                                                onClick={() => setAttachment(null)}
                                                className="font-semibold text-slate-600 hover:text-slate-900"
                                            >
                                                Remove
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {errorMessage && <p className="text-sm text-red-600 font-semibold">{errorMessage}</p>}

                                {isSubmitted && <p className="text-sm text-emerald-600 font-semibold">Incident report submitted successfully.</p>}

                                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl">
                                    <p className="text-[11px] text-amber-700 leading-relaxed font-medium flex gap-2">
                                        <ShieldAlert size={14} className="shrink-0" />
                                        <span>
                                            <strong>Note:</strong> Once submitted, this report and all related check-in videos will be locked and forwarded to our HR dispute team for a neutral resolution.
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setStep(1)} className="flex-1 py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
                                    Back
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || isSubmitted}
                                    className="flex-2 bg-red-600 text-white font-bold py-3 rounded-xl hover:bg-red-700 disabled:opacity-60 transition-all shadow-lg shadow-red-600/20"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit to HR'}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}