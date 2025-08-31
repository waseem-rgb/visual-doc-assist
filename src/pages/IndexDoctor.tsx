import Navigation from "@/components/Navigation";
import HeroSectionDoctor from "@/components/HeroSectionDoctor";
import DoctorsSection from "@/components/DoctorsSection";
import FooterSection from "@/components/FooterSection";

const IndexDoctor = () => {
  return (
    <div className="min-h-screen">
      <Navigation />
      <HeroSectionDoctor />
      <DoctorsSection />
      <FooterSection />
    </div>
  );
};

export default IndexDoctor;