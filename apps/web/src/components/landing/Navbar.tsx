"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-200"
          : "bg-white"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Left side - empty for balance */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-foreground hover:text-muted-foreground transition-colors">
              AI Alexa
            </Link>
          </div>

          {/* Navigation Links - Center */}
          <div className="hidden md:flex items-center space-x-10">
            <Link
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm font-medium"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm font-medium"
            >
              How It Works
            </Link>
            <Link
              href="#documentation"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm font-medium"
            >
              Documentation
            </Link>
            <Link
              href="#support"
              className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm font-medium"
            >
              Support Us
            </Link>
          </div>

          {/* Sign In Button - Upper Right */}
          <div className="flex items-center">
            <Button 
              asChild 
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 text-sm rounded-full font-medium"
            >
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

