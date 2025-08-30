import { TeleconsultationBooking } from '@/components/TeleconsultationBooking';
import { MobileLayout } from '@/layouts/MobileLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TeleconsultationBookingPage() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  const handleBookingSuccess = () => {
    navigate('/customer/dashboard');
  };

  if (isMobile) {
    return (
      <MobileLayout 
        title="Book Teleconsultation"
        showBackButton={true}
        hideBottomNav={true}
      >
        <TeleconsultationBooking onBookingSuccess={handleBookingSuccess} />
      </MobileLayout>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto pt-20">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <TeleconsultationBooking onBookingSuccess={handleBookingSuccess} />
      </div>
    </div>
  );
}