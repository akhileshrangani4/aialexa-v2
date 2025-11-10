"use client";

import { motion } from "framer-motion";

export default function TechnologySection() {
  const techFeatures = [
    {
      title: "RAG-Powered Accuracy",
      description: "Responses grounded in your uploaded materials",
    },
    {
      title: "Multiple open-source LLMs",
      description: "Choose from leading open-source language models",
    },
    {
      title: "Fast & Reliable",
      description: "Built on modern serverless infrastructure",
    },
  ];

  return (
    <section className="py-32 px-6 md:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-4xl md:text-5xl font-serif font-light text-foreground mb-6 leading-tight">
              Built on modern infrastructure.
            </h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
              Powered by cutting-edge open-source LLMs and retrieval-augmented
              generation. Your chatbots understand context and provide accurate,
              source-based answers.
            </p>
            <div className="space-y-4">
              {techFeatures.map((feature) => (
                <div key={feature.title} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div>
                    <p className="text-foreground font-medium">
                      {feature.title}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7 }}
          >
            <motion.div
              className="aspect-square bg-gradient-to-br from-indigo-100 to-purple-100 rounded-2xl overflow-hidden shadow-xl"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg
                  className="w-32 h-32"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                  />
                </svg>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
