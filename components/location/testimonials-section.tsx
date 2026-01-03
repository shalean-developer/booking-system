import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

type TestimonialItem = {
  name: string;
  content: string;
  rating?: number;
  location?: string;
};

interface TestimonialsSectionProps {
  suburb: string;
  area: string;
  testimonialItems: TestimonialItem[];
}

export function TestimonialsSection({
  suburb,
  area,
  testimonialItems,
}: TestimonialsSectionProps) {
  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What {suburb} Customers Say
          </h2>
          <p className="text-xl text-gray-600">
            Recent feedback from homeowners and businesses in the {area}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {testimonialItems.map((testimonial, index) => {
            const ratingValue = Math.min(Math.max(testimonial.rating ?? 5, 1), 5);
            return (
              <Card key={`${testimonial.name}-${index}`} className="border border-primary/10 shadow-lg transition-all hover:-translate-y-1 hover:shadow-2xl h-full">
                <CardContent className="p-8 flex h-full flex-col gap-4">
                  <div className="flex items-center gap-1 text-amber-500">
                    {Array.from({ length: ratingValue }).map((_, starIdx) => (
                      <Star key={starIdx} className="h-4 w-4 text-amber-500 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed">{testimonial.content}</p>
                  <div className="mt-auto">
                    <p className="font-semibold text-gray-900">{testimonial.name}</p>
                    {testimonial.location && (
                      <p className="text-sm text-gray-500">{testimonial.location}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}

