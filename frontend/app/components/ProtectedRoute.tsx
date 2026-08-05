"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, Permission } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermissions?: Permission[];
  requiredRoles?: string[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredPermissions = [],
  requiredRoles = [],
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, hasAllPermissions, hasAnyPermission, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      // Check roles
      if (requiredRoles.length > 0) {
        const hasRole = requiredRoles.some(role => user?.role === role);
        if (!hasRole) {
          router.push('/unauthorized');
          return;
        }
      }

      // Check permissions
      if (requiredPermissions.length > 0) {
        const hasPermission = hasAllPermissions(requiredPermissions);
        if (!hasPermission) {
          router.push('/unauthorized');
          return;
        }
      }
    }
  }, [loading, isAuthenticated, router, redirectTo, requiredRoles, requiredPermissions, user, hasAllPermissions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
