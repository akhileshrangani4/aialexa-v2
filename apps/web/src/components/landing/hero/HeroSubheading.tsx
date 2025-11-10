"use client";

import { motion } from "framer-motion";

interface HeroSubheadingProps {
  delay?: number;
  text?: string;
}

export default function HeroSubheading({
  delay = 0.4,
  text = "Build course-specific AI chatbots for your students. Upload materials, customize responses, and enhance learning—all for free.",
}: HeroSubheadingProps) {
  return (
    <motion.p
      className="text-base md:text-lg lg:text-xl mb-8 leading-relaxed max-w-2xl mx-auto font-normal text-black"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
    >
      {text}
    </motion.p>
  );
}
