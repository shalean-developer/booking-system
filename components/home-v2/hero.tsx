"use client";

import { motion } from "framer-motion";
import { Star, ShieldCheck, CheckCircle2, Clock, ChevronRight, Calendar } from "lucide-react";
import { SectionHeading, ShaleanButton, ShaleanButtonLink } from "@/components/shalean-ui";

export function Hero() {
  return (
    <section className="pt-2 md:pt-4 px-6">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 md:space-y-8 order-2 lg:order-1"
        >
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 md:px-4 md:py-1.5 rounded-full text-xs md:text-sm font-medium">
            <Star className="w-3.5 h-3.5 md:w-4 md:h-4 fill-current" />
            <span>Rated 4.9/5 by 2,000+ Cape Town residents</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-tight">
            Professional Cleaning Services in{" "}
            <span className="text-blue-600">Cape Town</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 leading-relaxed max-w-xl">
            Trusted, vetted, and professionally trained cleaners for your home or
            office. Book a sparkle in under 60 seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            <ShaleanButtonLink href="/booking" variant="primary" className="text-lg px-8 md:px-10 py-4">
              Book Now <ChevronRight className="w-5 h-5" />
            </ShaleanButtonLink>
            <ShaleanButton variant="outline" className="text-lg px-8 md:px-10 py-4">
              WhatsApp Us
            </ShaleanButton>
          </div>
          <div className="flex flex-wrap gap-4 md:gap-6 pt-4">
            <div className="flex items-center gap-2 text-slate-500">
              <ShieldCheck className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
              <span className="text-xs md:text-sm font-medium">Fully Insured</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
              <span className="text-xs md:text-sm font-medium">Vetted Staff</span>
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <Clock className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
              <span className="text-xs md:text-sm font-medium">2+ Years Experience</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative order-1 lg:order-2"
        >
          <div className="aspect-[4/3] max-h-[min(70vh,520px)] rounded-2xl md:rounded-3xl overflow-hidden bg-slate-100 shadow-xl md:shadow-2xl">
            <img
              src="https://storage.googleapis.com/storage.magicpath.ai/user/357205955211063296/assets/19437879-6189-4ec7-b31e-1404730dffc4.jpg"
              alt="Professional Cleaning Service"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-4 md:-bottom-6 -left-4 md:-left-6 bg-white p-3 md:p-5 rounded-xl md:rounded-2xl shadow-xl flex items-center gap-3 md:gap-4 border border-blue-50 max-w-[200px] md:max-w-none">
            <div className="bg-blue-100 p-2 md:p-3 rounded-lg md:rounded-xl flex-shrink-0">
              <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                Next Available Slot
              </p>
              <p className="text-sm md:text-base font-bold text-slate-900 whitespace-nowrap">
                Tomorrow, 08:30 AM
              </p>
              <p className="text-[10px] md:text-xs text-amber-600 font-semibold mt-0.5">
                Limited slots this week
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
