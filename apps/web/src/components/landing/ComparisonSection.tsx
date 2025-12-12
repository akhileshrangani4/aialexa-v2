"use client";

import { motion } from "framer-motion";

export default function ComparisonSection() {
  const comparisonData = [
    {
      feature: "Audience",
      aiAlexa: "For educators",
      commercial: "General purpose",
    },
    {
      feature: "Access to custom chatbot",
      aiAlexa:
        "Shareable open-access link to custom chatbot, no login required",
      commercial: "User account required to see shared chatbots",
    },
    {
      feature: "Student login requirement",
      aiAlexa: "Students do not need to login",
      commercial: "Students must create accounts",
    },
    {
      feature: "Privacy and data protection",
      aiAlexa: "Full privacy protection; files & chats not used to train LLMs",
      commercial: "User data used for AI training",
    },
    {
      feature: "Openness of platform",
      aiAlexa: "Open source, open access",
      commercial:
        "Free tier product is not open access; training data not transparent",
    },
    {
      feature: "Model choice",
      aiAlexa: "Choice among open-source LLMs",
      commercial: "Locked in to one company's LLM",
    },
    {
      feature: "Control of system prompts",
      aiAlexa: "Professors write system prompts",
      commercial: "Prompts controlled by provider",
    },
    {
      feature: "Role of faculty and students",
      aiAlexa: "Faculty & students as designers, not just consumers",
      commercial: "Merely consumers of a predefined product",
    },
    {
      feature: "Building custom chatbots from files",
      aiAlexa: "File uploads to create custom chatbots; files remain private",
      commercial:
        "File uploads available but files are used by AI companies for LLM training",
    },
    {
      feature: "Data usage for model training",
      aiAlexa: "Files & chats not used to train LLMs",
      commercial: "Content is used to train LLM",
    },
    {
      feature: "Language support",
      aiAlexa: "Multilingual",
      commercial: "Multilingual",
    },
  ];

  return (
    <section id="comparison" className="py-20 px-6 md:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-5xl font-serif font-light text-foreground mb-4">
            Why Choose AI Alexa?
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            See how we compare to commercial AI solutions. Built with privacy,
            openness, and educators in mind.
          </p>
        </motion.div>

        <motion.div
          className="overflow-x-auto"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <table className="w-full bg-white border-collapse">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 px-6 font-semibold text-foreground">
                  Feature
                </th>
                <th className="text-left py-4 px-6 font-semibold text-foreground bg-gray-100">
                  AI Alexa (open access)
                </th>
                <th className="text-left py-4 px-6 font-semibold text-foreground">
                  Commercial AI
                </th>
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, index) => (
                <motion.tr
                  key={row.feature}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: index * 0.03 }}
                  className="border-b border-gray-200"
                >
                  <td className="py-4 px-6 text-sm font-medium text-foreground align-top">
                    {row.feature}
                  </td>
                  <td className="py-4 px-6 text-sm text-muted-foreground leading-relaxed align-top bg-gray-100">
                    {row.aiAlexa}
                  </td>
                  <td className="py-4 px-6 text-sm text-muted-foreground leading-relaxed align-top">
                    {row.commercial}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our commitment to open access, privacy, and educator empowerment
            sets us apart from commercial AI solutions that prioritize data
            collection and vendor lock-in.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
