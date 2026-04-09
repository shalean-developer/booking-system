"use client";

import { motion } from "framer-motion";

const brandBlue = "#2B59FF";

const steps = [
  {
    step: "01",
    title: "Choose your clean",
    desc: "Tell us the service type, size of the space, and any add-ons you need.",
  },
  {
    step: "02",
    title: "Pick date & address",
    desc: "Book a slot that fits your calendar — we confirm details before we arrive.",
  },
  {
    step: "03",
    title: "Relax — we handle the rest",
    desc: "Vetted pros show up equipped, follow your checklist, and leave it spotless.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="scroll-mt-24 px-6 py-16 md:py-20 bg-white border-t border-slate-100"
    >
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 text-center mb-3">
          How it works
        </h2>
        <p className="text-slate-600 text-center max-w-2xl mx-auto mb-14 text-lg">
          Three simple steps from “I need help” to a space you are proud to walk
          into.
        </p>
        <div className="grid md:grid-cols-3 gap-12 md:gap-8">
          {steps.map((s, idx) => (
            <motion.div
              key={s.step}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="relative"
            >
              <span
                className="text-5xl font-black text-slate-100 select-none absolute -top-2 left-0"
                aria-hidden
              >
                {s.step}
              </span>
              <div
                className="relative pt-8 border-l-2 pl-5 ml-2 md:border-l-0 md:pl-0 md:ml-0 md:pt-10"
                style={{ borderColor: `${brandBlue}33` }}
              >
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {s.title}
                </h3>
                <p className="text-slate-600 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
