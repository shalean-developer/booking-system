import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function BlogPostCTA() {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/10 via-primary/15 to-primary/20 relative overflow-hidden">
      <div className="absolute inset-0 bg-white/50"></div>
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative">
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
          Ready for a Professional Clean?
        </h2>
        <p className="text-xl text-gray-600 mb-10 leading-relaxed">
          Let our expert team handle your cleaning needs
        </p>
        <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-10 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1" asChild>
          <Link href="/booking/service/select">
            Book a Service
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
