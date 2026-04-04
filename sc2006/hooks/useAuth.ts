// hooks/useAuth.ts
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { PetType, DogSize, ServiceType } from '@/app/generated/prisma/client';
import { User } from '@/app/generated/prisma/client';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  async function fetchUser(retry = true) {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else if (res.status === 401 && retry) {
        const refreshed = await refreshToken();
        if (refreshed) {
          await fetchUser(false);
        } else {
          setUser(null);
          // router.push('/');
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }



  async function login(identifier: string, password: string, rememberMe = false) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, rememberMe }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await res.json();
      setUser(data.user);
      return data;
    } catch (error: any) {
      setUser(null);
      throw error;
    }
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      // Clear cookies client-side
      document.cookie = 'access_token=; Max-Age=0; path=/';
      document.cookie = 'refresh_token=; Max-Age=0; path=/';
      document.cookie = 'user=; Max-Age=0; path=/';
      router.push('/logout');
    }
  }

  async function refreshToken() {
    try {
      const res = await fetch('/api/auth/refresh', { 
        method: 'POST',
        credentials: 'include' // Include cookies
      });
      
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        return true;
      }
      return false;
    } catch {
      setUser(null);
      return false;
    }
  }


  return {
    user,
    loading,
    login,
    logout,
    refreshToken,
    //withAuthRefresh, // Use for protected API calls
    isAuthenticated: !!user,
    isOwner: user?.role === 'OWNER',
    isCaregiver: user?.role === 'CAREGIVER',
    isAdmin: user?.role === 'ADMIN',
  };
}