import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  CheckCircle
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "10 Essential Deep Cleaning Tips for Every Home | Shalean Blog",
  description: "Professional deep cleaning techniques to transform your home. Expert tips for kitchen, bathroom, and every room from Shalean's cleaning professionals.",
};

export default function DeepCleaningTipsPage() {
  const tips = [
    {
      title: "Start from Top to Bottom",
      description: "Always clean from ceiling to floor to avoid re-cleaning lower surfaces. Dust ceiling fans, light fixtures, and high shelves first."
    },
    {
      title: "Tackle the Kitchen Thoroughly",
      description: "Clean inside your oven, refrigerator, and dishwasher. Don't forget behind appliances where grease and dust accumulate."
    },
    {
      title: "Deep Clean Bathrooms",
      description: "Scrub grout lines, descale showerheads, and clean behind toilets. Use appropriate cleaners for different surfaces."
    },
    {
      title: "Refresh Carpets and Upholstery",
      description: "Vacuum thoroughly, then steam clean or use appropriate cleaning solutions for fabric furniture and carpets."
    },
    {
      title: "Windows and Mirrors",
      description: "Clean both sides of windows, frames, and sills. Use streak-free glass cleaner for a crystal-clear finish."
    },
    {
      title: "Organize as You Clean",
      description: "Declutter each room before deep cleaning. Donate or discard items you no longer need."
    },
    {
      title: "Clean Air Vents and Filters",
      description: "Remove dust from air vents and replace or clean HVAC filters to improve air quality."
    },
    {
      title: "Baseboards and Trim",
      description: "Wipe down all baseboards, door frames, and window trim. These areas collect surprising amounts of dust."
    },
    {
      title: "Mattresses and Bedding",
      description: "Vacuum mattresses, wash all bedding including pillows, and flip or rotate mattresses."
    },
    {
      title: "Don't Forget Hidden Areas",
      description: "Clean under furniture, behind doors, inside closets, and other often-overlooked spaces."
    }
  ];

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
            <Button variant="outline" asChild>
              <Link href="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Article Hero */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Badge className="bg-primary/10 text-primary border-primary/20">
              Cleaning Tips
            </Badge>
          </div>
          <h1 className="mb-6 text-5xl font-bold text-gray-900">
            10 Essential Deep Cleaning Tips for Every Home
          </h1>
          <div className="flex items-center gap-6 text-gray-600 mb-8">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              October 15, 2025
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              5 min read
            </span>
          </div>
          <div className="relative h-96 rounded-lg overflow-hidden">
            <Image
              src="/images/deep-specialty.jpg"
              alt="Deep cleaning tips"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-gray-600 mb-8">
              Deep cleaning goes beyond your regular tidying routine. It's about tackling the areas
              that don't get attention during weekly cleaning sessions. Whether you're preparing for
              a special occasion, changing seasons, or just want a fresh start, these professional
              tips will help you achieve a thoroughly clean home.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">
              Professional Deep Cleaning Techniques
            </h2>

            <div className="space-y-6 mb-12">
              {tips.map((tip, index) => (
                <Card key={index} className="border-0 shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{tip.title}</h3>
                        <p className="text-gray-600">{tip.description}</p>
                      </div>
                      <CheckCircle className="h-6 w-6 text-primary flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">
              When to Call the Professionals
            </h2>

            <p className="text-gray-600 mb-6">
              While these tips will help you maintain a clean home, professional deep cleaning services
              offer several advantages:
            </p>

            <ul className="space-y-3 mb-8">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <span className="text-gray-600">Professional-grade equipment and eco-friendly cleaning products</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <span className="text-gray-600">Trained experts who know the most effective techniques</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <span className="text-gray-600">Time savings—focus on what matters while we handle the cleaning</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                <span className="text-gray-600">Consistent, high-quality results every time</span>
              </li>
            </ul>

            <div className="bg-primary/5 border-l-4 border-primary p-6 rounded-r-lg mb-8">
              <p className="text-gray-700 italic">
                "Regular deep cleaning not only keeps your home looking beautiful but also contributes
                to better indoor air quality and a healthier living environment for your family."
              </p>
              <p className="text-sm text-gray-600 mt-2">— Shalean Cleaning Experts</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready for a Professional Deep Clean?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Let our expert team handle your deep cleaning needs
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
            <Link href="/booking/service/select">
              Book Deep Cleaning Service
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

