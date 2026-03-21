"use client"
import { useState, useEffect, useCallback, useMemo } from "react";
import Navbar from '../../components/Navbar';
import CaretakerCard from '../../components/CaretakerCard'; // Importing your component
import { useAuth } from "@/hooks/useAuth";
import { useUsers } from "@/hooks/useUsers";
import { 
  MapPin, 
  Calendar, 
  Search,
  Maximize2
} from 'lucide-react';

// DUMMY DATA - Updated to match CaretakerCard props
interface Caregiver {
  id: string;
  name: string;
  location: string;
//   experience: string;
//   rating: number;
//   reviews: number;
  dailyRate: number;
//   imageUrl: string;
  verified: boolean;
//   petsHandled: string[];
}

export default function SearchCaregivers() {
    const { fetchCaregivers } = useUsers();
    const [allCaregivers, setAllCaregivers] = useState<Caregiver[]>([]);
    const [displayedCaregivers, setDisplayedCaregivers] = useState<Caregiver[]>([]);
    const [filters, setFilters] = useState({
        location: ""
    });
    const { user, loading: authLoading } = useAuth();
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
    const loadCaregivers = async () => {
      setLoading(true);
        try {
            const data = await fetchCaregivers(); // No params = all caregivers
            setAllCaregivers(data);
            setDisplayedCaregivers(data);
        } catch (error) {
            console.error('Failed to load caregivers:', error);
        } finally {
            setLoading(false);
        }
        };
        
        loadCaregivers();
    }, []);

    const filteredCaregivers = useMemo(() => {
        return allCaregivers.filter(caregiver => {
        // Location filter (case-insensitive)
        if (filters.location && !caregiver.location.toLowerCase().includes(filters.location.toLowerCase())) {
            return false;
        }
        
        // Pet type filter (check if caregiver handles pet type)
        // if (filters.petType && !caregiver.petsHandled.includes(filters.petType)) {
        //     return false;
        // }
        
        // // Rating filter
        // if (filters.minRating) {
        //     const minRating = parseFloat(filters.minRating);
        //     if (caregiver.rating < minRating) return false;
        // }
        
        // // Price filter
        // if (filters.minPrice || filters.maxPrice) {
        //     const minPrice = parseFloat(filters.minPrice) || 0;
        //     const maxPrice = parseFloat(filters.maxPrice) || Infinity;
        //     if (caregiver.price < minPrice || caregiver.price > maxPrice) {
        //     return false;
        //     }
        // }
        
        return true;
        });
    }, [allCaregivers, filters]);

    // useEffect(() => {
    //     const timeoutId = setTimeout(async () => {
    //     if (filters.location != "") {
    //         // Server-side search for complex filters
    //         setLoading(true);
    //         try {
    //         // const params = new URLSearchParams({
    //         //     location: filters.location,
    //         //     petType: filters.petType,
    //         //     ...(filters.minRating && { minRating: filters.minRating }),
    //         //     ...(filters.minPrice && { minPrice: filters.minPrice }),
    //         //     ...(filters.maxPrice && { maxPrice: filters.maxPrice })
    //         // });
            
    //         const data = await fetchCaregivers(filters);
    //         setDisplayedCaregivers(data);
    //         } catch (error) {
    //         console.error('Search failed:', error);
    //         } finally {
    //         setLoading(false);
    //         }
    //     } else {
    //         // No filters = show all
    //         setDisplayedCaregivers(allCaregivers);
    //     }
    //     }, 500); // Debounce 500ms

    //     return () => clearTimeout(timeoutId);
    // }, []);

    const handleFilterChange = useCallback( async() => {
        console.log('Applying filters:', filters);
        setLoading(true);
        try {
            console.log(filters.location)
            if (filters.location != "") {
                setLoading(true);
                const data = await fetchCaregivers(filters);
                console.log('Filtered caregivers:', data);
                setDisplayedCaregivers(data);
                }
            else {
                // No filters = show all
                console.log('No filters applied, showing all caregivers');
                setDisplayedCaregivers(allCaregivers);
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setFilters({location: ""});
            setLoading(false);
        }
        }, [filters, allCaregivers, fetchCaregivers]);

    if (loading) return <div>Loading...</div>;
    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            <Navbar />

            <main className="max-w-6xl mx-auto px-8 py-12">
                {/* HEADER SECTION - Size Increased */}
                <div className="mb-12">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight">Find Caregivers</h1>
                    <p className="text-base text-slate-500 mt-2 font-medium">
                        Discover trusted peers in your area based on your pet's specific needs.
                    </p>
                </div>

                {/* SEARCH & FILTER BAR - Size Increased */}
                <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-6 mb-12 flex flex-col lg:flex-row gap-5 items-center">
                    <div className="flex-1 w-full relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors">
                            <MapPin size={20} />
                        </span>
                        <input 
                            type="text" 
                            name="location"
                            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                            placeholder="Location or postal code..." 
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-base font-medium focus:outline-none focus:border-teal-500 focus:bg-white transition-all" 
                        />
                    </div>
                    <div className="flex-1 w-full relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors">
                            <Calendar size={20} />
                        </span>
                        <input 
                            type="text" 
                            placeholder="Select dates..." 
                            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-base font-medium focus:outline-none focus:border-teal-500 focus:bg-white transition-all" 
                        />
                    </div>
                    <button onClick={handleFilterChange} className="w-full lg:w-auto bg-teal-600 hover:bg-teal-700 text-white font-black uppercase tracking-widest text-xs py-4 px-10 rounded-2xl transition-all shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2 active:scale-95">
                        <Search size={16} strokeWidth={3} /> Search
                    </button>
                </div>

                {/* RESULTS HEADER - Size Increased */}
                <div className="flex justify-between items-center mb-8 px-2">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                        {displayedCaregivers.length} Caregivers available
                    </h2>
                    <button className="text-teal-600 text-base font-bold hover:text-teal-700 flex items-center gap-2 transition-colors">
                        <Maximize2 size={16} /> Expand Search Radius
                    </button>
                </div>

                {/* CAREGIVER GRID - Now using CaretakerCard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayedCaregivers.map(caregiver => (
                        <CaretakerCard 
                            id={caregiver.id}
                            key={caregiver.id}
                            name={caregiver.name}
                            location={caregiver.location}
                            experience={""}
                            rating={5}
                            reviews={5}
                            price={caregiver.dailyRate}
                            imageUrl="image"
                            isVerified={caregiver.verified}
                            petsHandled={["caregiver.petsHandled"]}
                        />
                    ))}
                </div>
            </main>
        </div>
    );
}