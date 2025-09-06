import { Card, CardContent } from "@/components/ui/card";
import { 
  Smartphone, 
  Brain, 
  Clock, 
  Shield, 
  Users, 
  TrendingUp 
} from "lucide-react";

const FeaturesSection = () => {
  const features = [
    {
      icon: Smartphone,
      title: "Interactive Body Mapping",
      description: "Select symptoms directly from detailed body diagrams. Intuitive interface makes describing your condition effortless."
    },
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description: "Advanced machine learning algorithms analyze your symptoms and provide preliminary assessments instantly."
    },
    {
      icon: Clock,
      title: "Instant Prescriptions",
      description: "Get treatment recommendations immediately, with doctor verification for complex cases."
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your health data is encrypted and protected. Complete privacy compliance with healthcare standards."
    },
    {
      icon: Users,
      title: "Doctor Network",
      description: "Connected to licensed healthcare providers who review and approve all AI-generated prescriptions."
    },
    {
      icon: TrendingUp,
      title: "Learning System",
      description: "Our AI continuously learns from doctor feedback to provide increasingly accurate recommendations."
    }
  ];

  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="text-center space-y-4 mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
            Revolutionary Healthcare
            <br />
            <span className="gradient-text">At Your Fingertips</span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Experience the future of medical consultations with our AI-powered platform 
            that combines instant access with professional medical oversight.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="border-0 shadow-soft hover:shadow-medium transition-smooth bg-card/50 backdrop-blur-sm"
            >
              <CardContent className="p-6 sm:p-8">
                <div className="space-y-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 gradient-primary rounded-2xl flex items-center justify-center">
                    <feature.icon className="h-6 w-6 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold">{feature.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;