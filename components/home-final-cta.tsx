import Link from "next/link";
import { Button } from "@/components/ui/button";

export function HomeFinalCTA() {
  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gradient-to-r from-primary/10 to-primary/20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
          Ready to Experience Spotless Living?
        </h2>
        <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8">
          Join thousands of satisfied customers who have transformed their spaces with Shalean.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg" asChild>
            <Link href="/booking/service/select">
              Book a service
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10 bg-white rounded-full px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg" asChild>
            <Link href="/booking/service/select">
              Get Free Quote
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
