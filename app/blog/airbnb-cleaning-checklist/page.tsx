import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, ArrowLeft, ArrowRight, Calendar, Clock, CheckCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Complete Airbnb Turnover Cleaning Checklist | Shalean Blog",
  description: "Master Airbnb turnover cleaning with our comprehensive checklist. Ensure 5-star reviews with professional cleaning standards.",
};

export default function AirbnbChecklistPage() {
  const checklist = {
    "Kitchen": ["Clean and sanitize all surfaces", "Wipe down appliances inside and out", "Empty and clean refrigerator", "Wash dishes and put away", "Take out trash and replace liner", "Check pantry items and restock basics"],
    "Bathroom": ["Scrub toilet, sink, and shower/tub", "Replace towels and bath mats", "Restock toiletries", "Clean mirrors", "Empty trash", "Check for hair and deep clean drains"],
    "Bedroom": ["Change all linens and make beds", "Dust all surfaces", "Vacuum floors and carpets", "Check closets and drawers", "Fluff pillows", "Open windows to air out"],
    "Living Areas": ["Vacuum and/or mop floors", "Dust furniture and decorations", "Clean windows and mirrors", "Fluff cushions", "Remove any guest items", "Check for damages"]
  };

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
          <Badge className="mb-6 bg-primary/10 text-primary border-primary/20">Airbnb Hosts</Badge>
          <h1 className="mb-6 text-5xl font-bold text-gray-900">Complete Airbnb Turnover Cleaning Checklist</h1>
          <div className="flex items-center gap-6 text-gray-600 mb-8">
            <span className="flex items-center gap-2"><Calendar className="h-4 w-4" />October 10, 2025</span>
            <span className="flex items-center gap-2"><Clock className="h-4 w-4" />6 min read</span>
          </div>
          <div className="relative h-96 rounded-lg overflow-hidden">
            <Image src="/images/move-turnover.jpg" alt="Airbnb cleaning" fill className="object-cover" />
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-gray-600 mb-8">
              Successful Airbnb hosting depends on consistently delivering spotless, welcoming spaces. This comprehensive
              checklist ensures you never miss a detail and maintain those coveted 5-star reviews.
            </p>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Room-by-Room Checklist</h2>
            <div className="space-y-6 mb-12">
              {Object.entries(checklist).map(([room, tasks]) => (
                <Card key={room} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{room}</h3>
                    <ul className="space-y-3">
                      {tasks.map((task, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">{task}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mt-12 mb-6">Pro Tips for Quick Turnovers</h2>
            <div className="bg-blue-50 border-l-4 border-blue-600 p-6 rounded-r-lg mb-8">
              <ul className="space-y-2 text-gray-700">
                <li>• Keep a well-stocked cleaning caddy ready to go</li>
                <li>• Use a systematic approach—work top to bottom, left to right</li>
                <li>• Take photos after cleaning for your records</li>
                <li>• Consider professional cleaning for consistent quality</li>
              </ul>
            </div>

            <div className="bg-primary/5 border-l-4 border-primary p-6 rounded-r-lg">
              <p className="text-gray-700 italic">
                "We understand the tight turnaround times Airbnb hosts face. Our professional team can handle your turnover
                cleaning quickly and thoroughly, ensuring your property is always guest-ready."
              </p>
              <p className="text-sm text-gray-600 mt-2">— Shalean Airbnb Cleaning Services</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Need Reliable Airbnb Cleaning?</h2>
          <p className="text-xl text-gray-600 mb-8">Fast turnaround, consistent quality, happy guests</p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
            <Link href="/booking/service/select">Book Airbnb Cleaning<ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

