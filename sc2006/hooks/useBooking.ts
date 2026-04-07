import { useState } from 'react';
import { Booking } from "@/app/generated/prisma/browser";

interface BookingFilters {
  caregiverId?: string | null;
  ownerId?: string | null;
  petId?: string | null;
}

export function useBooking() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBooking = async (filters?: BookingFilters ): Promise<Booking[]> => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams(filters as any);
      if (filters?.caregiverId) params.set('caregiverId', filters.caregiverId);
      if (filters?.ownerId) params.set('ownerId', filters.ownerId);
      if (filters?.petId) params.set('petId', filters.petId);
      
      const response = await fetch(`/api/booking?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch bookings');
      }
      
      const data = await response.json();
      
      return data.bookings;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: 'CONFIRMED' | 'DECLINED' | 'COMPLETED') => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/booking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, status }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.message ?? data.error ?? 'Failed to update booking';
        setError(msg);
        return null;
      }
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update booking';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createBooking = async (bookingData: any) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.message ?? data.error ?? 'Failed to create booking';
        setError(msg);
        return { success: false, error: msg, message: msg };
      }
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create booking';
      setError(msg);
      return { success: false, error: msg, message: msg };
    } finally {
      setLoading(false);
    }
  };


  return {
    loading,
    error,
    fetchBooking,
    createBooking,
    updateBookingStatus,
    
  };
}
