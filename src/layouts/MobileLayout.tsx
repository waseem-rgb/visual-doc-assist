import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BottomTabNav } from '@/components/navigation/BottomTabNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: ReactNode;
  title?: string;
  showBackButton?: boolean;
  hideBottomNav?: boolean;
  className?: string;
}

export function MobileLayout({
  children,
  title,
  showBackButton = false,
  hideBottomNav = false,
  className
}: MobileLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  // If not mobile, render children without mobile wrapper
  if (!isMobile) {
    return <>{children}</>;
  }

  const getPageTitle = () => {
    if (title) return title;
    
    switch (location.pathname) {
      case '/': return 'MediConsult AI';
      case '/consultation': return 'New Consultation';
      case '/customer/dashboard': return 'My Prescriptions';
      case '/customer/login': return 'Profile';
      case '/doctor/login': return 'Doctor Login';
      case '/doctor/dashboard': return 'Doctor Dashboard';
      default: return 'MediConsult AI';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Mobile Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="flex items-center justify-between px-4 py-3 h-14">
          {showBackButton ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2 h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          ) : (
            <div className="w-10" />
          )}
          
          <h1 className="text-lg font-semibold text-center flex-1 truncate px-2">
            {getPageTitle()}
          </h1>
          
          <div className="w-10" />
        </div>
      </header>

      {/* Main Content */}
      <main className={cn(
        "flex-1 overflow-auto",
        !hideBottomNav && "pb-20", // Account for bottom nav
        className
      )}>
        {children}
      </main>

      {/* Bottom Navigation */}
      {!hideBottomNav && <BottomTabNav />}
    </div>
  );
}