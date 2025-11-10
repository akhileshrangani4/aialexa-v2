"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { UNIVERSITIES } from "./constants";

interface UsedBySectionProps {
  delay?: number;
}

export default function UsedBySection({ delay = 0.6 }: UsedBySectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay }}
      className="w-full pb-8 md:pb-12"
    >
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 px-4">
        <p className="text-sm font-medium text-black/70 whitespace-nowrap z-10">
          Trusted By Professors At
        </p>

        <div className="flex items-center gap-6 md:gap-8 lg:gap-10 flex-wrap justify-center">
          {UNIVERSITIES.map((university, index) => (
            <motion.div
              key={university.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              transition={{ duration: 0.6, delay: delay + index * 0.1 }}
              whileHover={{ opacity: 1, scale: 1.05 }}
              className="transition-all duration-300 flex-shrink-0 px-2"
            >
              <Image
                src={university.logo}
                alt={university.name}
                width={120}
                height={35}
                className="h-7 md:h-8 w-auto object-contain transition-transform duration-300 drop-shadow-sm"
                quality={95}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
