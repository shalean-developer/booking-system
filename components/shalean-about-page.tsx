'use client';

import React, { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'framer-motion';
import {
  Sparkles,
  Home,
  Star,
  Shield,
  Heart,
  Target,
  ArrowRight,
  Users,
  Award,
  MapPin,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ValueCard {
  id: string;
  icon: React.ElementType;
  label: string;
  description: string;
  iconColor: string;
  iconBg: string;
}
interface StatItem {
  id: string;
  value: string;
  label: string;
  icon: React.ElementType;
}
interface NavLink {
  id: string;
  label: string;
  href: string;
}

// ─── Static Data ─────────────────────────────────────────────────────────────

const NAV_LINKS: NavLink[] = [
  { id: 'nav-home', label: 'Home', href: '/' },
  { id: 'nav-about', label: 'About', href: '/about' },
  { id: 'nav-services', label: 'Services', href: '/#services' },
  { id: 'nav-contact', label: 'Contact', href: '/contact' },
];
const VALUE_CARDS: ValueCard[] = [
  {
    id: 'val-excellence',
    icon: Star,
    label: 'Excellence',
    description:
      'We hold ourselves to the highest standards in every clean, every visit, every interaction.',
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-50',
  },
  {
    id: 'val-trust',
    icon: Shield,
    label: 'Trust',
    description:
      'Fully vetted, insured and background-checked professionals you can invite into your home.',
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
  },
  {
    id: 'val-care',
    icon: Heart,
    label: 'Care',
    description:
      'We treat every space as if it were our own — with genuine attention and thoughtful detail.',
    iconColor: 'text-rose-500',
    iconBg: 'bg-rose-50',
  },
  {
    id: 'val-reliability',
    icon: Target,
    label: 'Reliability',
    description:
      'On-time arrivals, consistent results, and a team that shows up exactly when you need us.',
    iconColor: 'text-violet-600',
    iconBg: 'bg-violet-50',
  },
];
const STATS: StatItem[] = [
  { id: 'stat-customers', value: '2,500+', label: 'Happy Customers', icon: Users },
  { id: 'stat-satisfaction', value: '98%', label: 'Satisfaction Rate', icon: Award },
  { id: 'stat-cities', value: '12+', label: 'Areas Serviced', icon: MapPin },
  { id: 'stat-experience', value: '8 Yrs', label: 'In Business', icon: Clock },
];
const EDITORIAL_PARAGRAPHS: { id: string; text: string }[] = [
  {
    id: 'ep-1',
    text: 'Shalean Cleaning Services was founded on a simple belief: every home and business in Cape Town deserves a clean, healthy, and welcoming environment — without the hassle. Since our inception, we have grown from a small team of two into a trusted name across the Cape Peninsula.',
  },
  {
    id: 'ep-2',
    text: 'What sets us apart is not just the quality of our clean, but the peace of mind we bring. Every member of our team undergoes thorough background checks, in-house training, and is fully insured. You will always know who is entering your home, and you can trust they are there to do exceptional work.',
  },
  {
    id: 'ep-3',
    text: 'We serve residential and commercial clients across Cape Town, including the Southern Suburbs, Atlantic Seaboard, City Bowl, and the Northern Suburbs. From weekly maintenance cleans to once-off deep cleans, Airbnb turnarounds, and specialised carpet cleaning — our service catalogue is designed around real client needs.',
  },
  {
    id: 'ep-4',
    text: 'Sustainability matters to us too. We use eco-conscious, non-toxic cleaning products that are safe for children, pets, and the environment — without compromising on results. Our proprietary pricing engine ensures transparent, fair pricing with no hidden fees.',
  },
  {
    id: 'ep-5',
    text: 'At Shalean, we are not just cleaning your space. We are giving you back your time, your comfort, and your confidence. Book once, and you will understand why thousands of Cape Town homes keep coming back.',
  },
];

// ─── Animation Helpers ────────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};
const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

function AnimatedSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      variants={fadeUp}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function AnimatedGroup({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex flex-shrink-0 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase leading-none tracking-widest text-gray-400">
              Shalean
            </p>
            <p className="text-sm font-bold leading-tight text-gray-900">Cleaning Services</p>
          </div>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Primary navigation">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.id}
              href={link.href}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
                link.id === 'nav-about'
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex-shrink-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl border-2 border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition-all hover:border-blue-300 hover:text-blue-600"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Back to Home</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="bg-white px-4 py-20 sm:py-28">
      <AnimatedSection className="mx-auto max-w-3xl text-center">
        <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
          <span>Our Story</span>
        </span>
        <h1 className="mb-5 text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
          <span>About </span>
          <span className="text-blue-600">Shalean</span>
        </h1>
        <p className="mx-auto max-w-xl text-lg font-medium leading-relaxed text-gray-500 sm:text-xl">
          Cape Town&apos;s most trusted home cleaning service — built on integrity, powered by people,
          and dedicated to a spotless result every single time.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/booking/quote"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 transition-colors hover:bg-blue-700"
          >
            <span>Book a Clean</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 px-6 py-3 text-sm font-bold text-gray-600 transition-all hover:border-blue-300 hover:text-blue-600"
          >
            <span>Meet Our Team</span>
          </Link>
        </div>
      </AnimatedSection>
    </section>
  );
}

// ─── Mission Section ──────────────────────────────────────────────────────────

function MissionSection() {
  return (
    <section className="bg-[#f8f9fb] px-4 py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <AnimatedSection>
          <span className="mb-3 block text-xs font-bold uppercase tracking-widest text-blue-600">
            What Drives Us
          </span>
          <h2 className="mb-6 text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl">Our Mission</h2>
          <p className="mb-4 text-base leading-relaxed text-gray-500">
            At Shalean, our mission is to deliver consistent, high-quality cleaning experiences that
            give our clients genuine peace of mind. We believe a clean space is more than just
            aesthetics — it is your health, your comfort, and your wellbeing.
          </p>
          <p className="mb-8 text-base leading-relaxed text-gray-500">
            We achieve this by investing in our people — training them rigorously, paying them
            fairly, and building a culture where attention to detail is non-negotiable. Our clients
            feel the difference not just in the results, but in the entire experience from booking to
            completion.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-blue-200 transition-colors hover:bg-blue-700"
          >
            <span>Meet Our Team</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </AnimatedSection>

        <AnimatedSection className="relative">
          <figure className="relative aspect-[4/3] overflow-hidden rounded-2xl shadow-xl shadow-gray-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"
              alt="Professional cleaner carefully cleaning a modern home interior"
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-4 left-4 flex items-center gap-2.5 rounded-xl border border-gray-100 bg-white px-4 py-2.5 shadow-lg">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600">
                <Award className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-xs font-extrabold text-gray-900">Top Rated Service</p>
                <p className="text-[10px] font-semibold text-gray-400">Cape Town 2024</p>
              </div>
            </div>
          </figure>
        </AnimatedSection>
      </div>
    </section>
  );
}

// ─── Editorial Section ────────────────────────────────────────────────────────

function EditorialSection() {
  return (
    <section className="bg-white px-4 py-16 sm:py-24">
      <AnimatedSection className="mx-auto mb-12 max-w-3xl text-center">
        <h2 className="text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl">
          Professional Cleaning Services in Cape Town
        </h2>
      </AnimatedSection>
      <AnimatedGroup className="mx-auto max-w-2xl space-y-5">
        {EDITORIAL_PARAGRAPHS.map((para) => (
          <motion.p key={para.id} variants={fadeUp} className="text-base leading-relaxed text-gray-500">
            {para.text}
          </motion.p>
        ))}
      </AnimatedGroup>
    </section>
  );
}

// ─── Values Section ───────────────────────────────────────────────────────────

function ValuesSection() {
  return (
    <section className="bg-[#f8f9fb] px-4 py-16 sm:py-24">
      <AnimatedSection className="mx-auto mb-12 max-w-6xl text-center">
        <span className="mb-3 block text-xs font-bold uppercase tracking-widest text-blue-600">
          What We Stand For
        </span>
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Our Core Values</h2>
      </AnimatedSection>
      <AnimatedGroup className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {VALUE_CARDS.map((card) => (
          <motion.div
            key={card.id}
            variants={fadeUp}
            className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className={cn('mb-4 flex h-11 w-11 items-center justify-center rounded-xl', card.iconBg)}>
              <card.icon className={cn('h-5 w-5', card.iconColor)} />
            </div>
            <h3 className="mb-2 text-base font-extrabold text-gray-900">{card.label}</h3>
            <p className="text-sm leading-relaxed text-gray-500">{card.description}</p>
          </motion.div>
        ))}
      </AnimatedGroup>
    </section>
  );
}

// ─── Impact Section ───────────────────────────────────────────────────────────

function ImpactSection() {
  return (
    <section className="bg-white px-4 py-16 sm:py-24">
      <AnimatedSection className="mx-auto mb-12 max-w-6xl text-center">
        <span className="mb-3 block text-xs font-bold uppercase tracking-widest text-blue-600">
          By The Numbers
        </span>
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">Our Impact</h2>
      </AnimatedSection>
      <AnimatedGroup className="mx-auto grid max-w-5xl grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {STATS.map((stat) => (
          <motion.div
            key={stat.id}
            variants={fadeUp}
            className="rounded-2xl border border-gray-200 bg-[#f8f9fb] p-6 text-center"
          >
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50">
              <stat.icon className="h-5 w-5 text-blue-600" />
            </div>
            <p className="mb-1.5 text-3xl font-extrabold leading-none text-blue-600 sm:text-4xl">{stat.value}</p>
            <p className="text-sm font-semibold text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </AnimatedGroup>
    </section>
  );
}

// ─── CTA Banner ───────────────────────────────────────────────────────────────

function CTABanner() {
  return (
    <section className="px-4 py-6 pb-12">
      <AnimatedSection className="mx-auto max-w-6xl">
        <div
          className="rounded-2xl px-8 py-12 text-center sm:py-16"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
        >
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-blue-800 bg-blue-950 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-blue-400" />
            <span>Available 7 Days a Week</span>
          </span>
          <h2 className="mb-4 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
            Join Thousands of Satisfied Customers
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-base leading-relaxed text-gray-400">
            Experience the Shalean difference — professional, reliable, and thorough cleaning
            delivered with genuine care.
          </p>
          <Link
            href="/booking/quote"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-900/40 transition-colors hover:bg-blue-500"
          >
            <span>Book Your Service</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </AnimatedSection>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white px-4 py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <p className="text-sm font-bold text-gray-700">Shalean Cleaning Services</p>
        </div>
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} Shalean Cleaning Services. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ShaleanAboutPage() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Navbar />
      <main>
        <HeroSection />
        <MissionSection />
        <EditorialSection />
        <ValuesSection />
        <ImpactSection />
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
}
