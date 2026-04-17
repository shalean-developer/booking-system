import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarClock,
  HelpCircle,
  MessageCircle,
  Phone,
  FileQuestion,
  Mail,
} from "lucide-react";
import { createMetadata } from "@/lib/metadata";
import { getSeoConfig } from "@/lib/seo-config";
import { ShaleanHeader } from "@/components/shalean-header";
import { ShaleanFooter } from "@/components/shalean-footer";
import { Card, CardContent } from "@/components/ui/card";
import { SUPPORT_PHONE_DISPLAY, SUPPORT_PHONE_HREF, SUPPORT_WHATSAPP_URL } from '@/lib/contact';

export const metadata: Metadata = createMetadata(getSeoConfig("help"));

const WHATSAPP_URL = SUPPORT_WHATSAPP_URL;

const helpTopics: {
  title: string;
  description: string;
  href: string;
  icon: typeof BookOpen;
}[] = [
  {
    title: "Book a cleaning",
    description: "Start or change a booking online in a few steps.",
    href: "/booking/service/standard/plan",
    icon: CalendarClock,
  },
  {
    title: "How it works",
    description: "See what happens before, during, and after your clean.",
    href: "/how-it-works",
    icon: BookOpen,
  },
  {
    title: "FAQs",
    description: "Answers about services, pricing, scheduling, and accounts.",
    href: "/faq",
    icon: FileQuestion,
  },
  {
    title: "Pricing",
    description: "Transparent rates and what's included.",
    href: "/pricing",
    icon: HelpCircle,
  },
  {
    title: "Contact us",
    description: "Send a message, call, or visit — we're here for you.",
    href: "/contact",
    icon: Mail,
  },
];

export default function HelpPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <ShaleanHeader />

      <main id="main-content" className="flex-1 pt-14 md:pt-16">
        <div className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#2B59FF]">
              Help centre
            </p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              How can we help you?
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-slate-600">
              Find quick answers below or reach our team by phone, WhatsApp, or
              the contact form.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={SUPPORT_PHONE_HREF}
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50"
              >
                <Phone className="h-4 w-4 shrink-0 text-[#2B59FF]" aria-hidden />
                {SUPPORT_PHONE_DISPLAY}
              </a>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
                style={{ backgroundColor: "#26B99A" }}
              >
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
                WhatsApp us
              </a>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#2B59FF] bg-[#2B59FF] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:opacity-95"
              >
                Contact form
                <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
          <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">
            Popular topics
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {helpTopics.map((topic) => {
              const Icon = topic.icon;
              return (
                <li key={topic.href}>
                  <Link href={topic.href} className="group block h-full">
                    <Card className="h-full border-slate-200/80 shadow-sm transition group-hover:border-[#2B59FF]/40 group-hover:shadow-md">
                      <CardContent className="flex gap-4 p-5 sm:p-6">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white"
                          style={{ backgroundColor: "#2B59FF" }}
                        >
                          <Icon className="h-5 w-5" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-slate-900 group-hover:text-[#2B59FF]">
                            {topic.title}
                          </h3>
                          <p className="mt-1 text-sm text-slate-600">
                            {topic.description}
                          </p>
                          <span className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-[#2B59FF]">
                            Open
                            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </main>

      <ShaleanFooter />
    </div>
  );
}
