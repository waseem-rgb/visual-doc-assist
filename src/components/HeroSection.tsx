import { Button } from "@/components/ui/button";
import { ArrowRight, Stethoscope, Smartphone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-medical.jpg";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-subtle pt-20">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                Virtual Healthcare
                <br />
                <span className="gradient-text">Redefined</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                Get secure medical consultations by selecting symptoms from interactive body diagrams. 
                Login required for AI-powered prescriptions backed by real doctors.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="gradient-primary shadow-medium transition-bounce hover:shadow-large"
                  onClick={() => navigate("/customer/login")}
                >
                  Login/My Dashboard & Prescription Download
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-smooth"
                  onClick={() => navigate("/doctor/login")}
                >
                  For Healthcare Providers
                  <Stethoscope className="ml-2 h-5 w-5" />
                </Button>
            </div>

            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-success" />
                </div>
                <div>
                  <div className="font-semibold">Secure Access</div>
                  <div className="text-sm text-muted-foreground">Login required for consultations</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">Doctor Verified</div>
                  <div className="text-sm text-muted-foreground">AI + Human expertise</div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 gradient-primary rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
            <img
              src={heroImage}
              alt="VrDoc Virtual Healthcare Interface"
              className="relative rounded-3xl shadow-large transition-smooth hover:shadow-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;