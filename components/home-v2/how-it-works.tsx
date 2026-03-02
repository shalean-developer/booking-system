"use client";

import { SectionHeading } from "@/components/shalean-ui";

const steps = [
  {
    step: "01",
    title: "Select Service",
    desc: "Choose the type of clean and your property details.",
  },
  {
    step: "02",
    title: "Pick a Date",
    desc: "Schedule a time that works for you. 7 days a week.",
  },
  {
    step: "03",
    title: "Enjoy the Shine",
    desc: "Relax while our vetted pros handle everything.",
  },
];

export function HowItWorks() {
  return (
    <section className="px-6 py-24 max-w-7xl mx-auto">
      <SectionHeading centered>How It Works</SectionHeading>
      <div className="grid md:grid-cols-3 gap-16 md:gap-12">
        {steps.map((s, idx) => (
          <div key={idx} className="relative group">
            <span className="text-7xl md:text-8xl font-black text-slate-200/50 md:text-slate-100 absolute -top-10 md:-top-12 left-0 group-hover:text-blue-50 transition-colors pointer-events-none">
              {s.step}
            </span>
            <div className="relative pt-8 md:pt-10">
              <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">
                {s.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
