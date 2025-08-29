import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();

  const navItems = [
    { label: t('navigation.features'), href: "#features" },
    { label: t('navigation.howItWorks'), href: "#how-it-works" },
    { label: t('navigation.forDoctors'), href: "#doctors" },
    { label: t('navigation.contact'), href: "#contact" },
    { label: "🧪 Bhashini Test", href: "/bhashini-test", isRoute: true },
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
                onClick={item.isRoute ? () => window.location.href = item.href : undefined}
              >
                {item.label}
              </a>
            ))}
            <LanguageSwitcher variant="compact" />
            <Button 
              variant="default" 
              className="gradient-primary"
              onClick={() => window.location.href = "/customer/login"}
            >
              {t('navigation.loginSignUp')}
            </Button>
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
                  onClick={() => {
                    setIsMenuOpen(false);
                    if (item.isRoute) window.location.href = item.href;
                  }}
                >
                  {item.label}
                </a>
              ))}
              <div className="pt-2">
                <LanguageSwitcher />
              </div>
              <Button 
                variant="default" 
                className="gradient-primary w-full"
                onClick={() => window.location.href = "/customer/login"}
              >
                {t('navigation.loginSignUp')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;