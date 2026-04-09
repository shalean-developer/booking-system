"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const brandBlue = "#2B59FF";

const metrics = [
  { label: "Professional cleaners", percent: 95 },
  { label: "Quality of cleaning", percent: 98 },
  { label: "Customer service & satisfaction", percent: 99 },
];

const reviews = [
  {
    quote:
      "Booking took under a minute. The team was on time, friendly, and our Sea Point flat looked brand new.",
    name: "Sarah Jenkins",
    role: "Airbnb host, Gardens",
    avatar: "/image/more-than-clean-services.jpg",
  },
  {
    quote:
      "We use Shalean for our office twice a week. Reliable, quiet during meetings, and great attention to detail.",
    name: "David Mokoena",
    role: "Operations, Sandton",
    avatar: "/image/more-than-clean-regions.jpg",
  },
  {
    quote:
      "Deep clean before our move was worth every rand. Bond inspection passed without a single snag.",
    name: "Amelia van der Berg",
    role: "Homeowner, Claremont",
    avatar: "/image/more-than-clean-homes.jpg",
  },
];

export function Testimonials() {
  return (
    <section className="relative flex flex-col gap-24 pb-8 md:gap-28 md:pb-12 lg:gap-36">
      {/* Top block: image + metrics — keep below review row in stacking order (no z-index) */}
      <div className="grid shrink-0 lg:grid-cols-2 relative z-0">
        <div className="relative min-h-[280px] lg:min-h-[420px]">
          <Image
            src="/image/more-than-clean-homes.jpg"
            alt="Team collaborating in a modern office"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </div>
        <div
          className="flex flex-col justify-center px-6 pt-14 pb-24 md:px-12 md:pt-16 md:pb-28 lg:pt-20 lg:pb-32 text-white"
          style={{ backgroundColor: brandBlue }}
        >
          <h2 className="text-2xl md:text-3xl font-extrabold mb-8 md:mb-10 max-w-lg">
            What our clients think
          </h2>
          <div className="space-y-8 max-w-xl">
            {metrics.map((m, idx) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <div className="flex justify-between text-sm font-semibold mb-2 gap-4">
                  <span>{m.label}</span>
                  <span className="tabular-nums shrink-0">{m.percent}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-white/25 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-white"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${m.percent}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, ease: "easeOut", delay: 0.15 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative z-0 max-w-7xl w-full mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {reviews.map((r, idx) => (
            <motion.article
              key={r.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="bg-white rounded-2xl p-6 md:p-7 shadow-lg border border-slate-100 flex flex-col"
            >
              <div className="flex gap-0.5 mb-4" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 fill-amber-400 text-amber-400"
                    aria-hidden
                  />
                ))}
              </div>
              <p className="text-slate-700 leading-relaxed flex-grow mb-6">
                &ldquo;{r.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 bg-slate-200">
                  <Image
                    src={r.avatar}
                    alt={`${r.name} testimonial profile`}
                    fill
                    className="object-cover"
                    sizes="44px"
                  />
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{r.name}</p>
                  <p className="text-slate-500 text-xs">{r.role}</p>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
        <p className="text-center mt-10">
          <Link
            href="/testimonials"
            className="text-sm font-bold transition hover:underline underline-offset-4"
            style={{ color: brandBlue }}
          >
            Read more reviews
          </Link>
        </p>
      </div>
    </section>
  );
}
