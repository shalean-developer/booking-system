"use client";

import { Plus } from "lucide-react";
import { SectionHeading } from "@/components/shalean-ui";
import { FAQS } from "@/lib/shalean-constants";

export function FAQ() {
  return (
    <section className="px-6 max-w-3xl mx-auto py-24">
      <SectionHeading centered>Common Questions</SectionHeading>
      <div className="space-y-4">
        {FAQS.map((faq, idx) => (
          <details
            key={idx}
            className="group border border-slate-200 rounded-xl overflow-hidden"
          >
            <summary className="flex items-center justify-between p-5 cursor-pointer bg-white hover:bg-slate-50 transition-colors list-none">
              <span className="font-bold text-slate-800">{faq.q}</span>
              <Plus className="w-5 h-5 text-slate-400 group-open:rotate-45 transition-transform" />
            </summary>
            <div className="p-5 bg-slate-50 text-slate-600 border-t border-slate-200">
              {faq.a}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
