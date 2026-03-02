"use client";

import { motion } from "framer-motion";
import { Home, Star, Repeat, Award } from "lucide-react";

const stats = [
  { value: "2,000+", label: "Homes Cleaned in Cape Town", icon: <Home className="w-7 h-7" /> },
  { value: "4.9★", label: "Average Customer Rating", icon: <Star className="w-7 h-7" /> },
  { value: "500+", label: "Recurring Clients", icon: <Repeat className="w-7 h-7" /> },
  { value: "2+ Yrs", label: "Serving Cape Town", icon: <Award className="w-7 h-7" /> },
];

export function TrustStats() {
  return (
    <section className="px-6 bg-blue-600 py-20">
      <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-center text-white border border-white/20"
          >
            <div className="flex justify-center mb-3 text-blue-200">{s.icon}</div>
            <p className="text-3xl font-black mb-1">{s.value}</p>
            <p className="text-blue-200 text-sm leading-tight">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
