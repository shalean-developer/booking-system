import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, ArrowLeft, CheckCircle } from "lucide-react";

export const metadata = {
  title: "Home Maintenance | Shalean Cleaning Services",
  description: "Regular home cleaning for ongoing upkeep. Ideal for one-off or recurring visits.",
};

export default function HomeMaintenancePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-2xl font-bold text-primary">Shalean</div>
              <span className="text-sm text-gray-500">Cleaning Services</span>
            </Link>
            <Link href="/">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="bg-primary/10 text-primary border-primary/20 mb-4">
              Home Maintenance
            </Badge>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Home className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h1 className="mb-6 text-5xl font-bold text-gray-900">
              Home Maintenance
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              Regular home cleaning for ongoing upkeep. Ideal for one-off or recurring visits.
            </p>
            <Link href="/booking/quote">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
                Get Free Quote
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
            What&apos;s Included
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="p-6 border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Regular Cleaning</h3>
                    <p className="text-gray-600">
                      Routine cleaning to maintain your home&apos;s cleanliness and organization.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="p-6 border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Flexible Scheduling</h3>
                    <p className="text-gray-600">
                      Choose one-off visits or set up recurring appointments that fit your schedule.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="p-6 border-0 shadow-lg">
              <CardContent className="p-0">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Customizable</h3>
                    <p className="text-gray-600">
                      Tailor the service to focus on the areas that matter most to you.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Book your home maintenance cleaning service today and enjoy a spotless home.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/booking">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white">
                Book Now
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="outline">
                Explore Other Services
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

