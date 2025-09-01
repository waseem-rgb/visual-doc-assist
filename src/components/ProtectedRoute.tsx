import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Heart } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  requireRole?: 'doctor' | 'customer';
}

export const ProtectedRoute = ({ 
  children, 
  redirectTo = '/customer/login',
  requireRole 
}: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/10">
        <div className="text-center">
          <div className="animate-pulse mb-4">
            <Heart className="h-12 w-12 text-primary mx-auto" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={redirectTo} replace />;
  }

  // If a specific role is required, check for it
  if (requireRole) {
    // For now, we'll assume role checking is handled by individual dashboard components
    // since we need async role checking from the database
  }

  return <>{children}</>;
};