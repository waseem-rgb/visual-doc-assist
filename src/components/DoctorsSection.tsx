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
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
                Empowering
                <br />
                <span className="gradient-text">Healthcare Providers</span>
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed">
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

            <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-primary">
              <p className="text-sm text-muted-foreground">
                <strong>Healthcare Providers:</strong> Our network is invitation-only to ensure 
                quality care. Qualified doctors are onboarded through our administrative process. 
                If you're interested in joining, please reach out through official channels.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {benefits.map((benefit, index) => (
              <Card 
                key={index}
                className="border-0 shadow-soft hover:shadow-medium transition-smooth bg-card/50 backdrop-blur-sm"
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="space-y-3 sm:space-y-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 gradient-primary rounded-2xl flex items-center justify-center">
                      <benefit.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <h3 className="font-semibold text-base sm:text-lg">{benefit.title}</h3>
                      <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
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