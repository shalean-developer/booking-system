import { Badge } from "@/components/ui/badge";

export function QuoteHero() {
  return (
    <header className="mb-6 sm:mb-8 text-center">
      <Badge className="mb-3 sm:mb-4 bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm">
        Free Quote Request
      </Badge>
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 px-2">
        Get Your Free Cleaning Quote
      </h1>
      <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-600 px-4">
        Tell us about your cleaning needs and we&apos;ll get back to you with a personalized quote
      </p>
    </header>
  );
}
