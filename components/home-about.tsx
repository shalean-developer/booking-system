import Image from "next/image";
import { Check } from "lucide-react";

export function HomeAbout() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-sm sm:text-base font-semibold text-purple-600 uppercase tracking-wider mb-4">
            ABOUT US
          </h2>
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Building Cleaning Services For World Changers
          </h3>
          <p className="mx-auto max-w-3xl text-base sm:text-lg text-gray-600 leading-relaxed">
            We are dedicated to driving innovation and excellence in professional cleaning services, 
            transforming spaces and empowering businesses across South Africa.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center mt-12">
          {/* Left Side - Image */}
          <div className="relative">
            <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[600px] rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50">
              <Image
                src="/images/home-maintenance.jpg"
                alt="Professional cleaning services"
                fill
                className="object-cover"
                priority
              />
            </div>
            {/* Small mobile screen graphic below */}
            <div className="mt-6 relative w-full h-[200px] rounded-xl overflow-hidden bg-gradient-to-br from-blue-100 to-purple-100">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-white rounded-lg shadow-lg flex items-center justify-center">
                    <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-600 font-medium">Real-time Booking Analytics</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Content */}
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center mt-1">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Project Realization</h4>
                <p className="text-gray-600">
                  From initial consultation to final inspection, we ensure every cleaning project is completed to perfection.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center mt-1">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Fault-free Data Relations</h4>
                <p className="text-gray-600">
                  Transparent communication and reliable service tracking ensure seamless coordination and customer satisfaction.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center mt-1">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">Market Development</h4>
                <p className="text-gray-600">
                  Continuously expanding our service areas and improving our offerings to meet the evolving needs of our clients.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

