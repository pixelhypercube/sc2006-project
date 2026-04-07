'use client';

/**
 * Protects routes client-side with role-based access control.
 * 
 * @example Basic usage (any authenticated user)
 * ```tsx
 * <ProtectedRoute>
 *   <div>Your protected content</div>
 * </ProtectedRoute>
 * ```
 * 
 * @example Pet Owner dashboard only
 * ```tsx
 * <ProtectedRoute allowedRoles={['OWNER']}>
 *   <PetOwnerDashboard />
 * </ProtectedRoute>
 * ```
 * 
 * @example Admin panel (ADMIN only)
 * ```tsx
 * <ProtectedRoute allowedRoles={['ADMIN']}>
 *   <AdminPanel />
 * </ProtectedRoute>
 * ```
 * 
 * @example Caregiver dashboard (CAREGIVER + ADMIN)
 * ```tsx
 * <ProtectedRoute allowedRoles={['CAREGIVER', 'ADMIN']}>
 *   <CaregiverDashboard />
 * </ProtectedRoute>
 * ```
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'OWNER' | 'CAREGIVER' | 'ADMIN'>;
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (allowedRoles && !allowedRoles.includes(user?.role as any)) {
        // Redirect to appropriate dashboard based on role
        if (user?.role === 'CAREGIVER') {
          router.push('/caregiver');
        } else {
          router.push('/');
        }
      }
    }
  }, [loading, isAuthenticated, user, allowedRoles, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role as any)) {
    return null;
  }

  return <>{children}</>;
}