import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StickyFooterActionsProps {
  onBack?: () => void;
  onNext?: () => void;
  backLabel?: string;
  nextLabel?: string;
  nextDisabled?: boolean;
  loading?: boolean;
  className?: string;
  children?: ReactNode;
  nextVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
}

export function StickyFooterActions({
  onBack,
  onNext,
  backLabel = "Back",
  nextLabel = "Continue",
  nextDisabled = false,
  loading = false,
  className,
  children,
  nextVariant = "default"
}: StickyFooterActionsProps) {
  return (
    <div className={cn(
      "sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
      "border-t border-border p-4 safe-area-inset-bottom",
      className
    )}>
      {children && (
        <div className="mb-4">
          {children}
        </div>
      )}
      
      <div className="flex items-center justify-between gap-3">
        {onBack ? (
          <Button
            variant="outline"
            onClick={onBack}
            disabled={loading}
            className="flex-1 max-w-32"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {backLabel}
          </Button>
        ) : (
          <div />
        )}
        
        {onNext && (
          <Button
            variant={nextVariant}
            onClick={onNext}
            disabled={nextDisabled || loading}
            className="flex-1 min-h-[44px]"
          >
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent mr-2" />
            ) : (
              <>
                {nextLabel}
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}