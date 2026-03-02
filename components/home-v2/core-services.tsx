"use client";

import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Layers, Home, Calendar, Wind } from "lucide-react";
import { SERVICES, type ServiceIconName } from "@/lib/shalean-constants";
import { SectionHeading, Card, ShaleanButtonLink } from "@/components/shalean-ui";

const iconMap: Record<ServiceIconName, React.ReactNode> = {
  Sparkles: <Sparkles className="w-6 h-6" />,
  Layers: <Layers className="w-6 h-6" />,
  Home: <Home className="w-6 h-6" />,
  Calendar: <Calendar className="w-6 h-6" />,
  Wind: <Wind className="w-6 h-6" />,
};

export function CoreServices() {
  return (
    <section className="px-6 bg-slate-50 py-16 md:py-24 mt-16 md:mt-24">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          centered
          subtitle="Tailored cleaning solutions for every need across South Africa."
        >
          Our Core Services
        </SectionHeading>
        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6">
          {SERVICES.map((s) => (
            <motion.div key={s.id} whileHover={{ y: -5 }}>
              <Card className="h-full flex flex-col items-center text-center cursor-pointer hover:border-blue-200 group transition-all">
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  {iconMap[s.iconName]}
                </div>
                <h3 className="text-lg font-bold mb-3">{s.title}</h3>
                <p className="text-slate-500 text-sm mb-6 flex-grow">
                  {s.description}
                </p>
                <p className="text-blue-600 font-bold mb-4">Starting R{s.price}</p>
                <ShaleanButtonLink
                  href="/services"
                  variant="ghost"
                  className="w-full text-sm py-2"
                >
                  Details <ArrowRight className="w-4 h-4" />
                </ShaleanButtonLink>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
