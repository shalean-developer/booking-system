import { Card, CardContent } from "@/components/ui/card";

export function AboutStats() {
  const stats = [
    { number: "2,500+", label: "Happy Customers" },
    { number: "98%", label: "Satisfaction Rate" },
    { number: "50+", label: "Expert Cleaners" },
    { number: "5,000+", label: "Cleans Completed" }
  ];

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Impact</h2>
          <p className="text-xl text-gray-600">Numbers that reflect our commitment to excellence</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-0 shadow-lg text-center">
              <CardContent className="p-8">
                <div className="text-4xl font-bold text-primary mb-2">{stat.number}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
