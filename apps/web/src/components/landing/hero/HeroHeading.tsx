"use client";

import { motion } from "framer-motion";
import { MUTED_GREEN } from "./constants";

interface HeroHeadingProps {
  delay?: number;
}

export default function HeroHeading({ delay = 0.2 }: HeroHeadingProps) {
  return (
    <motion.h1
      className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-8 leading-tight"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
    >
      <span className="text-black">Teach </span>
      <span
        className="italic"
        style={{
          color: MUTED_GREEN,
          fontFamily: "var(--font-instrument-serif), serif",
          fontWeight: 400,
        }}
      >
        anything.
      </span>
    </motion.h1>
  );
}
