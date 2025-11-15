import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Home, Sparkles, Building2, Calendar, BarChart3 } from "lucide-react";

export function HomeFlagshipServices() {
  const services = [
    {
      title: "Standard Cleaning",
      icon: Home,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "Deep Cleaning",
      icon: Sparkles,
      bgColor: "bg-pink-100",
      iconColor: "text-pink-600",
    },
    {
      title: "Airbnb Cleaning",
      icon: Building2,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Move In/Out",
      icon: Calendar,
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      title: "Commercial Cleaning",
      icon: BarChart3,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
            Where innovation meets <span className="font-playfair italic text-gray-400">aesthetics</span>
          </h2>
        </div>

        {/* Service Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6 mb-12 sm:mb-16">
          {services.map((service) => {
            const IconComponent = service.icon;
            return (
              <div
                key={service.title}
                className={`${service.bgColor} rounded-2xl p-6 sm:p-8 flex flex-col items-center text-center hover:scale-105 transition-transform duration-200`}
              >
                <div className={`${service.iconColor} mb-4`}>
                  <IconComponent className="w-10 h-10 sm:w-12 sm:h-12" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  {service.title}
                </h3>
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="bg-gray-900 rounded-2xl p-6 sm:p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <p className="text-white text-xl sm:text-2xl lg:text-3xl font-semibold">
                See Our Work in Action. Start Your Creative Journey with Us!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                className="bg-white text-gray-900 hover:bg-gray-100 rounded-full px-6 py-3 font-medium flex items-center gap-2"
                asChild
              >
                <Link href="/booking/service/select">
                  Let&apos;s Collaborate
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white/10 rounded-full px-6 py-3 font-medium flex items-center gap-2"
                asChild
              >
                <Link href="/services">
                  View Portfolio
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
