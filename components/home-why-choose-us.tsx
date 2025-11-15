import Image from "next/image";

export function HomeWhyChooseUs() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            How we transformed a small business&apos;s <span className="font-playfair italic text-gray-400">online presence</span>
          </h2>
        </div>

        {/* Two Showcase Cards */}
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
          {/* Left Card - Residential Cleaning */}
          <div className="relative">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl min-h-[500px] sm:min-h-[600px] relative overflow-hidden">
              <div className="absolute inset-0 w-full h-full">
                <Image
                  src="/images/home-maintenance.jpg"
                  alt="Residential cleaning service"
                  fill
                  className="object-cover rounded-3xl"
                  priority
                />
              </div>
            </div>
            <div className="text-center mt-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Residential Cleaning</h3>
            </div>
          </div>

          {/* Right Card - Commercial/Airbnb */}
          <div className="relative">
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl min-h-[500px] sm:min-h-[600px] relative overflow-hidden">
              <div className="absolute inset-0 w-full h-full">
                <Image
                  src="/images/deep-specialty.jpg"
                  alt="Commercial cleaning service"
                  fill
                  className="object-cover rounded-3xl"
                  priority
                />
              </div>
            </div>
            <div className="text-center mt-6">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Commercial Dashboard</h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
