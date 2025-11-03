"use client";

import { motion } from "framer-motion";

export default function FeaturesSection() {
  const features = [
    {
      title: "Built for Educators",
      description:
        "Designed specifically for professors and students in higher education.",
    },
    {
      title: "Privacy Focused",
      description:
        "Your data stays yours. We don't train on your materials or sell information.",
    },
    {
      title: "Open Source",
      description:
        "Fully transparent code. Self-host if you want. Community-driven development.",
    },
  ];

  return (
    <section className="py-32 px-6 md:px-12 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-20 items-start">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl md:text-5xl font-serif font-light text-foreground mb-6 leading-tight">
              Upload. Chat. Learn.
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Transform your course materials into an intelligent assistant. No
              setup, no hassle, no cost.
            </p>
          </motion.div>

          <motion.div
            className="space-y-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            {features.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
              >
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
