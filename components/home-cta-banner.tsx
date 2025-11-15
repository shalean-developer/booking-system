import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export function HomeCTABanner() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-r from-purple-600 via-purple-500 to-blue-600">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side - Text */}
          <div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Experience Professional Cleaning Today
            </h2>
            <p className="text-lg sm:text-xl text-white/90 mb-8 leading-relaxed">
              Trust Shalean Cleaning Services for spotless results. Book your cleaning service and enjoy a fresh, clean space.
            </p>
            <Button
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-50 rounded-full px-8 py-6 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
              asChild
            >
              <Link href="/booking/service/select">Let&apos;s get started</Link>
            </Button>
          </div>

          {/* Right Side - Image */}
          <div className="relative">
            <div className="relative w-full h-[300px] sm:h-[400px] lg:h-[500px] rounded-2xl overflow-hidden bg-white/10">
              <Image
                src="/images/home-maintenance.jpg"
                alt="Professional cleaning services"
                fill
                className="object-cover"
              />
            </div>
            {/* Small mobile screen graphic */}
            <div className="mt-6 relative w-full h-[150px] rounded-xl overflow-hidden bg-white/10">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 bg-white rounded-lg shadow-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-white font-medium">Real-time Analytics</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

