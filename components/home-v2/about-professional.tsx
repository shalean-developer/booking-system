"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { GraduationCap, BadgeCheck } from "lucide-react";

const brandBlue = "#2B59FF";
const brandTeal = "#26B99A";

export function AboutProfessional() {
  return (
    <section className="px-6 py-20 md:py-28 bg-white">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative"
        >
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/image/more-than-clean-services.jpg"
                alt="Professional cleaner at work"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 45vw, 400px"
              />
            </div>
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-lg mt-8">
              <Image
                src="/image/more-than-clean-regions.jpg"
                alt="Clean modern bathroom"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 45vw, 400px"
              />
            </div>
          </div>
          <div
            className="absolute top-4 right-3 md:top-6 md:right-4 rounded-xl px-4 py-3 shadow-xl max-w-[200px] bg-white border border-slate-100"
          >
            <p className="text-2xl font-black leading-none text-slate-900">115+</p>
            <p className="text-sm font-semibold mt-1 text-slate-600">
              Certified cleaners
            </p>
          </div>
          <div
            className="absolute bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:left-4 md:bottom-8 rounded-xl px-5 py-4 text-white shadow-xl max-w-[220px]"
            style={{ backgroundColor: brandTeal }}
          >
            <p className="text-2xl font-black leading-none">20+</p>
            <p className="text-sm font-semibold mt-1 opacity-95">
              Years of experience
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 12 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h2 className="text-3xl md:text-4xl lg:text-[2.5rem] font-extrabold text-slate-900 leading-tight">
            Professional cleaning services you can count on
          </h2>
          <p className="text-slate-600 text-lg leading-relaxed">
            From everyday upkeep to deep resets and commercial spaces, we match
            you with vetted pros who show up on time, bring quality supplies, and
            treat every home like their own.
          </p>
          <ul className="space-y-5 pt-2">
            <li className="flex gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: brandBlue }}
              >
                <GraduationCap className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Trusted &amp; reliable</h3>
                <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                  Structured onboarding, quality checks, and ongoing coaching keep
                  results consistent visit after visit.
                </p>
              </div>
            </li>
            <li className="flex gap-4">
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: brandBlue }}
              >
                <BadgeCheck className="h-6 w-6" aria-hidden />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Professional service</h3>
                <p className="text-slate-600 text-sm mt-1 leading-relaxed">
                  Clear communication, insured teams, and a satisfaction promise
                  so booking stays simple from quote to completion.
                </p>
              </div>
            </li>
          </ul>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-2">
            <Link
              href="/about"
              className="inline-flex items-center justify-center rounded-xl px-8 py-3.5 text-sm font-bold text-white shadow-md transition hover:opacity-95 active:scale-[0.98]"
              style={{ backgroundColor: brandBlue }}
            >
              Read more
            </Link>
            <Link
              href="/services"
              className="text-sm font-bold text-slate-700 hover:text-slate-900 underline-offset-4 hover:underline"
            >
              All cleaning services
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
