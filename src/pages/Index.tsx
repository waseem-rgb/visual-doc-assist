import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorks from "@/components/HowItWorks";
import DoctorsSection from "@/components/DoctorsSection";
import FooterSection from "@/components/FooterSection";
import { useConsultationImport } from "@/hooks/useConsultationImport";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { isImporting } = useConsultationImport();

  if (isImporting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Importing Consultation</h2>
          <p className="text-muted-foreground">Please wait while we process the consultation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <DoctorsSection />
      <FooterSection />
    </div>
  );
};

export default Index;
