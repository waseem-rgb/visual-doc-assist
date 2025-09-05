import { Button } from "@/components/ui/button";
import { ArrowRight, Stethoscope, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section 
      className="min-h-screen flex items-center justify-between relative overflow-hidden"
      style={{
        backgroundImage: `url('/lovable-uploads/1fc5d967-e004-4f91-b641-b8986e5eab63.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent"></div>
      
      {/* Left side - Content */}
      <div className="container mx-auto px-6 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-screen">
        <div className="space-y-6">
          <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-white">
            Virtual Healthcare
            <br />
            <span className="text-pink-300">Redefined</span>
          </h1>
          
          <p className="text-lg text-white/90 leading-relaxed max-w-md">
            Get secure medical consultations by selecting symptoms from interactive body diagrams. 
            Login required for AI-powered prescriptions backed by real doctors.
          </p>

          <div className="flex flex-col gap-4 max-w-md">
            <Button 
              size="lg" 
              className="bg-pink-600 hover:bg-pink-700 text-white shadow-lg w-full justify-between"
              onClick={() => navigate("/customer/login")}
            >
              Login/My Dashboard & Prescription Download
              <ArrowRight className="h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-pink-600 w-full justify-between"
              onClick={() => navigate("/doctor/login")}
            >
              For Healthcare Providers
              <Stethoscope className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Smartphone className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-white text-sm">Secure Access</div>
                <div className="text-xs text-white/80">Login required for consultations</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="font-semibold text-white text-sm">Doctor Verified</div>
                <div className="text-xs text-white/80">AI + Human expertise</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - Image area (handled by background) */}
        <div className="hidden lg:block"></div>
      </div>
    </section>
  );
};

export default HeroSection;