"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { FAQS } from "@/lib/shalean-constants";

const brandBlue = "#2B59FF";

export function FAQ() {
  return (
    <section className="px-6 py-20 md:py-28 bg-slate-50">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight">
            Cleaning service FAQs
          </h2>
          <p className="text-slate-600 mt-4 text-lg leading-relaxed max-w-md">
            Straight answers about vetting, supplies, rescheduling, and how we
            make things right if something is missed.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-bold text-white shadow-md transition hover:opacity-95"
            style={{ backgroundColor: brandBlue }}
          >
            Contact us
          </Link>
        </div>
        <div className="space-y-3">
          {FAQS.map((faq, idx) => (
            <details
              key={idx}
              className="group border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm"
            >
              <summary className="flex items-center justify-between gap-4 p-5 cursor-pointer hover:bg-slate-50/80 transition-colors list-none">
                <span className="font-bold text-slate-800 text-left">
                  {faq.q}
                </span>
                <Plus className="w-5 h-5 text-slate-400 shrink-0 group-open:rotate-45 transition-transform" />
              </summary>
              <div className="px-5 pb-5 pt-0 text-slate-600 text-sm leading-relaxed border-t border-transparent group-open:border-slate-100">
                <div className="pt-4">{faq.a}</div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
