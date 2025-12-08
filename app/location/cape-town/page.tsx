import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CheckCircle,
  FileCheck2,
  Heart,
  Home,
  Leaf,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { Header } from "@/components/header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { createMetadata, generateCanonical } from "@/lib/metadata";
import { getCityAreas } from "@/lib/location-data";
import { stringifyStructuredData } from "@/lib/structured-data-validator";

const stats = [
  { label: "Cape Town homes served", value: "500+", icon: Home },
  { label: "Customer satisfaction", value: "98%", icon: Heart },
  { label: "Professional cleaners", value: "50+", icon: Users },
  { label: "Years trusted locally", value: "10", icon: ShieldCheck },
];

const serviceHighlights = [
  {
    title: "Regular Cleaning",
    description:
      "Weekly and bi-weekly housekeeping tailored to apartments, family homes, and Airbnb properties.",
    href: "/services/regular-cleaning",
  },
  {
    title: "Deep Cleaning",
    description:
      "Intensive deep cleans for seasonal refreshes, renovations, move-ins, and special events.",
    href: "/services/deep-specialty",
  },
  {
    title: "Move In / Out",
    description:
      "Detailed pre- and post-occupation cleaning that helps you secure deposits and pass inspections.",
    href: "/services/move-turnover",
  },
];

const reasons = [
  {
    title: "Expert, Vetted Cleaners",
    description:
      "Every Cape Town cleaner is background-checked, professionally trained, and receives continual quality reviews.",
    icon: BadgeCheck,
  },
  {
    title: "Eco-Friendly Products",
    description:
      "Non-toxic supplies are available on request to protect your family, pets, and the environment.",
    icon: Leaf,
  },
  {
    title: "Insured & Reliable",
    description:
      "Comprehensive insurance, punctual arrivals, and 24/7 support keep your home and schedule protected.",
    icon: ShieldCheck,
  },
  {
    title: "Quality Guaranteed",
    description:
      "We stand behind every clean. If something’s missed, we return to make it right—no questions asked.",
    icon: CheckCircle,
  },
];

const packages = [
  {
    title: "Home Maintenance",
    description: "Best for weekly upkeep and busy families who want consistent support.",
    price: "From R499 / visit",
    features: ["Weekly or bi-weekly visits", "Laundry & linen add-ons", "Flexible rescheduling"],
    image: "/images/home-maintenance.jpg",
  },
  {
    title: "Deep & Specialty",
    description: "Ideal for spring cleaning, renovation resets, and pre-event detailing.",
    price: "Custom pricing",
    features: ["High-touch disinfection", "Appliance & interior detailing", "Special surfaces care"],
    image: "/images/deep-specialty.jpg",
  },
  {
    title: "Move & Turnover",
    description: "Perfect for landlords, agencies, and tenants needing handover-ready results.",
    price: "From R899 / clean",
    features: ["Checklist-based detailing", "Inside cupboards, ovens & fridges", "Photo-ready finishes"],
    image: "/images/move-turnover.jpg",
  },
];

const testimonials = [
  {
    name: "Gerald T.",
    role: "Sea Point homeowner",
    quote:
      "We’ve had Shalean for over a year—every visit is spotless and the team is always on time. Booking is effortless.",
    rating: 5,
  },
  {
    name: "Samira P.",
    role: "Airbnb host in Gardens",
    quote:
      "Their turnover cleans keep our reviews glowing. The cleaners note every detail and communicate instantly. Our Gardens property gets booked constantly, and Shalean ensures every guest arrives to a spotless space.",
    rating: 5,
  },
  {
    name: "Daniel C.",
    role: "Renovation project manager",
    quote:
      "They handled our post-renovation deep clean on short notice and left the property ready for handover. Working on projects across Cape Town, I trust Shalean for consistent quality whether it's a Sea Point apartment or Constantia estate.",
    rating: 5,
  },
  {
    name: "Sarah M.",
    role: "Claremont family",
    quote:
      "As a busy mom in Claremont, Shalean's regular cleaning service is a lifesaver. The cleaners know our home, work around our schedule, and always leave everything sparkling. Our kids love how clean the house feels after their visits.",
    rating: 5,
  },
  {
    name: "Michael R.",
    role: "Camps Bay property owner",
    quote:
      "Our Camps Bay rental property requires frequent turnover cleaning, and Shalean delivers every time. They understand the high standards needed for luxury properties and always exceed expectations. Our guests consistently comment on how clean the place is.",
    rating: 5,
  },
];

const team = [
  {
    name: "Nomatter",
    role: "Lead Cleaner • City Bowl",
    bio: "Seven years of Cape Town experience with a passion for eco-friendly products and hotel-standard finishes.",
    image: "/images/team-normatter.webp",
  },
  {
    name: "Lucia",
    role: "Guest Experience Lead",
    bio: "Ensures every visit runs smoothly, from matching you with the right cleaner to post-clean follow-ups.",
    image: "/images/team-lucia.webp",
  },
  {
    name: "Nyasha",
    role: "Quality Supervisor • Southern Suburbs",
    bio: "Trains and supports our teams with regular on-site quality checks and coaching.",
    image: "/images/team-nyasha.webp",
  },
];

const faqs = [
  {
    question: "How do I book a Cape Town cleaner?",
    answer:
      "Choose your service, tell us about your home, and pick a time. We’ll confirm your cleaner and keep you updated every step of the way.",
  },
  {
    question: "Can I request the same cleaner each time?",
    answer:
      "Yes. Regular clients are matched with a dedicated cleaner whenever schedules align. We’ll communicate if we need to send a trusted backup.",
  },
  {
    question: "Do you bring your own supplies?",
    answer:
      "Your cleaner arrives with professional-grade supplies. Eco-friendly products and equipment like vacuum cleaners can be added on request.",
  },
  {
    question: "What happens if I need to reschedule?",
    answer:
      "You can reschedule up to 24 hours before your appointment without penalty. For emergencies, contact our support team and we’ll assist.",
  },
];

const blogPosts = [
  {
    title: "Deep Cleaning Guide for Cape Town",
    href: "/blog/deep-cleaning-cape-town",
    image: "/images/deep-specialty.jpg",
    excerpt: "Complete guide to deep cleaning your Cape Town home with expert tips and room-by-room checklists.",
  },
  {
    title: "The Benefits of Eco-Friendly Cleaning Products",
    href: "/blog/the-benefits-of-eco-friendly-cleaning-products",
    image: "/images/home-maintenance.jpg",
    excerpt: "Learn why eco-friendly cleaning products are better for your health, home, and environment.",
  },
  {
    title: "Complete Airbnb Turnover Cleaning Checklist",
    href: "/blog/airbnb-cleaning-checklist",
    image: "/images/move-turnover.jpg",
    excerpt: "Master the art of Airbnb turnover cleaning with our comprehensive checklist for 5-star reviews.",
  },
];

export const metadata: Metadata = createMetadata({
  title: "Cape Town Cleaning Services | All Suburbs | Shalean",
  description:
    "Professional cleaning services across all Cape Town suburbs. Book vetted cleaners for regular housekeeping, deep cleaning, move in/out, and Airbnb turnovers. Same-day available. From R250. Serving Sea Point, Claremont, Constantia, Camps Bay & 50+ suburbs.",
  canonical: generateCanonical("/location/cape-town"),
  keywords: [
    "cleaning services Cape Town",
    "house cleaning Cape Town",
    "office cleaning Cape Town",
    "deep cleaning Cape Town",
    "Airbnb cleaning Cape Town",
    "move out cleaning Cape Town",
    "professional cleaners Cape Town",
    "maid service Cape Town",
    "cleaning services Sea Point",
    "cleaning services Claremont",
    "cleaning services Constantia",
    "cleaning services Camps Bay"
  ],
});

export default function CapeTownPage() {
  const areas = getCityAreas("Cape Town");

  // FAQ schema for location hub page
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: stringifyStructuredData(faqSchema, "FAQPage") }}
      />
      <Header />

      <main>
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-white to-white">
          <div className="absolute inset-0 -z-10 opacity-40">
            <div className="mx-auto h-full max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="absolute inset-y-0 right-0 hidden w-1/2 rounded-bl-[4rem] bg-primary/5 sm:block" />
            </div>
          </div>
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:flex lg:items-center lg:gap-14 lg:px-8 lg:py-24">
            <div className="max-w-2xl">
              <Badge className="mb-4 bg-green-500/10 text-green-600 border-green-500/20">
                Serving 50+ Cape Town suburbs
              </Badge>
              <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Book Trusted Cleaning Services in <span className="text-primary">Cape Town</span>
              </h1>
              <p className="mb-8 text-lg text-gray-600 sm:text-xl">
                From Atlantic Seaboard apartments to Southern Suburbs family homes, Shalean brings
                hotel-level cleaning, vetted professionals, and flexible scheduling to every Cape
                Town neighbourhood. Whether you're in Sea Point, Claremont, Constantia, Camps Bay, or any of our 50+ service areas, 
                our professional cleaners deliver consistent, high-quality results that keep your home spotless.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Button size="lg" className="px-8 py-4 text-lg" asChild>
                  <Link href="/booking/service/select">
                    Book a Clean
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-4 text-lg border-primary text-primary hover:bg-primary/10"
                  asChild
                >
                  <Link href="#packages">See Packages</Link>
                </Button>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white/70 px-5 py-4 shadow-sm backdrop-blur"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                      <p className="text-sm text-gray-500">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative mt-12 hidden flex-1 items-center justify-end lg:mt-0 lg:flex">
              <div className="relative h-[420px] w-full max-w-xl overflow-hidden rounded-[3rem] bg-primary/5 shadow-xl">
                <Image
                  src="/images/cleaning-team-hero.jpg"
                  alt="Professional cleaning team serving Cape Town homes and offices - Shalean Cleaning Services"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[1fr,1.1fr] lg:items-center">
              <div>
                <h2 className="text-3xl font-bold sm:text-4xl">
                  Cape Town cleaning services tailored to your home, pace, and lifestyle
                </h2>
                <p className="mt-4 text-lg text-gray-600">
                  Choose the visit frequency, products, and add-ons you prefer. Your dedicated
                  Shalean cleaner keeps your home sparkling while you focus on what matters.
                </p>
                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-3 rounded-xl bg-white p-5 shadow-sm">
                    <Sparkles className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">Custom checklists</p>
                      <p className="text-sm text-gray-600">
                        Save personal preferences and special instructions once—your cleaner keeps
                        them on file.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl bg-white p-5 shadow-sm">
                    <CalendarCheck className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">Flexible scheduling</p>
                      <p className="text-sm text-gray-600">
                        Book one-off, recurring, or urgent appointments with instant confirmation
                        and reminders.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl bg-white p-5 shadow-sm">
                    <FileCheck2 className="mt-1 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold">Transparent pricing</p>
                      <p className="text-sm text-gray-600">
                        No surprise fees—see your final price before you book and pay securely
                        online.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {serviceHighlights.map((service) => (
                  <Card
                    key={service.title}
                    className="border-0 bg-white shadow-lg shadow-primary/10 transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <Home className="h-5 w-5" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{service.title}</h3>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 text-sm text-gray-600">
                      {service.description}
                    </CardContent>
                    <CardFooter>
                      <Button variant="link" className="px-0 text-primary" asChild>
                        <Link href={service.href}>Learn more</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold sm:text-4xl">Why Cape Town homeowners choose Shalean</h2>
              <p className="mt-4 text-lg text-gray-600">
                High-performing cleaners, dependable service, and a team dedicated to your peace of mind.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {reasons.map((reason) => (
                <Card key={reason.title} className="border border-gray-100 bg-white shadow-sm">
                  <CardHeader>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <reason.icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-gray-900">{reason.title}</h3>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm text-gray-600">{reason.description}</CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <Badge className="mb-3 bg-primary/10 text-primary border-primary/10">Neighbourhoods</Badge>
              <h2 className="text-3xl font-bold sm:text-4xl">Cleaning services across Cape Town</h2>
              <p className="mt-3 text-lg text-gray-600">
                From the Atlantic Seaboard to Northern Suburbs, we cover every major neighbourhood with trusted cleaners.
              </p>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {areas.map((area) => (
                <Card key={area.slug} className="border border-gray-100 bg-white shadow-lg shadow-primary/5">
                  <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{area.label}</h3>
                        <p className="text-sm text-gray-500">{area.suburbs.length} suburbs</p>
                      </div>
                    </div>
                    <Link
                      href={`/location/cape-town/${area.slug}`}
                      className="text-sm font-semibold text-primary hover:text-primary/80"
                    >
                      View area guide →
                    </Link>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {area.suburbs.map((suburb) => (
                        <Link
                          key={suburb.slug}
                          href={`/location/cape-town/${suburb.slug}`}
                          className="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white/60 px-4 py-3 transition hover:border-primary hover:bg-primary/5"
                        >
                          <Sparkles className="h-4 w-4 text-primary transition group-hover:scale-110" />
                          <span className="text-sm font-medium text-gray-700 group-hover:text-primary">
                            {suburb.name}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="mt-10 text-center">
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10" asChild>
                <Link href="/contact">Don’t see your suburb? Contact us</Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="packages" className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <Badge className="mb-3 bg-primary/10 text-primary border-primary/10">Service Packages</Badge>
              <h2 className="text-3xl font-bold sm:text-4xl">Cape Town cleaning packages</h2>
              <p className="mt-3 text-lg text-gray-600">
                Pick the level of support that fits your lifestyle. Every package includes vetted cleaners and satisfaction guarantees.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <Card
                  key={pkg.title}
                  className="flex flex-col overflow-hidden border border-gray-100 bg-white shadow-lg shadow-primary/10"
                >
                  <div className="relative h-48 w-full">
                    <Image src={pkg.image} alt={`${pkg.title} cleaning service in Cape Town - Shalean Cleaning Services`} fill className="object-cover" />
                  </div>
                  <CardHeader>
                    <h3 className="text-xl font-semibold text-gray-900">{pkg.title}</h3>
                    <p className="text-sm text-gray-500">{pkg.price}</p>
                  </CardHeader>
                  <CardContent className="flex-1 pt-0 text-sm text-gray-600">{pkg.description}</CardContent>
                  <CardFooter className="flex-1 flex-col items-start gap-3 pt-0">
                    <ul className="space-y-2 text-sm text-gray-700">
                      {pkg.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button className="mt-4 w-full" asChild>
                      <Link href="/booking/service/select">Book this package</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-primary/5 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <Badge className="mb-3 bg-primary/20 text-primary border-transparent">Testimonials</Badge>
              <h2 className="text-3xl font-bold sm:text-4xl">What Cape Town customers say</h2>
              <p className="mt-3 text-lg text-gray-600">
                Consistently five-star experiences from homeowners, landlords, and busy professionals.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <Card key={testimonial.name} className="border border-transparent bg-white shadow-lg shadow-primary/10">
                  <CardHeader className="flex flex-col gap-2">
                    <div className="flex items-center gap-1 text-primary">
                      {Array.from({ length: testimonial.rating }).map((_, index) => (
                        <Star key={index} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-base text-gray-700">“{testimonial.quote}”</p>
                  </CardHeader>
                  <CardFooter className="border-t border-gray-100 pt-4">
                    <div className="text-sm">
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-gray-500">{testimonial.role}</p>
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <Badge className="mb-3 bg-primary/10 text-primary border-primary/10">Meet the Team</Badge>
              <h2 className="text-3xl font-bold sm:text-4xl">Your Cape Town cleaning specialists</h2>
              <p className="mt-3 text-lg text-gray-600">
                Skilled professionals who bring experience, care, and personality to every visit.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {team.map((member) => (
                <Card key={member.name} className="border border-gray-100 bg-white shadow-md">
                  <div className="relative h-52 w-full overflow-hidden">
                    <Image src={member.image} alt={member.name} fill className="object-cover" />
                  </div>
                  <CardHeader>
                    <h3 className="text-xl font-semibold text-gray-900">{member.name}</h3>
                    <p className="text-sm text-primary">{member.role}</p>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm text-gray-600">{member.bio}</CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gray-50 py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-12 lg:grid-cols-[1.1fr,1fr] lg:items-start">
              <div>
                <Badge className="mb-3 bg-primary/10 text-primary border-primary/10">FAQs</Badge>
                <h2 className="text-3xl font-bold sm:text-4xl">Frequently asked questions</h2>
                <p className="mt-3 text-lg text-gray-600">
                  Answers to the questions Cape Town homeowners ask most about Shalean’s services.
                </p>
                <Accordion type="single" collapsible className="mt-6 w-full divide-y rounded-2xl border border-gray-100 bg-white shadow-sm">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={faq.question} value={`item-${index}`}>
                      <AccordionTrigger className="text-left text-base font-semibold text-gray-900">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-sm text-gray-600">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
              <div className="rounded-3xl bg-primary/10 p-8 shadow-lg shadow-primary/10">
                <h3 className="text-2xl font-semibold text-primary">Need something custom?</h3>
                <p className="mt-3 text-sm text-primary/80">
                  Chat with our Cape Town concierge team about estate cleans, office maintenance, or recurring
                  property portfolios. We’ll design a plan that scales with you.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <Button className="w-full" asChild>
                    <Link href="/booking/service/select">Get a custom quote</Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-primary text-primary hover:bg-primary/10"
                    asChild
                  >
                    <a href="tel:+27871535250">Speak to our team</a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <Badge className="mb-3 bg-primary/10 text-primary border-primary/10">Cleaning Tips</Badge>
              <h2 className="text-3xl font-bold sm:text-4xl">Cleaning tips & Cape Town insights</h2>
              <p className="mt-3 text-lg text-gray-600">
                Practical advice from our professional cleaners to keep your home fresh between visits.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {blogPosts.map((post) => (
                <Card key={post.title} className="overflow-hidden border border-gray-100 bg-white shadow-md">
                  <div className="relative h-44 w-full">
                    <Image src={post.image} alt={`${post.title} - Shalean Cleaning Services blog post about cleaning in Cape Town`} fill className="object-cover" />
                  </div>
                  <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm text-gray-600">{post.excerpt}</CardContent>
                  <CardFooter>
                    <Button variant="link" className="px-0 text-primary" asChild>
                      <Link href={post.href}>Read article</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-r from-primary/90 via-primary to-primary/90 py-16 text-white">
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 text-center sm:px-6 lg:px-8">
            <Badge className="border-white/30 bg-white/10 text-white">Ready to start?</Badge>
            <h2 className="text-3xl font-semibold sm:text-4xl">
              Experience spotless living with Cape Town&apos;s trusted cleaning team
            </h2>
            <p className="max-w-2xl text-base text-white/80 sm:text-lg">
              Schedule your first visit in minutes. We’ll match you with the perfect cleaner, share updates, and ensure every clean feels effortless.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="lg" variant="secondary" className="px-8 py-4 text-lg text-primary" asChild>
                <Link href="/booking/service/select">Book your clean</Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/50 px-8 py-4 text-lg text-white hover:bg-white/10"
                asChild
              >
                <a href="tel:+27871535250">Talk to our team</a>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

