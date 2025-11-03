"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function CTASection() {
  return (
    <section className="py-32 px-6 md:px-12 bg-white">
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
          <p className="text-muted-foreground text-lg mb-12 leading-relaxed max-w-2xl mx-auto">
            Built by educators, for educators. Contribute on GitHub, self-host
            your instance, or use our hosted version. Your choice.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                asChild
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-6 text-base rounded-full font-medium shadow-lg"
              >
                <Link href="/register">Get Started Free</Link>
              </Button>
            </motion.div>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-2 px-10 py-6 text-base rounded-full font-medium"
              >
                <Link
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub
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
