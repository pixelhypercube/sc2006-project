import { useState } from 'react';

const PET_TYPE_LABELS: Record<string, string> = {
  DOG: 'Dogs',
  CAT: 'Cats',
  BIRD: 'Birds',
  REPTILE: 'Reptiles',
  SMALL_ANIMAL: 'Small Mammals',
  FISH: 'Fish',
};

interface Caregiver {
  id: string;
  name: string;
  location: string;
  dailyRate: number;
  rating: number;
  biography?: string;
  avatar?: string;
  verified: boolean;
  petPreferences?: string[];
  petsHandled: string[];
  bookings?: Array<{
    id: string;
    startDate: string;
    endDate: string;
    status: string;
  }>;
}

export function useUsers() {
//   const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCaregivers = async (filters?: {
    location?: string;
  }): Promise<Caregiver[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams(filters as any);
      const response = await fetch(`/api/caregivers?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch caregivers');
      }
      
      const data = await response.json();

      return data.caregivers.map((c: any) => ({
        id: c.id,
        name: c.name,
        location: c.location,
        dailyRate: c.dailyRate,
        verified: c.verified,
        experience: c.experienceYears || 0,
        rating: c.averageRating || 0,
        reviews: c.totalReviews || 0,
        price: c.dailyRate,
        imageUrl: c.user?.avatar ?? null,
        isVerified: c.verified,
        petPreferences: c.petPreferences ?? [],
        petsHandled: (c.petPreferences ?? []).map((petType: string) => PET_TYPE_LABELS[petType] ?? petType),
        services: c.services ?? [],
        locationCoords: c.user?.latitude && c.user?.longitude
          ? [c.user.latitude, c.user.longitude]
          : null,
        bookings: c.user?.caregiverBookings || [],
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const fetchCaregiver = async (id: string) => {
        const res = await fetch(`/api/caregivers/${id}`);
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
    };


  return {
    loading,
    error,
    fetchCaregiver,
    fetchCaregivers,
    refetch: () => fetchCaregivers(),
  };
}
