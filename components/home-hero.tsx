'use client';

import { motion } from "framer-motion";

export function HomeHero() {
  return (
    <section className="relative bg-gradient-to-b from-blue-50/30 via-white to-white overflow-hidden pt-16 sm:pt-20 pb-[72px]">
      {/* Background Bubble Illustrations */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Large Bubble - Top Left */}
        <motion.div
          className="absolute top-16 left-8 md:left-16"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: [0.3, 0.4, 0.3],
            scale: [1, 1.1, 1],
            y: [0, -15, 0]
          }}
          transition={{ 
            duration: 4,
            repeat: Infinity,
            delay: 0
          }}
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
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: [0.35, 0.45, 0.35],
            scale: [1, 1.15, 1],
            x: [0, 10, 0]
          }}
          transition={{ 
            duration: 3.5,
            repeat: Infinity,
            delay: 0.5
          }}
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
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: [0.3, 0.4, 0.3],
            scale: [1, 1.12, 1],
            y: [0, 15, 0]
          }}
          transition={{ 
            duration: 3,
            repeat: Infinity,
            delay: 0.8
          }}
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
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: [0.3, 0.42, 0.3],
            scale: [1, 1.18, 1]
          }}
          transition={{ 
            duration: 4.5,
            repeat: Infinity,
            delay: 1.2
          }}
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

        {/* Small Bubble - Center Left */}
        <motion.div
          className="absolute top-1/2 left-4 md:left-12 -translate-y-1/2"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: [0.3, 0.38, 0.3],
            scale: [1, 1.1, 1],
            y: [-50, -65, -50]
          }}
          transition={{ 
            duration: 3.8,
            repeat: Infinity,
            delay: 0.3
          }}
        >
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bubble5" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.15" />
                <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <circle cx="30" cy="30" r="27" fill="url(#bubble5)"/>
            <circle cx="30" cy="30" r="27" stroke="hsl(217, 91%, 60%)" strokeWidth="2" fill="none" opacity="0.3"/>
            <ellipse cx="22" cy="22" rx="8" ry="10" fill="white" opacity="0.4"/>
            <circle cx="20" cy="20" r="3.5" fill="white" opacity="0.5"/>
          </svg>
        </motion.div>

        {/* Small Bubble - Center Right */}
        <motion.div
          className="absolute top-1/2 right-4 md:right-12 -translate-y-1/2"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: [0.3, 0.4, 0.3],
            scale: [1, 1.14, 1],
            y: [-50, -62, -50]
          }}
          transition={{ 
            duration: 4.2,
            repeat: Infinity,
            delay: 0.7
          }}
        >
          <svg width="65" height="65" viewBox="0 0 65 65" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bubble6" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.16" />
                <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <circle cx="32.5" cy="32.5" r="29" fill="url(#bubble6)"/>
            <circle cx="32.5" cy="32.5" r="29" stroke="hsl(217, 91%, 60%)" strokeWidth="2" fill="none" opacity="0.3"/>
            <ellipse cx="24" cy="24" rx="8.5" ry="10.5" fill="white" opacity="0.4"/>
            <circle cx="22" cy="22" r="3.5" fill="white" opacity="0.5"/>
          </svg>
        </motion.div>

        {/* Tiny Bubble - Top Center */}
        <motion.div
          className="absolute top-32 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: [0.25, 0.35, 0.25],
            scale: [1, 1.2, 1]
          }}
          transition={{ 
            duration: 2.5,
            repeat: Infinity,
            delay: 1
          }}
        >
          <svg width="45" height="45" viewBox="0 0 45 45" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bubble7" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.14" />
                <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.04" />
              </linearGradient>
            </defs>
            <circle cx="22.5" cy="22.5" r="20" fill="url(#bubble7)"/>
            <circle cx="22.5" cy="22.5" r="20" stroke="hsl(217, 91%, 60%)" strokeWidth="2" fill="none" opacity="0.28"/>
            <ellipse cx="17" cy="17" rx="6" ry="7.5" fill="white" opacity="0.4"/>
            <circle cx="16" cy="16" r="3" fill="white" opacity="0.5"/>
          </svg>
        </motion.div>

        {/* Tiny Bubble - Bottom Center */}
        <motion.div
          className="absolute bottom-32 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: [0.28, 0.38, 0.28],
            scale: [1, 1.25, 1]
          }}
          transition={{ 
            duration: 3.2,
            repeat: Infinity,
            delay: 1.5
          }}
        >
          <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="bubble8" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.15" />
                <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            <circle cx="25" cy="25" r="22" fill="url(#bubble8)"/>
            <circle cx="25" cy="25" r="22" stroke="hsl(217, 91%, 60%)" strokeWidth="2" fill="none" opacity="0.3"/>
            <ellipse cx="19" cy="19" rx="6.5" ry="8" fill="white" opacity="0.4"/>
            <circle cx="18" cy="18" r="3" fill="white" opacity="0.5"/>
          </svg>
        </motion.div>
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
