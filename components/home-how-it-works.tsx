import { UserPlus, Plug, Users, Clock } from "lucide-react";

export function HomeHowItWorks() {
  const steps = [
    {
      number: "01",
      icon: UserPlus,
      title: "Sign Up and Customize",
      description: "Start by signing up for our cleaning service platform and customize to fit your business needs. Set up your account, configure settings and personalize the service according to your requirements.",
    },
    {
      number: "02",
      icon: Plug,
      title: "Seamlessly Integrate",
      description: "Integrate our cleaning services with your existing systems and tools. Streamline workflows, synchronize schedules, and break down silos by connecting different aspects of your business ecosystem.",
    },
    {
      number: "03",
      icon: Users,
      title: "Collaborate and Thrive",
      description: "Experience the flexibility of accessing our cleaning platform anytime, anywhere, on any device, enabling seamless collaboration and productivity across locations.",
    },
    {
      number: "04",
      icon: Clock,
      title: "Access Anytime",
      description: "Enjoy 24/7 access to our booking platform, manage your cleaning schedules, track service history, and communicate with your assigned cleaners whenever you need.",
    },
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-sm sm:text-base font-semibold text-purple-600 uppercase tracking-wider mb-4">
            HOW IT WORKS
          </h2>
          <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Streamlining Your Business Processes
          </h3>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="bg-white border border-gray-200 rounded-2xl p-6 lg:p-8 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-3xl font-bold text-purple-600">{step.number}</span>
                  <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h4>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

