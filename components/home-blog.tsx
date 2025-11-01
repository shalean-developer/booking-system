import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

export function HomeBlog() {
  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <Badge className="bg-primary/10 text-primary border-primary/20 mb-3 sm:mb-4 text-xs sm:text-sm">
            Latest Insights
          </Badge>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            Cleaning Tips & Industry News
          </h2>
          <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
            Stay informed with our latest cleaning tips, industry insights, and expert advice for maintaining a spotless space.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12">
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="h-40 sm:h-48 relative bg-gradient-to-br from-primary/20 to-primary/40">
              <Image
                src="/images/deep-specialty.jpg"
                alt="Deep cleaning tips and techniques"
                width={400}
                height={300}
                className="w-full h-full object-cover"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Badge variant="outline" className="text-xs">Cleaning Tips</Badge>
                <span className="text-xs text-gray-500">5 min read</span>
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                10 Essential Deep Cleaning Tips for Every Home
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                Discover professional techniques to deep clean your home like an expert, from kitchen to bathroom.
              </p>
              <Link href="/blog/10-essential-deep-cleaning-tips-for-every-home">
                <Button variant="ghost" className="text-primary hover:bg-primary/10 p-0 text-sm sm:text-base">
                  Read Deep Cleaning Tips
                  <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="h-40 sm:h-48 relative bg-gradient-to-br from-blue-100 to-blue-200">
              <Image
                src="/images/home-maintenance.jpg"
                alt="Eco-friendly cleaning products"
                width={400}
                height={300}
                className="w-full h-full object-cover"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Badge variant="outline" className="text-xs">Sustainability</Badge>
                <span className="text-xs text-gray-500">4 min read</span>
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                The Benefits of Eco-Friendly Cleaning Products
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                Learn why switching to eco-friendly cleaning products is better for your health and the environment.
              </p>
              <Link href="/blog/eco-friendly-products">
                <Button variant="ghost" className="text-primary hover:bg-primary/10 p-0 text-sm sm:text-base">
                  Learn About Eco-Friendly Cleaning
                  <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
            <div className="h-40 sm:h-48 relative bg-gradient-to-br from-green-100 to-green-200">
              <Image
                src="/images/move-turnover.jpg"
                alt="Airbnb cleaning checklist"
                width={400}
                height={300}
                className="w-full h-full object-cover"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Badge variant="outline" className="text-xs">Airbnb Hosts</Badge>
                <span className="text-xs text-gray-500">6 min read</span>
              </div>
              <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-2 sm:mb-3">
                Complete Airbnb Turnover Cleaning Checklist
              </h3>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                Master the art of Airbnb turnover with our comprehensive cleaning checklist for 5-star reviews.
              </p>
              <Link href="/blog/airbnb-cleaning-checklist">
                <Button variant="ghost" className="text-primary hover:bg-primary/10 p-0 text-sm sm:text-base">
                  View Airbnb Cleaning Checklist
                  <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
        <div className="text-center">
          <Link href="/blog">
            <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary/10 px-6 py-3 sm:px-8 sm:py-4 text-sm sm:text-base">
              View All Articles
              <ArrowRight className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
