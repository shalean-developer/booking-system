'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Home, Briefcase, Heart, TrendingUp, Users, ArrowRight, Send } from "lucide-react";

export default function CareersPage() {
  const benefits = [
    { icon: TrendingUp, title: "Competitive Pay", description: "Fair compensation with performance bonuses" },
    { icon: Users, title: "Great Team", description: "Work with supportive, professional colleagues" },
    { icon: Heart, title: "Work-Life Balance", description: "Flexible scheduling to fit your lifestyle" },
    { icon: Briefcase, title: "Career Growth", description: "Training and advancement opportunities" }
  ];

  const positions = [
    { title: "Residential Cleaner", type: "Full-time / Part-time", location: "Cape Town", description: "Provide exceptional cleaning services for residential properties" },
    { title: "Commercial Cleaner", type: "Full-time", location: "Johannesburg", description: "Maintain cleanliness in offices and commercial spaces" },
    { title: "Team Leader", type: "Full-time", location: "Multiple Locations", description: "Lead and train cleaning teams, ensure quality standards" }
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
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Join Our Team</Badge>
            <h1 className="mb-6 text-5xl font-bold text-gray-900 sm:text-6xl">Build Your <span className="text-primary">Career</span></h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              Join a team that values excellence, integrity, and growth. We're looking for dedicated professionals to help us deliver exceptional service.
            </p>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Work With Us?</h2>
            <p className="text-xl text-gray-600">We invest in our team members' success and wellbeing</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;
              return (
                <Card key={benefit.title} className="border-0 shadow-lg text-center">
                  <CardContent className="p-6">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Open Positions</h2>
            <p className="text-xl text-gray-600">Find the perfect role for you</p>
          </div>
          <div className="space-y-6 mb-12">
            {positions.map((position) => (
              <Card key={position.title} className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{position.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <Badge variant="outline">{position.type}</Badge>
                        <span>{position.location}</span>
                      </div>
                      <p className="text-gray-600">{position.description}</p>
                    </div>
                    <Button className="bg-primary hover:bg-primary/90">
                      Apply Now<ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Apply Now</h2>
            <p className="text-xl text-gray-600">Submit your application and join our team</p>
          </div>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <form className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div><Label>First Name</Label><Input required /></div>
                  <div><Label>Last Name</Label><Input required /></div>
                </div>
                <div><Label>Email</Label><Input type="email" required /></div>
                <div><Label>Phone</Label><Input type="tel" required /></div>
                <div><Label>Position Applying For</Label><Input required /></div>
                <div><Label>Why do you want to join Shalean?</Label><Textarea rows={4} required /></div>
                <Button type="submit" size="lg" className="w-full bg-primary hover:bg-primary/90">
                  <Send className="mr-2 h-4 w-4" />Submit Application
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

