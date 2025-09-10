import { Button } from "@/components/ui/button";
import { ArrowRight, Stethoscope, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImageMobile from "@/assets/hero-medical-mobile.jpg";
import heroImageTablet from "@/assets/hero-medical-tablet.jpg";
import heroImageDesktop from "@/assets/hero-medical-desktop.jpg";
import heroImage from "@/assets/hero-medical.jpg";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-subtle pt-20">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight">
                Virtual Healthcare
                <br />
                <span className="gradient-text">Redefined</span>
              </h1>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-lg">
                Get secure medical consultations by selecting symptoms from interactive body diagrams. 
                Login required for AI-powered prescriptions backed by real doctors.
              </p>
            </div>

            <div className="flex flex-col gap-4 max-w-md">
              <Button 
                size="lg" 
                className="gradient-primary shadow-medium transition-bounce hover:shadow-large w-full text-sm sm:text-base"
                onClick={() => navigate("/customer/login")}
              >
                <span className="hidden sm:inline">Login/My Dashboard & Prescription Download</span>
                <span className="sm:hidden">Patient Login & Dashboard</span>
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-primary bg-background text-primary hover:bg-primary hover:text-primary-foreground transition-smooth w-full text-sm sm:text-base"
                onClick={() => navigate("/doctor/login")}
              >
                For Healthcare Providers
                <Stethoscope className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-success/10 rounded-full flex items-center justify-center">
                  <Smartphone className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
                </div>
                <div>
                  <div className="font-semibold text-sm sm:text-base">Secure Access</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">Login required for consultations</div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Stethoscope className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-sm sm:text-base">Doctor Verified</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">AI + Human expertise</div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 gradient-primary rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
            <img
              src={heroImageDesktop}
              srcSet={`${heroImageMobile} 640w, ${heroImageTablet} 800w, ${heroImageDesktop} 1200w`}
              sizes="(max-width: 640px) 640px, (max-width: 1024px) 800px, 1200px"
              alt="VrDoc Virtual Healthcare Interface"
              className="relative rounded-3xl shadow-large transition-smooth hover:shadow-xl"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;