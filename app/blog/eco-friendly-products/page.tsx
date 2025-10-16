import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, ArrowLeft, ArrowRight, Calendar, Clock, CheckCircle, Leaf } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "The Benefits of Eco-Friendly Cleaning Products | Shalean Blog",
  description: "Discover why eco-friendly cleaning products are better for your health and environment. Learn about safe, effective alternatives from cleaning experts.",
};

export default function EcoFriendlyProductsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-2xl font-bold text-primary">Shalean</div>
              <span className="text-sm text-gray-500">Cleaning Services</span>
            </Link>
            <Button variant="outline" asChild>
              <Link href="/blog"><ArrowLeft className="mr-2 h-4 w-4" />Back to Blog</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <Badge className="mb-6 bg-green-100 text-green-700 border-green-200">Sustainability</Badge>
          <h1 className="mb-6 text-5xl font-bold text-gray-900">The Benefits of Eco-Friendly Cleaning Products</h1>
          <div className="flex items-center gap-6 text-gray-600 mb-8">
            <span className="flex items-center gap-2"><Calendar className="h-4 w-4" />October 12, 2025</span>
            <span className="flex items-center gap-2"><Clock className="h-4 w-4" />4 min read</span>
          </div>
          <div className="relative h-96 rounded-lg overflow-hidden">
            <Image src="/images/home-maintenance.jpg" alt="Eco-friendly cleaning" fill className="object-cover" />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-gray-600 mb-8">
              The shift towards eco-friendly cleaning products isn't just a trend—it's a necessary step towards healthier homes
              and a sustainable planet. Traditional cleaning products often contain harsh chemicals that can impact both human
              health and the environment. Here's why making the switch matters.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Health Benefits</h2>
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {[
                { title: "Reduced Allergies", desc: "Fewer harsh chemicals mean less respiratory irritation" },
                { title: "Safer for Children", desc: "Non-toxic formulas protect curious little ones" },
                { title: "Better Air Quality", desc: "No harmful fumes lingering in your home" },
                { title: "Skin-Friendly", desc: "Gentler on hands and sensitive skin" }
              ].map((benefit, i) => (
                <Card key={i} className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3">
                      <Leaf className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-gray-900 mb-2">{benefit.title}</h3>
                        <p className="text-gray-600 text-sm">{benefit.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Environmental Impact</h2>
            <p className="text-gray-600 mb-6">
              Eco-friendly products minimize environmental harm through:
            </p>
            <ul className="space-y-3 mb-8">
              {["Biodegradable ingredients that break down naturally", "Reduced water pollution from runoff", "Lower carbon footprint in production", "Sustainable packaging and reduced plastic waste"].map((point, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <span className="text-gray-600">{point}</span>
                </li>
              ))}
            </ul>

            <div className="bg-green-50 border-l-4 border-green-600 p-6 rounded-r-lg mb-8">
              <p className="text-gray-700 italic">
                "At Shalean, we exclusively use eco-friendly, professional-grade cleaning products that are tough on dirt
                but gentle on your home and the planet."
              </p>
              <p className="text-sm text-gray-600 mt-2">— Shalean Cleaning Services</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Experience Eco-Friendly Cleaning</h2>
          <p className="text-xl text-gray-600 mb-8">Book a service with 100% eco-friendly products</p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
            <Link href="/booking/service/select">Book Now<ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

