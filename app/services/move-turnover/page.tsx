import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowLeft, CheckCircle } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { getSeoConfig } from "@/lib/seo-config";

// Move turnover page metadata
export const metadata: Metadata = createMetadata(getSeoConfig("move-turnover"));

export default function MoveTurnoverPage() {
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
              Move & Turnover
            </Badge>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Calendar className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h1 className="mb-6 text-5xl font-bold text-gray-900">
              Move In/Out & Turnover Cleaning in Cape Town
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              Professional move-in/out and Airbnb turnover cleaning services in Cape Town. End of lease cleaning, same-day available. Serving Sea Point, Claremont, Constantia, and all Cape Town suburbs.
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
                    <h3 className="font-semibold text-gray-900 mb-2">Move-In/Out Cleaning</h3>
                    <p className="text-gray-600">
                      Complete cleaning for properties in transition, ensuring a fresh start.
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
                    <h3 className="font-semibold text-gray-900 mb-2">Airbnb Turnover</h3>
                    <p className="text-gray-600">
                      Quick, thorough cleaning between guests to maintain 5-star standards.
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
                    <h3 className="font-semibold text-gray-900 mb-2">Fast Turnaround</h3>
                    <p className="text-gray-600">
                      Efficient service to prepare your property quickly for new occupants.
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
            Book your move & turnover cleaning service today for seamless transitions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/booking/service/select">
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

