"use client"
import { useState, useEffect } from "react";
import CaretakerCard from "../components/CaretakerCard";
import Navbar from "../components/Navbar";
import PetCategoryButton from "./PetCategoryButton";
import DatePickerModal from "./DatePickerModal";
import FiltersModal from "./FiltersModal";
import { useAuth } from "@/hooks/useAuth";

import {
  Dog,
  Cat,
  Bird,
  Turtle,
  Rabbit,
  Fish,
  Calendar,
  SlidersHorizontal
} from "lucide-react";

const ICON_SIZE = 32;

const petCategories = [
    { name: 'Dogs', icon: <Dog size={ICON_SIZE} />, borderColor: 'border-orange-200', bgColor: 'bg-orange-50/50', iconColor: 'text-orange-500' },
    { name: 'Cats', icon: <Cat size={ICON_SIZE} />, borderColor: 'border-purple-200', bgColor: 'bg-purple-50/50', iconColor: 'text-purple-500' },
    { name: 'Birds', icon: <Bird size={ICON_SIZE} />, borderColor: 'border-blue-200', bgColor: 'bg-blue-50/50', iconColor: 'text-blue-500' },
    { name: 'Reptiles', icon: <Turtle size={ICON_SIZE} />, borderColor: 'border-green-200', bgColor: 'bg-green-50/50', iconColor: 'text-green-500' },
    { name: 'Small Mammals', icon: <Rabbit size={ICON_SIZE} />, borderColor: 'border-rose-200', bgColor: 'bg-rose-50/50', iconColor: 'text-rose-500' },
    { name: 'Fish', icon: <Fish size={ICON_SIZE} />, borderColor: 'border-cyan-200', bgColor: 'bg-cyan-50/50', iconColor: 'text-cyan-500' },
];

// Maps Pet.type (lowercase string) → PetType enum
const petTypeToPrismaEnum: Record<string, string> = {
    dog: 'DOG',
    cat: 'CAT',
    bird: 'BIRD',
    fish: 'FISH',
    reptile: 'REPTILE',
    'small mammal': 'SMALL_ANIMAL',
    small_mammal: 'SMALL_ANIMAL',
};

// Maps PetType enum → display name used by CaretakerCard
const enumToDisplayName: Record<string, string> = {
    DOG: 'Dogs',
    CAT: 'Cats',
    BIRD: 'Birds',
    FISH: 'Fish',
    REPTILE: 'Reptiles',
    SMALL_ANIMAL: 'Small Mammals',
};

// Maps pet category button name → PetType enum
const categoryToEnum: Record<string, string> = {
    Dogs: 'DOG',
    Cats: 'CAT',
    Birds: 'BIRD',
    Reptiles: 'REPTILE',
    'Small Mammals': 'SMALL_ANIMAL',
    Fish: 'FISH',
};

export default function Dashboard() {
    const { user, loading: authLoading } = useAuth();
    const [selectedPet, setSelectedPet] = useState("");
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [caretakers, setCaretakers] = useState<any[]>([]);
    const [caretakersLoading, setCaretakersLoading] = useState(true);

    // FILTERS DIALOG OPTIONS
    const [filters, setFilters] = useState({
        maximumPrice:100,
        minExperience:"All",
        verified:true
    });

    // CALENDAR DATE OPTIONS
    const [selectedDates, setSelectedDates] = useState<{start: Date | null, end: Date | null}>({ start: null, end: null });

    useEffect(() => {
        if (authLoading) return;

        async function load() {
            setCaretakersLoading(true);
            try {
                // Fetch owner's pets to determine relevant pet types
                let petTypesParam = '';
                const petsRes = await fetch('/api/pets', { credentials: 'include' });
                if (petsRes.ok) {
                    const petsData = await petsRes.json();
                    const ownerPets: any[] = petsData.pets ?? [];
                    const enumTypes = [...new Set(
                        ownerPets
                            .map(p => petTypeToPrismaEnum[p.type?.toLowerCase()] ?? null)
                            .filter(Boolean)
                    )];
                    if (enumTypes.length > 0) {
                        petTypesParam = enumTypes.join(',');
                    }
                }

                const url = petTypesParam
                    ? `/api/caregivers?petTypes=${petTypesParam}`
                    : '/api/caregivers';

                const res = await fetch(url, { credentials: 'include' });
                if (res.ok) {
                    const data = await res.json();
                    setCaretakers(data.caregivers ?? []);
                }
            } catch (e) {
                console.error('Failed to load caregivers', e);
            } finally {
                setCaretakersLoading(false);
            }
        }

        load();
    }, [authLoading]);

    const caretakersList = caretakers
        .map(c => ({
            id: c.id,
            name: c.name ?? '',
            location: c.location ?? '',
            experience: c.experienceYears ?? 0,
            rating: c.averageRating ?? 0,
            reviews: c.totalReviews ?? 0,
            price: c.dailyRate ?? 0,
            isVerified: c.verified ?? false,
            imageUrl: c.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(c.name ?? c.id)}`,
            petsHandled: (c.petPreferences ?? []).map((p: string) => enumToDisplayName[p]).filter(Boolean),
            bookings: c.user?.caregiverBookings ?? [],
        }))
        .filter(item => {
            const matchesPet = selectedPet
                ? item.petsHandled.includes(selectedPet)
                : true;
            const matchesPrice = item.price <= filters.maximumPrice;
            const matchesVerification = filters.verified ? item.isVerified === true : true;
            const experienceRequired =
                filters.minExperience === "1+ years" ? 1 :
                filters.minExperience === "3+ years" ? 3 :
                filters.minExperience === "5+ years" ? 5 : 0;
            const matchesExperience = item.experience >= experienceRequired;
            // Date availability filter - exclude if dates overlap with CONFIRMED or IN_PROGRESS bookings
            let matchesAvailability = true;
            let startDate = selectedDates.start;                                                                                         
            let endDate = selectedDates.end;                                                                                             
      
                  // If only one date is selected, use it for both start and end                                                               
            if (startDate && !endDate) {                                                                                                 
                endDate = startDate;                                                                                                     
            } else if (endDate && !startDate) {                                                                                          
                startDate = endDate;                                                                                                     
            }                                                                                                                            
                                                                                                                                        
            if (startDate && endDate) {                                                                                                  
                const selectedStart = new Date(startDate);                                                                               
                const selectedEnd = new Date(endDate);

                const hasConflict = item.bookings.some((booking: { id: string; startDate: string; endDate: string; status: string }) => {
                    const bookingStart = new Date(booking.startDate);
                    const bookingEnd = new Date(booking.endDate);
                    // Check if booking overlaps with selected period (inclusive of same-day bookings)
                    return bookingStart <= selectedEnd && bookingEnd >= selectedStart;
                });

                matchesAvailability = !hasConflict;
            }

            return matchesPet && matchesPrice && matchesVerification && matchesExperience && matchesAvailability;
        });

    return (
        <div className="min-h-screen 0g-gray-50 flex flex-col font-sans text-slate-900">
            <Navbar/>
            
            {/* HERO SECTION */}
            <header className="w-full py-20 px-6 text-center bg-teal-600 flex flex-col items-center justify-center shadow-inner">
                <h1 className="text-4xl md:text-5xl lg:text-6xl mb-6 font-black text-white tracking-tight">
                    Trusted Care for Your <span className="text-amber-400">Beloved Pets</span>
                </h1>
                <p className="text-lg md:text-xl text-teal-50 max-w-2xl mb-8 font-medium">
                    Find verified, experienced caretakers who'll treat your furry, feathered or scaly friends like family.
                </p>
            </header>
            
            <main className="w-full max-w-7xl mx-auto px-6 py-16 grow">
                
                {/* PET SELECTION */}
                <section className="mb-12">
                    <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-6">Browse by Pet Type</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        {petCategories.map(pet => (
                            <PetCategoryButton
                                key={pet.name}
                                name={pet.name}
                                icon={pet.icon}
                                borderColor={pet.borderColor}
                                bgColor={pet.bgColor}
                                iconColor={pet.iconColor}
                                onClick={() => setSelectedPet(pet.name === selectedPet ? "" : pet.name)} 
                                selected={pet.name===selectedPet}
                            />
                        ))}
                    </div>
                    <h6 className="text-sm font-black italic text-slate-500 mt-3">Select again to deselect</h6>
                </section>

                <section>
                    {/* headers & action controls */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4 border-b border-slate-200 pb-8">
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                                {`${selectedPet 
                                    ? (selectedPet.endsWith('s') ? selectedPet.slice(0,-1) : selectedPet)
                                    : "All"} Caretakers`}
                            </h2>
                            <p className="text-slate-500 text-sm mt-1 font-medium">{caretakersList.length} professionals available</p>
                        </div>
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsDatePickerOpen(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                            >
                                <Calendar size={16} className="text-teal-600" />
                                <span>Availability</span>
                                {/* Show green dot if dates are selected */}
                                {(selectedDates.start || selectedDates.end) && (
                                    <span className="w-2 h-2 rounded-full bg-teal-500 ml-1"></span>
                                )}
                            </button>
                            
                            <button 
                                onClick={() => setIsFiltersOpen(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                            >
                                <SlidersHorizontal size={16} className="text-teal-600" />
                                <span>Filters</span>
                            </button>
                        </div>
                    </div>

                    {/* CARETAKERS GRID */}
                    {caretakersLoading ? (
                        <div className="text-center py-24 text-slate-400 font-bold text-sm uppercase tracking-widest">Loading caregivers…</div>
                    ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {caretakersList.map((caretaker) => (
                            <CaretakerCard
                                key={caretaker.id}
                                {...caretaker}
                            />
                        ))}
                    </div>
                    )}

                    {/* Empty State */}
                    {!caretakersLoading && caretakersList.length === 0 && (
                        <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Dog size={32} strokeWidth={1.5} />
                            </div>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No caretakers found for this category</p>
                        </div>
                    )}
                </section>
            </main>
            
            <footer className="w-full p-8 bg-slate-100 mt-auto border-t border-slate-200">
                <p className="text-center text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">&copy; 2026 Pawsport & Peer. All Rights Reserved.</p>
            </footer>

            {/* MODALS */}
            {isDatePickerOpen && (
                <DatePickerModal
                    initialStartDate={selectedDates.start}
                    initialEndDate={selectedDates.end}
                    onClose={() => setIsDatePickerOpen(false)} 
                    onConfirm={(startDate, endDate) => {
                        setSelectedDates({ start: startDate, end: endDate });
                        setIsDatePickerOpen(false);
                    }}
                />
            )}
            {isFiltersOpen && (
                <FiltersModal 
                    onApply={(data)=>{
                    setFilters({
                        maximumPrice: data.maxPrice,
                        minExperience: data.minExperience,
                        verified: data.verified
                    });
                }} onClose={() => setIsFiltersOpen(false)} 
                    currentFilters={filters}
                />
            )}
        </div>
    )
}