"use client";

import { motion } from "framer-motion";
import { ShieldCheck, ChevronRight } from "lucide-react";
import { SectionHeading, ShaleanButtonLink, ShaleanButton } from "@/components/shalean-ui";

export function SatisfactionGuarantee() {
  return (
    <section className="px-6 py-24">
      <div className="max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheck className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            100% Satisfaction Guarantee
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed mb-8">
            If you&apos;re not completely happy with the results, we&apos;ll
            return and fix it — free of charge. Your satisfaction isn&apos;t
            just our promise, it&apos;s our policy. That&apos;s the Shalean
            standard.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <ShaleanButtonLink
              href="/booking/service/standard/plan"
              variant="primary"
              className="text-lg px-10"
            >
              Book a Clean Now <ChevronRight className="w-5 h-5" />
            </ShaleanButtonLink>
            <ShaleanButtonLink
              href="/how-it-works"
              variant="outline"
              className="text-lg px-10"
            >
              Learn More
            </ShaleanButtonLink>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
