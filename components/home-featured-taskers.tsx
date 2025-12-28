'use client';

import Image from 'next/image';

const cleaners = [
  {
    name: 'Ashley Byrd',
    avatar: '/images/team-lucia.webp',
    years: 2,
    bgColor: 'bg-blue-500',
  },
  {
    name: 'Robert Stewart',
    avatar: '/images/team-normatter.webp',
    years: 2,
    bgColor: 'bg-pink-500',
  },
  {
    name: 'Elizabeth Walker',
    avatar: '/images/team-nyasha.webp',
    years: 2,
    bgColor: 'bg-green-500',
  },
];

export function HomeFeaturedCleaners() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Heading */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-2">
            Pro cleaners with{' '}
            <span className="text-[#3b82f6]">2 years</span> of experience
          </h2>
        </div>
        
        {/* Cleaner Profiles */}
        <div className="flex flex-wrap justify-center items-start gap-6 sm:gap-8 lg:gap-10 max-w-5xl mx-auto">
          {cleaners.map((cleaner, index) => (
            <div key={index} className="flex flex-col items-center">
              {/* Circular Portrait */}
              <div className="relative mb-4">
                <div className={`relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden ${cleaner.bgColor} flex items-center justify-center`}>
                  <Image
                    src={cleaner.avatar}
                    alt={`${cleaner.name} - Professional cleaner with ${cleaner.years} years of experience`}
                    width={160}
                    height={160}
                    className="w-full h-full object-cover"
                    sizes="(max-width: 640px) 128px, 160px"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                {/* Years Badge - Oval shaped */}
                <div className="absolute -bottom-2 -right-2 bg-[#3b82f6] text-white text-xs font-semibold px-3 py-1.5 rounded-[20px] whitespace-nowrap shadow-md">
                  {cleaner.years} years
                </div>
              </div>
              
              {/* Name */}
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">
                {cleaner.name}
              </h3>
            </div>
          ))}
          
          {/* Placeholder for Other Professionals */}
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-full bg-[#3b82f6] flex items-center justify-center">
                {/* Person Icon - White outline */}
                <svg
                  className="w-12 h-12 sm:w-16 sm:h-16 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>
            
            {/* Text below circle */}
            <p className="text-base sm:text-lg font-semibold text-gray-900 text-center max-w-[160px]">
              And over 100 other professionals
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

