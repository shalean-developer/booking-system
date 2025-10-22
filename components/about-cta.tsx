import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function AboutCTA() {
  return (
    <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-6">Join Thousands of Satisfied Customers</h2>
        <p className="text-xl text-gray-600 mb-8">Experience the Shalean difference today</p>
        <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
          <Link href="/booking/service/select">Book Your Service<ArrowRight className="ml-2 h-5 w-5" /></Link>
        </Button>
      </div>
    </section>
  );
}
