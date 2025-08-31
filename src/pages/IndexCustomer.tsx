import Navigation from "@/components/Navigation";
import HeroSectionCustomer from "@/components/HeroSectionCustomer";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorks from "@/components/HowItWorks";
import FooterSection from "@/components/FooterSection";

const IndexCustomer = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSectionCustomer />
      <FeaturesSection />
      <HowItWorks />
      <FooterSection />
    </div>
  );
};

export default IndexCustomer;