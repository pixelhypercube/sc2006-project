"use client"
import Link from "next/link";
import { 
  Dog, 
  Cat, 
  Bird, 
  Turtle, 
  Rabbit, 
  Fish, 
  MapPin, 
  Clock, 
  Star, 
  ShieldCheck 
} from "lucide-react";

interface CaretakerCardProps {
    id: string
    name: string;
    location: string;
    experience: number;
    rating: number;
    reviews: number;
    price: number;
    imageUrl: string;
    isVerified?: boolean;
    petsHandled: string[]; 
}

const petIcons: Record<string, React.ReactNode> = {
    "Dogs": <Dog size={16} />,
    "Cats": <Cat size={16} />,
    "Birds": <Bird size={16} />,
    "Reptiles": <Turtle size={16} />,
    "Small Mammals": <Rabbit size={16} />,
    "Fish": <Fish size={16} />
}

export default function CaretakerCard({
    id,
    name,
    location,
    experience,
    rating,
    reviews,
    price,
    imageUrl,
    isVerified = true,
    petsHandled
}: CaretakerCardProps) {
    return (
        <div className="w-full rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all overflow-hidden bg-white flex flex-col group">
            
            {/* HEADER ACCENT */}
            <div className="h-24 bg-teal-500/10 w-full relative p-4 group-hover:bg-teal-500/15 transition-colors">
                {isVerified && (
                    <div className="absolute top-5 right-5 bg-white/95 backdrop-blur-sm text-teal-600 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm border border-teal-100">
                        <ShieldCheck size={14} strokeWidth={3} className="shrink-0" />
                        <span className="leading-none pt-px">Verified</span>
                    </div>
                )}
            </div>

            {/* MAIN CONTENT */}
            <div className="px-8 pb-8 grow flex flex-col">
                
                {/* AVATAR */}
                <div className="-mt-12 mb-5 relative z-10">
                    <img 
                        src={imageUrl} 
                        alt={name} 
                        className="w-24 h-24 rounded-3xl object-cover border-4 border-white shadow-lg bg-white"
                    />
                </div>

                {/* IDENTITY & META */}
                <div className="mb-5">
                    <h3 className="font-black text-2xl text-slate-900 mb-3 tracking-tight">{name}</h3>
                    <div className="flex flex-wrap items-center text-sm font-bold text-slate-500 gap-y-3 gap-x-5">
                        <span className="flex items-center gap-2">
                            <MapPin size={14} className="text-slate-400" />
                            <span className="leading-none pt-px">{location}</span>
                        </span>
                        <span className="flex items-center gap-2 text-teal-600 bg-teal-50 px-3 py-1.5 rounded-xl font-black uppercase tracking-tighter">
                            <Clock size={14} strokeWidth={3} />
                            <span className="leading-none pt-px">
                                {typeof experience === "string" 
                                    ? (experience as string).replace("+ years", "").trim() 
                                    : experience}
                                + years
                            </span>
                        </span>
                    </div>
                </div>

                {/* RATING */}
                <div className="flex items-center mb-8">
                    <span className="text-amber-500 text-base font-black mr-2 flex items-center gap-1.5">
                        <Star size={16} fill="currentColor" /> {rating}
                    </span>
                    <span className="text-slate-400 text-xs font-black uppercase tracking-widest">
                        ({reviews} reviews)
                    </span>
                </div>

                {/* PETS HANDLED */}
                <div className="space-y-4 mb-10">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Specialization</p>
                    <div className="flex flex-wrap gap-2.5">
                        {petsHandled.map((pet, index) => (
                            <div 
                                key={index}
                                className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-2xl bg-slate-50 text-slate-600 border border-slate-100 group-hover:bg-white transition-colors"
                            >
                                <span className="text-slate-400">{petIcons[pet]}</span>
                                <span className="leading-none pt-px">{pet}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* FOOTER */}
                <div className="mt-auto flex justify-between items-center pt-6 border-t border-slate-50">
                    <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-black text-slate-900">${price}</span>
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">/day</span>
                    </div>
                    <Link 
                        href={`/owner/caretaker_profile/${id}`} 
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-widest py-4 px-8 rounded-2xl transition-all shadow-xl active:scale-95"
                    >
                        View Profile
                    </Link>
                </div>
            </div>
        </div>
    )
}