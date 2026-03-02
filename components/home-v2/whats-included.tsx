"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { SectionHeading, Card } from "@/components/shalean-ui";

const tabs = [
  {
    label: "Standard Cleaning",
    items: [
      "Kitchen surface wipe-down",
      "Bathroom sanitizing",
      "Dusting all surfaces",
      "Vacuuming & mopping floors",
      "Bin emptying",
      "General tidying",
    ],
  },
  {
    label: "Deep Cleaning",
    items: [
      "Detailed scrubbing of all surfaces",
      "Inside cupboards & cabinets",
      "Skirting boards & door frames",
      "Interior windows",
      "Behind appliances",
      "Grout & tile scrubbing",
    ],
  },
  {
    label: "Move In / Out",
    items: [
      "Full property reset clean",
      "Appliance inside & out",
      "Wall spot cleaning",
      "Deep bathroom sanitize",
      "All cupboards & drawers",
      "Carpet & floor steam prep",
    ],
  },
];

export function WhatsIncluded() {
  const [openTab, setOpenTab] = useState(0);
  return (
    <section className="px-6 bg-slate-50 py-24">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          centered
          subtitle="Transparent service inclusions so you always know exactly what you're getting."
        >
          What&apos;s Included in Our Cleaning Services
        </SectionHeading>
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setOpenTab(idx)}
              className={`px-6 py-2.5 rounded-full font-semibold text-sm transition-all ${
                openTab === idx
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-blue-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <motion.div
          key={openTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="border-blue-100">
            <h3 className="text-xl font-bold mb-6 text-slate-900">
              {tabs[openTab].label} Includes:
            </h3>
            <ul className="space-y-3">
              {tabs[openTab].items.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <span className="text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
