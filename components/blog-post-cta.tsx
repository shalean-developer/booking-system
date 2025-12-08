import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

interface BlogPostCTAProps {
  relatedServices?: Array<{ title: string; href: string }>;
}

export function BlogPostCTA({ relatedServices }: BlogPostCTAProps = {}) {
  const defaultServices = [
    { title: "Deep Cleaning", href: "/services/deep-cleaning" },
    { title: "Regular Cleaning", href: "/services/regular-cleaning" },
    { title: "Move In/Out Cleaning", href: "/services/move-turnover" },
  ];

  const servicesToShow = relatedServices && relatedServices.length > 0 
    ? relatedServices.slice(0, 3) 
    : defaultServices;

  return (
    <section className="py-20 bg-gradient-to-br from-primary/10 via-primary/15 to-primary/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-white/50"></div>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative">
        <div className="flex items-center justify-center mb-4">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Ready for a Professional Clean?
        </h2>
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          Let our expert team handle your cleaning needs. Book trusted cleaners in <Link href="/location/cape-town" className="text-primary hover:underline font-medium">Cape Town</Link>, <Link href="/location/johannesburg" className="text-primary hover:underline font-medium">Johannesburg</Link>, <Link href="/location/pretoria" className="text-primary hover:underline font-medium">Pretoria</Link>, and <Link href="/location/durban" className="text-primary hover:underline font-medium">Durban</Link>.
        </p>
        
        {/* Related Services Quick Links */}
        <div className="mb-10 flex flex-wrap justify-center gap-3">
          {servicesToShow.map((service) => (
            <Link
              key={service.href}
              href={service.href}
              className="px-4 py-2 bg-white/80 hover:bg-white border border-primary/20 rounded-lg text-sm font-medium text-gray-700 hover:text-primary transition-colors"
            >
              {service.title}
            </Link>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-10 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1" asChild>
            <Link href="/booking/service/select">
              Book a Service
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 bg-white px-10 py-4 text-lg" asChild>
            <Link href="/location/cape-town">
              View Service Areas
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
