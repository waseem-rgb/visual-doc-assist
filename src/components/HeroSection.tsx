import { Button } from "@/components/ui/button";
import { ArrowRight, Stethoscope, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section 
      className="min-h-screen flex items-center justify-center pt-20 relative"
      style={{
        backgroundImage: `url('/lovable-uploads/1fc5d967-e004-4f91-b641-b8986e5eab63.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="container mx-auto px-6 relative z-10 flex items-center min-h-screen">
        <div className="max-w-2xl text-left space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight text-white">
              Virtual Healthcare
              <br />
              <span className="text-pink-300">Redefined</span>
            </h1>
            <p className="text-lg text-white/90 leading-relaxed">
              Get secure medical consultations by selecting symptoms from interactive body diagrams. 
              Login required for AI-powered prescriptions backed by real doctors.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              className="bg-pink-600 hover:bg-pink-700 text-white shadow-lg"
              onClick={() => navigate("/customer/login")}
            >
              Login/My Dashboard & Prescription Download
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-white text-white hover:bg-white hover:text-pink-600"
              onClick={() => navigate("/doctor/login")}
            >
              For Healthcare Providers
              <Stethoscope className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-semibold text-white">Secure Access</div>
                <div className="text-sm text-white/80">Login required for consultations</div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-semibold text-white">Doctor Verified</div>
                <div className="text-sm text-white/80">AI + Human expertise</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;