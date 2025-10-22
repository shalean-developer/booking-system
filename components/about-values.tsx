import { Card, CardContent } from "@/components/ui/card";
import { Star, Shield, Heart, Target } from "lucide-react";

export function AboutValues() {
  const values = [
    { icon: Star, title: "Excellence", description: "We deliver consistently high-quality service on every job" },
    { icon: Shield, title: "Trust", description: "Insured, bonded, and background-checked professionals" },
    { icon: Heart, title: "Care", description: "We treat every home as if it were our own" },
    { icon: Target, title: "Reliability", description: "On-time service and transparent communication" }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
          <p className="text-xl text-gray-600">The principles that guide everything we do</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {values.map((value) => {
            const Icon = value.icon;
            return (
              <Card key={value.title} className="border-0 shadow-lg text-center">
                <CardContent className="p-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
