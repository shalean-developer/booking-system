import { Plug, Workflow, Users } from "lucide-react";

export function HomeFeatures() {
  const features = [
    {
      icon: Plug,
      title: "Integrations",
      description: "Effortlessly integrate our cleaning services with your property management systems for streamlined operations and enhanced efficiency.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      icon: Workflow,
      title: "Workflows",
      description: "Automate scheduling tasks, improve collaboration, and enhance efficiency with streamlined cleaning workflows tailored to your needs.",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      icon: Users,
      title: "Community",
      description: "Connect, collaborate, and engage with our vibrant community of satisfied customers and professional cleaners.",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-sm sm:text-base font-semibold text-purple-600 uppercase tracking-wider mb-4">
            FEATURES
          </h2>
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Scale Your Business With Our Intuitive Cleaning Platform
          </h3>
          <p className="mx-auto max-w-3xl text-base sm:text-lg text-gray-600 leading-relaxed">
            Our comprehensive cleaning service platform offers everything you need to maintain pristine spaces 
            and streamline your operations with ease.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="text-center">
                <div className={`${feature.bgColor} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                  <Icon className={`w-8 h-8 ${feature.color}`} />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h4>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

