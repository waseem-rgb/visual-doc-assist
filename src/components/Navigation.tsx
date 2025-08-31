import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "For Doctors", href: "#doctors" },
    { label: "Contact", href: "#contact" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">V</span>
            </div>
            <span className="text-2xl font-bold gradient-text">VrDoc</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-smooth"
              >
                {item.label}
              </a>
            ))}
            <div className="flex items-center gap-3">
              <Button 
                variant="outline"
                onClick={() => navigate("/customer/login")}
              >
                Patient Login
              </Button>
              <Button 
                variant="default" 
                className="gradient-primary"
                onClick={() => navigate("/doctor/login")}
              >
                Doctor Login
              </Button>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-smooth"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
               <div className="flex flex-col gap-2">
                 <Button 
                   variant="outline" 
                   className="w-full"
                   onClick={() => {
                     navigate("/customer/login");
                     setIsMenuOpen(false);
                   }}
                 >
                   Patient Login
                 </Button>
                 <Button 
                   variant="default" 
                   className="gradient-primary w-full"
                   onClick={() => {
                     navigate("/doctor/login");
                     setIsMenuOpen(false);
                   }}
                 >
                   Doctor Login
                 </Button>
               </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;