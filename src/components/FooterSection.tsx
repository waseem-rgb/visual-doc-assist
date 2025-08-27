import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Phone, MapPin, ArrowRight } from "lucide-react";

const FooterSection = () => {
  return (
    <footer id="contact" className="bg-gradient-subtle pt-24 pb-12">
      <div className="container mx-auto px-6">
        {/* Newsletter Section */}
        <div className="text-center space-y-8 mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold">
            Stay Updated with
            <br />
            <span className="gradient-text">VrDoc</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get the latest updates on AI healthcare innovations and be the first to know 
            about new features and improvements.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
            <Input 
              placeholder="Enter your email" 
              className="flex-1 h-12 border-border/50 bg-background/50 backdrop-blur-sm"
            />
            <Button className="gradient-primary h-12 px-8">
              Subscribe
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Footer Content */}
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">V</span>
              </div>
              <span className="text-2xl font-bold gradient-text">VrDoc</span>
            </div>
            <p className="text-muted-foreground">
              Revolutionizing healthcare with AI-powered virtual consultations 
              and professional medical oversight.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Product</h3>
            <div className="space-y-2">
              <a href="#features" className="block text-muted-foreground hover:text-foreground transition-smooth">Features</a>
              <a href="#how-it-works" className="block text-muted-foreground hover:text-foreground transition-smooth">How It Works</a>
              <a href="#doctors" className="block text-muted-foreground hover:text-foreground transition-smooth">For Doctors</a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-smooth">Pricing</a>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Company</h3>
            <div className="space-y-2">
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-smooth">About Us</a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-smooth">Careers</a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-smooth">Privacy Policy</a>
              <a href="#" className="block text-muted-foreground hover:text-foreground transition-smooth">Terms of Service</a>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground">hello@vrdoc.com</span>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-muted-foreground">San Francisco, CA</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border/50 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-muted-foreground text-sm">
              © 2024 VrDoc. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-smooth text-sm">Privacy</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-smooth text-sm">Terms</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-smooth text-sm">Cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;