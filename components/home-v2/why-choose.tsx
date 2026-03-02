"use client";

import { motion } from "framer-motion";
import {
  ShieldCheck,
  DollarSign,
  Repeat,
  Zap,
  ThumbsUp,
  Award,
} from "lucide-react";
import { SectionHeading, Card } from "@/components/shalean-ui";

const reasons = [
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Fully Insured & Vetted",
    desc: "Every cleaner passes rigorous background checks and is fully insured for your peace of mind.",
  },
  {
    icon: <DollarSign className="w-6 h-6" />,
    title: "Transparent Pricing",
    desc: "No hidden fees. You see exactly what you pay before confirming your booking.",
  },
  {
    icon: <Repeat className="w-6 h-6" />,
    title: "Flexible Scheduling",
    desc: "Book 7 days a week, including weekends and public holidays, at a time that suits you.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Same-Week Availability",
    desc: "Need a clean fast? We offer same-week and even same-day slots across Cape Town.",
  },
  {
    icon: <ThumbsUp className="w-6 h-6" />,
    title: "100% Satisfaction Guarantee",
    desc: "If you're not happy, we return and make it right — at absolutely no extra cost.",
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: "Professionally Trained Team",
    desc: "Our cleaners receive ongoing training to deliver consistent, premium results every time.",
  },
];

export function WhyChoose() {
  return (
    <section className="px-6 py-24">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          centered
          subtitle="We go beyond the clean — delivering trust, reliability, and results you can count on."
        >
          Why Choose Shalean Cleaning Services?
        </SectionHeading>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((r, idx) => (
            <motion.div key={idx} whileHover={{ y: -4 }}>
              <Card className="h-full hover:border-blue-200 group transition-all">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {r.icon}
                </div>
                <h3 className="text-lg font-bold mb-2 text-slate-900">
                  {r.title}
                </h3>
                <p className="text-slate-500 text-sm leading-relaxed">{r.desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
