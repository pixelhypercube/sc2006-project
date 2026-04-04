import { useState } from 'react';

interface Caregiver {
  id: string;
  name: string;
  location: string;
  dailyRate: number;
  rating: number;
  biography?: string;
  avatar?: string;
  verified: boolean;
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

      // flatten user.avatar → imageUrl
      return data.caregivers.map((c: any) => ({
        ...c,
        imageUrl: c.user?.avatar ?? null,
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
