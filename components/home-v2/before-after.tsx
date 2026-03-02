"use client";

import { motion } from "framer-motion";
import { SectionHeading } from "@/components/shalean-ui";

const items = [
  {
    label: "Sea Point Apartment",
    badge: "Deep Clean",
    img: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Claremont Family Home",
    badge: "Move In Clean",
    img: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80",
  },
  {
    label: "Gardens Airbnb",
    badge: "Airbnb Turnover",
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80",
  },
];

export function BeforeAfter() {
  return (
    <section className="px-6 py-24">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          centered
          subtitle="Real homes transformed by our professional cleaning team across Cape Town."
        >
          See the Shalean Difference
        </SectionHeading>
        <div className="grid md:grid-cols-3 gap-6">
          {items.map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ y: -4 }}
              className="group relative rounded-2xl overflow-hidden shadow-sm border border-slate-100"
            >
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={item.img}
                  alt={item.label}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute top-4 left-4">
                <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                  {item.badge}
                </span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/80 to-transparent p-4">
                <p className="text-white font-semibold">{item.label}</p>
                <p className="text-slate-300 text-xs">
                  Real homes cleaned across Cape Town.
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
