import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pet } from "@/app/generated/prisma/browser";

interface UsePetsOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function usePets() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch all pets for current user
  const fetchPets = async (): Promise<Pet[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/pets');
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch pets');
      }
      
      const data = await response.json();
      return data.pets;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pets');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fetch single pet by ID
  const fetchPet = async (petId: string): Promise<Pet | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/pets/${petId}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch pet');
      }
      
      const data = await response.json();
      return data.pet;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pet');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Create new pet
  const createPet = async (petData: FormData | any, options?: UsePetsOptions) => {
    try {
      setLoading(true);
      setError(null);

      const isFormData = petData instanceof FormData;
      
      const response = await fetch('/api/pets', {
        method: 'POST',
        headers: isFormData ? {} : { 'Content-Type': 'application/json' },
        body: isFormData ? petData : JSON.stringify(petData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to create pet');
      }

      options?.onSuccess?.();
      router.refresh(); // Refresh server components
      return data.pet;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create pet';
      setError(errorMessage);
      options?.onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update pet
  const updatePet = async (petId: string, petData: Partial<Pet>, options?: UsePetsOptions) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/pets/${petId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(petData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to update pet');
      }

      options?.onSuccess?.();
      router.refresh();
      return data.pet;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update pet';
      setError(errorMessage);
      options?.onError?.(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Delete pet
  const deletePet = async (petId: string, options?: UsePetsOptions) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/pets/${petId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete pet');
      }

      options?.onSuccess?.();
      router.refresh();
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete pet';
      setError(errorMessage);
      options?.onError?.(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Upload pet photo
  const uploadPhoto = async (petId: string, file: File): Promise<string | null> => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch(`/api/pets/${petId}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload photo');
      }

      router.refresh();
      return data.photoUrl;

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Get pet types (for dropdown)
  const getPetTypes = () => {
    return [
      { value: 'DOG', label: 'Dog 🐕' },
      { value: 'CAT', label: 'Cat 🐈' },
      { value: 'BIRD', label: 'Bird 🐦' },
      { value: 'FISH', label: 'Fish 🐠' },
      { value: 'REPTILE', label: 'Reptile 🦎' },
      { value: 'SMALL_ANIMAL', label: 'Small Animal 🐹' },
      { value: 'OTHER', label: 'Other 🐾' },
    ];
  };

  return {
    loading,
    error,
    fetchPets,
    fetchPet,
    createPet,
    updatePet,
    deletePet,
    uploadPhoto,
    getPetTypes,
  };
}