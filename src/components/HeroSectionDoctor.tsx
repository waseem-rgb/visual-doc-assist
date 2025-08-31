import { Button } from "@/components/ui/button";
import { ArrowRight, Stethoscope, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-medical.jpg";

const HeroSectionDoctor = () => {
  const navigate = useNavigate();

  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-subtle pt-20">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                Healthcare Provider
                <br />
                <span className="gradient-text">Dashboard</span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                Manage patient consultations, conduct video calls, and provide AI-assisted diagnoses. 
                Secure platform for healthcare professionals.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="gradient-primary shadow-medium transition-bounce hover:shadow-large"
                onClick={() => navigate("/login")}
              >
                Doctor Login
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-success" />
                </div>
                <div>
                  <div className="font-semibold">Professional Tools</div>
                  <div className="text-sm text-muted-foreground">Video consultations & AI assistance</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">Patient Management</div>
                  <div className="text-sm text-muted-foreground">Secure consultations & records</div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 gradient-primary rounded-3xl blur-3xl opacity-20 animate-pulse"></div>
            <img
              src={heroImage}
              alt="VrDoc Healthcare Provider Interface"
              className="relative rounded-3xl shadow-large transition-smooth hover:shadow-xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSectionDoctor;