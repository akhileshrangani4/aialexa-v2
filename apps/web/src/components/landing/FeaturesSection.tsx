"use client";

import { motion } from "framer-motion";

export default function FeaturesSection() {
  const features = [
    {
      title: "Open Access",
      description:
        "Designed specifically for professors and students in higher education.",
    },
    {
      title: "Privacy Focused",
      description: "Your data stays yours. We don't use it to train any LLM.",
    },
    {
      title: "Open Source",
      description:
        "We only use open-source LLMs. Fully transparent code. Community-driven development.",
    },
  ];

  return (
    <section id="features" className="py-32 px-6 md:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-24 items-start">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
            className="md:sticky md:top-32"
          >
            <h2 className="text-4xl md:text-5xl font-serif font-light text-foreground mb-8 leading-[1.2]">
              Upload. Chat. Learn.
            </h2>
            <div className="space-y-6">
              <p className="text-foreground/80 text-lg md:text-xl leading-[1.7]">
                Use open-source, non-commercial large language models (LLMs) to
                transform your course materials into an open-access,
                multilingual chat experience.
              </p>
              <div className="flex flex-col gap-2 text-muted-foreground">
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                  No technical knowledge required
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                  Permanently free
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-foreground/40" />
                  Customize training data and behaviors
                </span>
              </div>
            </div>
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
