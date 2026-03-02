"use client";

import { Home, Layers, Plus, BarChart2 } from "lucide-react";
import { SectionHeading, Card, ShaleanButtonLink } from "@/components/shalean-ui";
import { ChevronRight } from "lucide-react";

const factors = [
  {
    icon: <Home className="w-5 h-5" />,
    label: "Property size",
    desc: "Number of bedrooms & bathrooms",
  },
  {
    icon: <Layers className="w-5 h-5" />,
    label: "Cleaning type",
    desc: "Standard, deep, or move in/out",
  },
  {
    icon: <Plus className="w-5 h-5" />,
    label: "Add-on services",
    desc: "Oven, fridge, windows & more",
  },
  {
    icon: <BarChart2 className="w-5 h-5" />,
    label: "Property condition",
    desc: "First-clean or regular upkeep",
  },
];

export function PricingTransparency() {
  return (
    <section className="px-6 bg-slate-50 py-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionHeading subtitle="We believe in complete pricing transparency — no surprises, ever.">
              How Our Pricing Works
            </SectionHeading>
            <p className="text-slate-600 mb-8 leading-relaxed">
              Our quotes are tailored to your specific property and needs. Use
              our instant quote tool to see your exact price in seconds — no
              commitment required.
            </p>
            <ShaleanButtonLink href="/booking/service/standard/plan" variant="primary">
              Get Instant Quote <ChevronRight className="w-5 h-5" />
            </ShaleanButtonLink>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {factors.map((f, idx) => (
              <Card key={idx} className="hover:border-blue-200 transition-all">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h4 className="font-bold text-slate-900 mb-1">{f.label}</h4>
                <p className="text-slate-500 text-sm">{f.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
