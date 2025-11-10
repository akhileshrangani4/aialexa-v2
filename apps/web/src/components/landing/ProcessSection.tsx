"use client";

import { motion } from "framer-motion";

export default function ProcessSection() {
  const steps = [
    {
      number: "01",
      title: "Create",
      description:
        "Sign up and create your first chatbot in minutes. No technical skills needed.",
    },
    {
      number: "02",
      title: "Upload",
      description:
        "Add your course materials. Our AI processes and indexes everything automatically.",
    },
    {
      number: "03",
      title: "Share",
      description:
        "Share the link with your students and watch engagement soar.",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 px-6 md:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.h2
          className="text-5xl font-serif font-light text-foreground mb-12 text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          How It Works
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
            >
              <motion.div
                className="text-6xl font-serif font-light text-gray-300 mb-4"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.15 + 0.2 }}
              >
                {step.number}
              </motion.div>
              <h3 className="text-2xl font-semibold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
