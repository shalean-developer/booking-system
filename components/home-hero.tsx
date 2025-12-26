'use client';

import { motion } from "framer-motion";

export function HomeHero() {
  return (
    <section className="relative bg-white overflow-hidden pt-16 sm:pt-20 pb-[72px]">
      {/* Main Content */}
      <motion.div 
        className="relative z-10 mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="w-full mx-auto text-center">
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 sm:mb-8 leading-tight">
            Professional <span className="text-red-600">Cleaning</span> You Can Rely On.
          </h1>

          {/* Descriptive Paragraph */}
          <p className="text-base sm:text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed mb-0">
            Keep your workplace spotless and welcoming with our trusted, top-notch office cleaning services.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
