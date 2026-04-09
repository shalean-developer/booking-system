"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const brandBlue = "#2B59FF";
const brandTeal = "#26B99A";

const benefits = [
  "All-in-one platform for quotes, scheduling, and billing",
  "Flexible scheduling for offices, retail, and sites",
  "Vetted professionals and quality follow-up",
  "Easy payment and invoicing-friendly workflows",
];

export function BusinessScale() {
  return (
    <section className="px-6 py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl order-2 lg:order-1"
        >
          <Image
            src="/image/more-than-clean-regions.jpg"
            alt="Modern glass office interior"
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="order-1 lg:order-2 space-y-6"
        >
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
            Built for business scale
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed">
            Whether you need regular office maintenance or a one-off deep clean,
            we tailor coverage, timing, and billing to match how your organisation
            runs.
          </p>
          <ul className="space-y-3">
            {benefits.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white"
                  style={{ backgroundColor: brandTeal }}
                >
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                </span>
                <span className="text-slate-700 font-medium">{b}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
            <Link
              href="/booking/quote"
              className="inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-sm font-bold text-white shadow-md transition hover:opacity-95 active:scale-[0.98]"
              style={{ backgroundColor: brandBlue }}
            >
              Get started
            </Link>
            <Link
              href="/services/office-cleaning"
              className="text-sm font-bold text-slate-700 hover:text-slate-900 underline-offset-4 hover:underline"
            >
              Learn more
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
