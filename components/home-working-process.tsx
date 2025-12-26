'use client';

const steps = [
  {
    id: 1,
    number: '1',
    title: 'Book Online Form',
    description: 'Schedule your cleaning in minutes with our easy-to-use online booking form.',
  },
  {
    id: 2,
    number: '2',
    title: 'Get Expert Cleaner',
    description: 'Connect with skilled professionals ready to transform your space.',
  },
  {
    id: 3,
    number: '3',
    title: 'Enjoy Cleanliness',
    description: 'Sit back and experience the comfort of a spotless, refreshed, and hygienic space.',
  },
];

export function HomeWorkingProcess() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header Section */}
        <div className="text-center mb-12 sm:mb-16">
          {/* Our working process Button */}
          <button className="inline-flex items-center px-6 py-2 bg-gray-100 border border-gray-300 text-gray-700 font-medium rounded-full mb-6">
            Our working process
          </button>

          {/* Main Heading */}
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            How It Works
          </h2>

          {/* Description */}
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Getting started is simple. Follow these easy steps to book your cleaning service and enjoy a spotless space.
          </p>
        </div>

        {/* Three-Step Process Section */}
        <div className="relative max-w-5xl mx-auto">
          {/* Steps Grid */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {/* Connecting Line - Desktop */}
            <div className="hidden md:block absolute top-8 left-[12.5%] right-[12.5%] h-0.5 border-t-2 border-dashed border-blue-500 z-0"></div>

            {steps.map((step, index) => (
              <div key={step.id} className="relative flex flex-col items-center z-10">
                {/* Numbered Circle */}
                <div className="w-16 h-16 flex items-center justify-center bg-white border border-gray-300 rounded-full mb-6">
                  <span className="text-2xl font-semibold text-gray-900">{step.number}</span>
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 text-center">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-base text-gray-600 leading-relaxed text-center">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
