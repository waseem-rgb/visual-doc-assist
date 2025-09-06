import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      step: "01",
      title: "Select Body Part",
      description: "Choose the affected area from our interactive body diagram to focus your consultation.",
      color: "bg-primary"
    },
    {
      step: "02", 
      title: "Describe Symptoms",
      description: "Pick from a comprehensive list of symptoms related to your selected body part.",
      color: "bg-primary",
    },
    {
      step: "03",
      title: "AI Analysis",
      description: "Our advanced AI analyzes your symptoms and generates preliminary treatment recommendations.",
      color: "bg-success"
    },
    {
      step: "04",
      title: "Doctor Review",
      description: "Licensed physicians review AI recommendations and provide final prescription approval.",
      color: "bg-orange-500"
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-gradient-subtle">
      <div className="container mx-auto px-6">
        <div className="text-center space-y-4 mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            How <span className="gradient-text">VrDoc</span> Works
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Simple, fast, and reliable. Get medical guidance in four easy steps 
            with our streamlined consultation process.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <Card className="border-0 shadow-soft hover:shadow-medium transition-smooth bg-card/80 backdrop-blur-sm">
                <CardContent className="p-6 sm:p-8">
                  <div className="space-y-4 sm:space-y-6">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 ${step.color} rounded-xl flex items-center justify-center`}>
                        <span className="text-white font-bold text-base sm:text-lg">{step.step}</span>
                      </div>
                      {index < steps.length - 1 && (
                        <ArrowRight className="hidden lg:block text-muted-foreground h-5 w-5" />
                      )}
                    </div>
                    <div className="space-y-2 sm:space-y-3">
                      <h3 className="text-lg sm:text-xl font-semibold">{step.title}</h3>
                      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;