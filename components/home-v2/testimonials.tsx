"use client";

import Image from "next/image";

export function Testimonials() {
  return (
    <section className="px-6 bg-blue-900 py-24 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        <div>
          <h2 className="text-4xl font-bold mb-6 italic">
            &quot;The best cleaning service I&apos;ve used in Sea Point. Friendly,
            punctual, and my apartment was spotless.&quot;
          </h2>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-400 overflow-hidden relative">
              <Image
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80"
                alt="Sarah J."
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div>
              <p className="font-bold">Sarah Jenkins</p>
              <p className="text-blue-300 text-sm">Airbnb Host, Gardens</p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
            <p className="text-3xl font-bold mb-1">500+</p>
            <p className="text-blue-300">Properties Cleaned</p>
          </div>
          <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
            <p className="text-3xl font-bold mb-1">100%</p>
            <p className="text-blue-300">Satisfaction Rate</p>
          </div>
          <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
            <p className="text-3xl font-bold mb-1">24/7</p>
            <p className="text-blue-300">Customer Support</p>
          </div>
          <div className="bg-white/10 p-6 rounded-2xl backdrop-blur-sm">
            <p className="text-3xl font-bold mb-1">60s</p>
            <p className="text-blue-300">Booking Time</p>
          </div>
        </div>
      </div>
    </section>
  );
}
