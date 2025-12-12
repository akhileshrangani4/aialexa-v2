"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { SiGithub } from "react-icons/si";
import { env } from "@/lib/env";

export default function GithubSection() {
  return (
    <section id="github" className="py-32 px-6 md:px-12 bg-white">
      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="text-4xl md:text-6xl font-serif font-light text-foreground mb-6 leading-tight">
            Open source.
            <br />
            Forever free.
          </h2>
          <p className="text-muted-foreground text-lg mb-12 leading-[1.8] max-w-3xl mx-auto">
            Built by educators for educators. Contribute to best practices.
            Share pedagogical ideas. Collaborate on GitHub. Use our hosted AI or
            host it yourself.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 px-10 py-6 text-base rounded-full font-medium"
              >
                <Link
                  href={env.NEXT_PUBLIC_GITHUB_URL || "/"}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View our code on GitHub <SiGithub size={24} />
                </Link>
              </Button>
            </motion.div>
          </div>

          <motion.p
            className="text-muted-foreground text-sm"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            No credit card required • Academic emails preferred
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
