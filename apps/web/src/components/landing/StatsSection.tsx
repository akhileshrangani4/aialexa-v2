"use client";

import { motion } from "framer-motion";

export default function StatsSection() {
  const stats = [
    { number: "100%", label: "Free Forever" },
    { number: "0", label: "Tracking Cookies" },
    { number: "∞", label: "Chatbots" },
    { number: "4", label: "AI Models" },
  ];

  return (
    <section className="py-32 px-6 md:px-12 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-serif font-light text-foreground mb-6">
            Always free. Always open.
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            No hidden costs, no premium tiers, no vendor lock-in.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="text-5xl md:text-6xl font-serif font-light text-foreground mb-3">
                {stat.number}
              </div>
              <div className="text-muted-foreground text-sm uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
