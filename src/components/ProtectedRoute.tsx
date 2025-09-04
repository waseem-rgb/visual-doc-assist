import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
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
  const [roleLoading, setRoleLoading] = useState(!!requireRole);
  const [hasRequiredRole, setHasRequiredRole] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user || !requireRole) {
        setRoleLoading(false);
        return;
      }

      try {
        const { data: roles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error checking user roles:', error);
          setHasRequiredRole(false);
        } else {
          const userHasRole = roles?.some(r => r.role === requireRole) || false;
          setHasRequiredRole(userHasRole);
        }
      } catch (error) {
        console.error('Error checking user roles:', error);
        setHasRequiredRole(false);
      } finally {
        setRoleLoading(false);
      }
    };

    checkUserRole();
  }, [user, requireRole]);

  if (loading || roleLoading) {
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
  if (requireRole && !hasRequiredRole) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};