'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { BadgeCheck } from 'lucide-react';

const cleaners = [
  {
    name: 'Lucia Pazvakavambwa',
    avatar: '/images/team-lucia.webp',
    tasks: 150,
    location: 'Cape Town',
    rating: 5.0,
  },
  {
    name: 'Normatter Mazhinji',
    avatar: '/images/team-normatter.webp',
    tasks: 203,
    location: 'Sea Point',
    rating: 5.0,
  },
  {
    name: 'Nyasha Mudani',
    avatar: '/images/team-nyasha.webp',
    tasks: 189,
    location: 'Claremont',
    rating: 5.0,
  },
  {
    name: 'Maggret Jiri',
    avatar: '/images/team-lucia.webp',
    tasks: 167,
    location: 'Constantia',
    rating: 5.0,
  },
];

export function HomeFeaturedCleaners() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Our Expert Cleaning Team</h2>
        
        {/* Horizontal Scrollable Carousel */}
        <div className="overflow-x-auto pb-4 -mx-4 px-4">
          <div className="flex gap-6 min-w-max md:min-w-0 md:grid md:grid-cols-2 lg:grid-cols-4">
            {cleaners.map((cleaner, index) => (
              <motion.div
                key={index}
                className="flex-shrink-0 w-72 md:w-auto bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="flex flex-col items-center text-center">
                  {/* Profile Picture with Verified Badge */}
                  <div className="relative mb-4">
                    <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                      <Image
                        src={cleaner.avatar}
                        alt={`${cleaner.name} - Verified professional cleaner in ${cleaner.location}, Cape Town - Shalean Cleaning Services`}
                        fill
                        className="object-cover"
                        sizes="80px"
                        onError={(e) => {
                          e.currentTarget.parentElement!.style.backgroundColor = '#e5e7eb';
                        }}
                      />
                    </div>
                    <BadgeCheck className="absolute -bottom-1 -right-1 h-6 w-6 text-primary bg-white rounded-full" />
                  </div>
                  
                  {/* Name */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">{cleaner.name}</h3>
                  
                  {/* Location */}
                  <p className="text-sm text-gray-500 mb-2">{cleaner.location}</p>
                  
                  {/* Rating */}
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-yellow-400">★★★★★</span>
                    <span className="text-sm text-gray-600">({cleaner.rating})</span>
                  </div>
                  
                  {/* Task Count */}
                  <p className="text-sm text-gray-600 mb-4">{cleaner.tasks} completed cleanings</p>
                  
                  {/* Button */}
                  <Button
                    className="bg-primary hover:bg-primary/90 text-white w-full rounded-lg"
                    asChild
                  >
                    <Link href="/careers">View Profile</Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

