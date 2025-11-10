import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ProcessSection from "@/components/landing/ProcessSection";
import ChatbotsShowcase from "@/components/landing/ChatbotsShowcase";
import StatsSection from "@/components/landing/StatsSection";
import TechnologySection from "@/components/landing/TechnologySection";
import InfoSection from "@/components/landing/InfoSection";
import GithubSection from "@/components/landing/GithubSection";
import Footer from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <Navbar />
      {/* Hero Section with background image and gradient */}
      <HeroSection />
      {/* Features Section */}
      <FeaturesSection />
      {/* Chatbots Showcase Section */}
      <ChatbotsShowcase />
      {/* Stats Section */}
      <StatsSection />
      {/* Technology Section */}
      <TechnologySection />
      {/* Process Section */}
      <ProcessSection />
      {/* Info Section */}
      <InfoSection />
      {/* Github Section */}
      <GithubSection />
      {/* Footer */}
      <Footer />
    </div>
  );
}
