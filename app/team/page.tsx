import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, ArrowRight, Star } from "lucide-react";
import type { Metadata } from "next";
import { createMetadata, generateCanonical } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Our Team | Shalean Cleaning Services — Meet the Professional Cleaning Experts Behind Shalean. Experienced, Trained, and Dedicated to Exceptional Service with Years of Experience and Customer Satisfaction",
  description: "Meet the professional cleaning experts behind Shalean. Experienced, trained, and dedicated to exceptional service. Years of experience, customer satisfaction, professional training, and commitment to quality.",
  canonical: generateCanonical("/team"),
});

export default function TeamPage() {
  const team = [
    {
      name: "Normatter",
      image: "/images/team-normatter.webp",
      testimonial: "Normatter's team transformed our office completely. The attention to detail and eco-friendly approach exceeded our expectations. Highly recommend!",
      client: "Sarah M., Corporate Client"
    },
    {
      name: "Lucia",
      image: "/images/team-lucia.webp",
      testimonial: "Lucia's commercial cleaning service is outstanding. Our restaurant has never looked cleaner. Professional, reliable, and thorough every time.",
      client: "David K., Restaurant Owner"
    },
    {
      name: "Nyasha",
      image: "/images/team-nyasha.webp",
      testimonial: "Nyasha's residential cleaning is exceptional. My home feels brand new after every visit. Trustworthy, efficient, and incredibly thorough.",
      client: "Jennifer L., Homeowner"
    }
  ];

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
              <Link href="/"><Home className="mr-2 h-4 w-4" />Back to Home</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="py-20 bg-gradient-to-b from-primary/5 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Our Team</Badge>
            <h1 className="mb-6 text-5xl font-bold text-gray-900 sm:text-6xl">Meet the <span className="text-primary">Experts</span></h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              Our professional cleaners are trained, certified, and dedicated to delivering exceptional service with care and attention to detail.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member) => (
              <Card key={member.name} className="border-0 shadow-lg text-center">
                <CardContent className="p-6">
                  <div className="w-32 h-32 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
                    <Image src={member.image} alt={member.name} width={128} height={128} className="w-full h-full object-cover" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{member.name}</h3>
                  <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-primary text-left">
                    <div className="flex gap-1 mb-2">
                      {[...Array(5)].map((_, i) => (<Star key={i} className="h-4 w-4 text-amber-400 fill-current" />))}
                    </div>
                    <p className="italic text-gray-700 mb-3 text-sm">"{member.testimonial}"</p>
                    <p className="text-xs text-gray-500 font-medium">— {member.client}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">Join Our Team</h2>
          <p className="text-xl text-gray-600 mb-8">
            We're always looking for dedicated professionals to join our growing team
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
              <Link href="/careers">View Open Positions<ArrowRight className="ml-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 px-8 py-4 text-lg" asChild>
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

