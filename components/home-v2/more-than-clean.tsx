"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

const brandBlue = "#2B59FF";

const columns = [
  {
    title: "Service options",
    desc: "Standard, deep, turnover, and specialty cleans — pick what fits your space and schedule.",
    img: "/images/service-standard-cleaning.jpg",
    alt: "Professional home cleaning service",
    href: "/services",
  },
  {
    title: "150+ regions reached",
    desc: "Trusted across major metros and growing suburbs — local teams who know your neighbourhood.",
    img: "/image/more-than-clean-regions.jpg",
    alt: "Cleaning team serving many regions",
    href: "/growth/local/cleaning-services/cape-town",
  },
  {
    title: "10,000+ happy homes",
    desc: "Repeat bookings, five-star reviews, and hosts who rely on us for guest-ready standards.",
    img: "/images/cleaning-team-hero.jpg",
    alt: "Happy customers and a spotless home",
    href: "/testimonials",
  },
];

export function MoreThanClean() {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const fallbackImage = "/image/more-than-clean-regions.jpg";

  return (
    <section className="px-6 py-20 md:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 text-center mb-14 md:mb-16">
          More than just clean
        </h2>
        <div className="grid md:grid-cols-3 gap-8 md:gap-6">
          {columns.map((col, idx) => (
            <motion.article
              key={col.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="flex flex-col"
            >
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-md mb-5">
                <Image
                  src={failedImages[col.title] ? fallbackImage : col.img}
                  alt={col.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  onError={() =>
                    setFailedImages((prev) => ({ ...prev, [col.title]: true }))
                  }
                />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{col.title}</h3>
              <p className="text-slate-600 text-sm leading-relaxed flex-grow mb-4">
                {col.desc}
              </p>
              <Link
                href={col.href}
                className="inline-flex items-center gap-1 text-sm font-bold transition hover:gap-2"
                style={{ color: brandBlue }}
              >
                Learn more <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
