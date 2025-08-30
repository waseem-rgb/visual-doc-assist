import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Stethoscope, FileText, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useConsultationStore } from '@/store/consultationStore';

const tabs = [
  { 
    id: 'home', 
    label: 'Home', 
    icon: Home, 
    path: '/' 
  },
  { 
    id: 'consult', 
    label: 'Instant Consult', 
    icon: Stethoscope, 
    path: '/consultation' 
  },
  { 
    id: 'prescriptions', 
    label: 'Prescriptions', 
    icon: FileText, 
    path: '/customer/dashboard' 
  },
  { 
    id: 'profile', 
    label: 'Profile', 
    icon: User, 
    path: '/customer/login' 
  },
];

export function BottomTabNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetConsultation } = useConsultationStore();
  
  const handleTabClick = (tab: typeof tabs[0]) => {
    if (tab.id === 'consult') {
      // Reset consultation store before starting new consultation
      resetConsultation();
      navigate(tab.path);
    }
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          
          // Special handling for consultation tab
          if (tab.id === 'consult') {
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                className={cn(
                  "flex flex-col items-center justify-center min-h-[56px] px-3 py-1 rounded-lg transition-all duration-200",
                  "touch-manipulation select-none",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 mb-1 transition-transform",
                  isActive && "scale-110"
                )} />
                <span className={cn(
                  "text-xs font-medium leading-tight",
                  isActive && "text-primary"
                )}>
                  {tab.label}
                </span>
              </button>
            );
          }
          
          // Regular NavLink for other tabs
          return (
            <NavLink
              key={tab.id}
              to={tab.path}
              className={cn(
                "flex flex-col items-center justify-center min-h-[56px] px-3 py-1 rounded-lg transition-all duration-200",
                "touch-manipulation select-none",
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className={cn(
                "h-5 w-5 mb-1 transition-transform",
                isActive && "scale-110"
              )} />
              <span className={cn(
                "text-xs font-medium leading-tight",
                isActive && "text-primary"
              )}>
                {tab.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}