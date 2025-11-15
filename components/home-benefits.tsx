import { Users, Shield, RefreshCw, Smartphone } from "lucide-react";

export function HomeBenefits() {
  const benefits = [
    {
      icon: Users,
      title: "Enhanced Collaboration",
      description: "Boost collaboration with advanced features for seamless teamwork and communication between clients and cleaners.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      icon: Shield,
      title: "Data Security and Reliability",
      description: "Trust our robust security measures and reliable infrastructure for robust data security and integrity of your booking information.",
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      icon: RefreshCw,
      title: "Seamless Updates & Maintenance",
      description: "Experience seamless updates and maintenance for peak performance and functionality of our booking platform.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      icon: Smartphone,
      title: "Accessibility & Mobility",
      description: "Enjoy easy accessibility and mobility with multi-platform access, allowing you to book and manage services anytime, anywhere.",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-sm sm:text-base font-semibold text-purple-600 uppercase tracking-wider mb-4">
            BENEFITS
          </h2>
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Unlocking Key Benefits For Your Business Success
          </h3>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div key={index} className="text-center">
                <div className={`${benefit.bgColor} w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6`}>
                  <Icon className={`w-8 h-8 ${benefit.color}`} />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">{benefit.title}</h4>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

