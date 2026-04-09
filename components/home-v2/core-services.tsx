"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  Layers,
  Home,
  Building2,
  HardHat,
  Calendar,
} from "lucide-react";
import { Card } from "@/components/shalean-ui";

const brandBlue = "#2B59FF";

const services = [
  {
    title: "Standard clean",
    description:
      "Regular upkeep to keep dust, surfaces, and floors guest-ready all week.",
    href: "/booking/service/standard/plan",
    icon: Sparkles,
  },
  {
    title: "Deep clean",
    description:
      "Detailed scrub for kitchens, bathrooms, and every corner that gets skipped.",
    href: "/booking/service/deep/plan",
    icon: Layers,
  },
  {
    title: "Move-in / out",
    description:
      "Full reset for handovers, bond cleans, and move-day peace of mind.",
    href: "/booking/service/move-in-out/plan",
    icon: Home,
  },
  {
    title: "Office clean",
    description:
      "Reliable commercial coverage with flexible hours and clear scope.",
    href: "/services/office-cleaning",
    icon: Building2,
  },
  {
    title: "Post construction",
    description:
      "Dust removal, sparkle finishes, and site-ready presentation.",
    href: "/services/post-construction-cleaning",
    icon: HardHat,
  },
  {
    title: "Airbnb clean",
    description:
      "Fast turnovers, linen-ready rooms, and five-star presentation.",
    href: "/booking/service/airbnb/plan",
    icon: Calendar,
  },
];

export function CoreServices() {
  return (
    <section id="services" className="px-6 bg-white py-20 md:py-28">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
            House, office, and deep cleaning services in Cape Town
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed">
            Pick the visit that matches your home or business — transparent
            scope, upfront pricing, and pros who arrive prepared.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.title} whileHover={{ y: -4 }}>
                <Card className="h-full flex flex-col p-6 md:p-7 rounded-2xl border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all group">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-blue-50 border border-blue-100/80"
                    style={{ color: brandBlue }}
                  >
                    <Icon className="w-6 h-6" strokeWidth={1.75} aria-hidden />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {s.title}
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed flex-grow mb-5">
                    {s.description}
                  </p>
                  <Link
                    href={s.href}
                    className="inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:opacity-95 w-fit"
                    style={{ backgroundColor: brandBlue }}
                  >
                    Book {s.title}
                  </Link>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
