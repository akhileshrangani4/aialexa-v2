"use client";

import Link from "next/link";
import Image from "next/image";
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

  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const href = e.currentTarget.getAttribute("href");
    if (href && href.startsWith("#")) {
      e.preventDefault();
      const id = href.slice(1);
      const element = document.getElementById(id);
      if (element) {
        const offset = 80; // Account for fixed navbar
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-3 px-4 md:px-6">
      <div
        className={`w-full max-w-7xl mx-auto transition-all duration-500 ease-out ${
          scrolled
            ? "bg-white/15 backdrop-blur-xl rounded-full shadow-lg border border-white/30"
            : "bg-transparent"
        }`}
      >
        <div className="px-8 lg:px-16">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link
                href="/"
                className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-200"
              >
                <Image
                  src="/logo.svg"
                  alt="AIAlexa"
                  width={32}
                  height={32}
                  className="h-8 w-8"
                  priority
                />
                <span className="text-xl font-base font-bold text-foreground">
                  AI Alexa
                </span>
              </Link>
            </div>

            {/* Navigation Links - Center */}
            <div className="hidden md:flex items-center space-x-8 absolute left-1/2 transform -translate-x-1/2">
              <Link
                href="#features"
                onClick={handleAnchorClick}
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors duration-200"
              >
                Features
              </Link>
              <Link
                href="#how-it-works"
                onClick={handleAnchorClick}
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors duration-200"
              >
                How It Works
              </Link>
              <Link
                href="#github"
                onClick={handleAnchorClick}
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors duration-200"
              >
                Support Us
              </Link>
              <a
                href={process.env.NEXT_PUBLIC_GITHUB_URL || "#github"}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors duration-200"
              >
                GitHub
              </a>
            </div>

            {/* Sign In and Sign Up - Upper Right */}
            <div className="flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors duration-200"
              >
                Sign In
              </Link>
              <Button
                asChild
                className="bg-white hover:bg-white/90 text-foreground px-5 py-2 text-sm rounded-lg font-medium border border-foreground/20 transition-all duration-200"
              >
                <Link href="/register">Sign Up</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
