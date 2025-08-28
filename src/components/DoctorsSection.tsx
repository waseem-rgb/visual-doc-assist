import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { 
  Stethoscope, 
  BookOpen, 
  TrendingUp, 
  Users,
  ArrowRight
} from "lucide-react";

const DoctorsSection = () => {
  const navigate = useNavigate();
  
  const benefits = [
    {
      icon: Stethoscope,
      title: "Streamlined Consultations",
      description: "Review AI-generated assessments and approve prescriptions efficiently."
    },
    {
      icon: BookOpen,
      title: "Continuous Learning", 
      description: "Help train our AI system with your medical expertise and feedback."
    },
    {
      icon: TrendingUp,
      title: "Enhanced Accuracy",
      description: "Improve diagnostic accuracy over time through machine learning integration."
    },
    {
      icon: Users,
      title: "Expanded Reach",
      description: "Serve more patients while maintaining quality care standards."
    }
  ];

  return (
    <section id="doctors" className="py-24 bg-background">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-bold">
                Empowering
                <br />
                <span className="gradient-text">Healthcare Providers</span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Join our network of healthcare professionals using AI to enhance 
                patient care while reducing consultation time and improving diagnostic accuracy.
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center mt-1">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-semibold text-lg">Reduced Administrative Burden</h4>
                  <p className="text-muted-foreground">Focus on complex cases while AI handles routine consultations</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mt-1">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-semibold text-lg">Quality Assurance</h4>
                  <p className="text-muted-foreground">Maintain oversight and approval over all AI-generated recommendations</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center mt-1">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div>
                  <h4 className="font-semibold text-lg">Professional Development</h4>
                  <p className="text-muted-foreground">Contribute to advancing AI in healthcare while expanding your practice</p>
                </div>
              </div>
            </div>

            <Button 
              size="lg" 
              className="gradient-primary shadow-medium transition-bounce hover:shadow-large"
              onClick={() => navigate("/doctor/login")}
            >
              Join Our Network
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <Card 
                key={index}
                className="border-0 shadow-soft hover:shadow-medium transition-smooth bg-card/50 backdrop-blur-sm"
              >
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="w-12 h-12 gradient-primary rounded-2xl flex items-center justify-center">
                      <benefit.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">{benefit.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DoctorsSection;