import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ImageSection from "@/components/landing/ImageSection";
import StatsSection from "@/components/landing/StatsSection";
import TechnologySection from "@/components/landing/TechnologySection";
import ProcessSection from "@/components/landing/ProcessSection";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <Navbar />
      {/* Hero Section */}
      <HeroSection />
      {/* Features Section */}
      <FeaturesSection />
      {/* Image Section */}
      <ImageSection />
      {/* Stats Section */}
      <StatsSection />
      {/* Technology Section */}
      <TechnologySection />
      {/* Process Section */}
      <ProcessSection />
      {/* CTA Section */}
      <CTASection />
      {/* Footer */}
      <Footer />
    </div>
  );
}
