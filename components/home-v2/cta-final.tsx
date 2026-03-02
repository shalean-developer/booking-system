"use client";

import { ShaleanButtonLink, ShaleanButton } from "@/components/shalean-ui";

export function CtaFinal() {
  return (
    <section className="px-6 max-w-7xl mx-auto mb-12">
      <div className="bg-blue-600 rounded-3xl p-12 text-center text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <svg
            width="100%"
            height="100%"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden
          >
            <defs>
              <pattern
                id="grid"
                width="40"
                height="40"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        <h2 className="text-4xl font-extrabold mb-6 relative z-10">
          Ready for a cleaner home?
        </h2>
        <p className="text-blue-100 text-xl mb-10 max-w-xl mx-auto relative z-10">
          Join thousands of happy homeowners who trust Shalean Cleaning Services.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
          <ShaleanButtonLink
            href="/booking/service/standard/plan"
            className="!bg-white !text-blue-600 hover:!bg-blue-50 px-10"
          >
            Book a Clean Now
          </ShaleanButtonLink>
          <ShaleanButtonLink
            href="/contact"
            variant="outline"
            className="!border-white !text-white hover:!bg-white/10"
          >
            Contact Support
          </ShaleanButtonLink>
        </div>
      </div>
    </section>
  );
}
