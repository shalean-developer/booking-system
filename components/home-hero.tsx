'use client';

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export function HomeHero() {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  // Defer animations until after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldAnimate(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative bg-gradient-to-b from-blue-50/30 via-white to-white overflow-hidden pt-16 sm:pt-20 pb-[72px]">
      {/* Background Bubble Illustrations - Reduced from 8 to 4 for better performance */}
      <div className="absolute inset-0 z-0 overflow-hidden" style={{ willChange: 'transform' }}>
        {/* Large Bubble - Top Left */}
        <motion.div
          className="absolute top-16 left-8 md:left-16"
          initial={{ opacity: 0.3, scale: 1 }}
          animate={shouldAnimate ? { 
            opacity: [0.3, 0.4, 0.3],
            scale: [1, 1.1, 1],
            y: [0, -15, 0]
          } : { opacity: 0.3, scale: 1, y: 0 }}
          transition={{ 
            duration: 4,
            repeat: shouldAnimate ? Infinity : 0,
            delay: 0
          }}
          style={{ willChange: 'transform, opacity' }}
        >
          <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bubble1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.15" />
                <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <circle cx="60" cy="60" r="55" fill="url(#bubble1)"/>
            <circle cx="60" cy="60" r="55" stroke="hsl(217, 91%, 60%)" strokeWidth="2" fill="none" opacity="0.3"/>
            <ellipse cx="45" cy="45" rx="15" ry="18" fill="white" opacity="0.4"/>
            <circle cx="40" cy="40" r="6" fill="white" opacity="0.5"/>
          </svg>
        </motion.div>

        {/* Medium Bubble - Top Right */}
        <motion.div
          className="absolute top-20 right-12 md:right-24"
          initial={{ opacity: 0.35, scale: 1 }}
          animate={shouldAnimate ? { 
            opacity: [0.35, 0.45, 0.35],
            scale: [1, 1.15, 1],
            x: [0, 10, 0]
          } : { opacity: 0.35, scale: 1, x: 0 }}
          transition={{ 
            duration: 3.5,
            repeat: shouldAnimate ? Infinity : 0,
            delay: 0.5
          }}
          style={{ willChange: 'transform, opacity' }}
        >
          <svg width="90" height="90" viewBox="0 0 90 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bubble2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.06" />
              </linearGradient>
            </defs>
            <circle cx="45" cy="45" r="42" fill="url(#bubble2)"/>
            <circle cx="45" cy="45" r="42" stroke="hsl(217, 91%, 60%)" strokeWidth="2" fill="none" opacity="0.35"/>
            <ellipse cx="35" cy="35" rx="11" ry="13" fill="white" opacity="0.4"/>
            <circle cx="32" cy="32" r="5" fill="white" opacity="0.5"/>
          </svg>
        </motion.div>

        {/* Small Bubble - Bottom Left */}
        <motion.div
          className="absolute bottom-20 left-16 md:left-32"
          initial={{ opacity: 0.3, scale: 1 }}
          animate={shouldAnimate ? { 
            opacity: [0.3, 0.4, 0.3],
            scale: [1, 1.12, 1],
            y: [0, 15, 0]
          } : { opacity: 0.3, scale: 1, y: 0 }}
          transition={{ 
            duration: 3,
            repeat: shouldAnimate ? Infinity : 0,
            delay: 0.8
          }}
          style={{ willChange: 'transform, opacity' }}
        >
          <svg width="70" height="70" viewBox="0 0 70 70" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bubble3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.16" />
                <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <circle cx="35" cy="35" r="32" fill="url(#bubble3)"/>
            <circle cx="35" cy="35" r="32" stroke="hsl(217, 91%, 60%)" strokeWidth="2" fill="none" opacity="0.3"/>
            <ellipse cx="26" cy="26" rx="9" ry="11" fill="white" opacity="0.4"/>
            <circle cx="24" cy="24" r="4" fill="white" opacity="0.5"/>
          </svg>
        </motion.div>

        {/* Medium Bubble - Bottom Right */}
        <motion.div
          className="absolute bottom-24 right-16 md:right-32"
          initial={{ opacity: 0.3, scale: 1 }}
          animate={shouldAnimate ? { 
            opacity: [0.3, 0.42, 0.3],
            scale: [1, 1.18, 1]
          } : { opacity: 0.3, scale: 1 }}
          transition={{ 
            duration: 4.5,
            repeat: shouldAnimate ? Infinity : 0,
            delay: 1.2
          }}
          style={{ willChange: 'transform, opacity' }}
        >
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bubble4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.17" />
                <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.06" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="46" fill="url(#bubble4)"/>
            <circle cx="50" cy="50" r="46" stroke="hsl(217, 91%, 60%)" strokeWidth="2" fill="none" opacity="0.32"/>
            <ellipse cx="38" cy="38" rx="12" ry="14" fill="white" opacity="0.4"/>
            <circle cx="36" cy="36" r="5" fill="white" opacity="0.5"/>
          </svg>
        </motion.div>

        {/* Removed 4 less visible bubbles to improve performance */}
      </div>

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
            Professional <span className="text-primary">Cleaning</span> You Can Rely On.
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
