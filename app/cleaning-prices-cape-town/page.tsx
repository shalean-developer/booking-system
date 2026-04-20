import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { createMetadata, generateCanonical, generateOgImageUrl } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Cleaning Prices in Cape Town | Practical Cost Guide",
  description:
    "A practical guide to cleaning prices in Cape Town, including what changes cost, how service scope affects quotes, and how to compare options fairly.",
  canonical: generateCanonical("/cleaning-prices-cape-town"),
  ogImage: {
    url: generateOgImageUrl("pricing"),
    alt: "Cleaning price guide for Cape Town homes",
  },
});

export default function CleaningPricesCapeTownPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
          Cleaning prices in Cape Town: how to compare quotes properly
        </h1>
        <p className="mt-4 text-slate-600">
          Most pricing differences come from service depth, property size, and extras. Comparing only a headline
          number often hides what is and is not included. This guide helps you evaluate value without guesswork.
        </p>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">What usually changes the final price</h2>
          <ul className="list-disc space-y-2 pl-5 text-slate-600">
            <li>Bedrooms and bathrooms (time scales quickly with wet areas).</li>
            <li>Service type (standard upkeep vs deep or move-out).</li>
            <li>Optional extras like oven, fridge, interior windows, or cupboards.</li>
            <li>Expected finish standard and on-site time required.</li>
          </ul>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">A simple quote-check checklist</h2>
          <ol className="list-decimal space-y-2 pl-5 text-slate-600">
            <li>Confirm the same room counts and property type were used.</li>
            <li>Check whether supplies and equipment are included.</li>
            <li>Verify whether kitchen and bathroom detail work is included.</li>
            <li>Review reschedule/cancellation terms before booking.</li>
          </ol>
        </section>

        <section className="mt-10 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Related local pages</h2>
          <p className="text-slate-600">
            For service-specific availability and local examples, browse:
          </p>
          <ul className="space-y-2">
            <li>
              <Link href="/growth/local/cleaning-services/cape-town" className="font-medium text-primary hover:underline">
                cleaning services in Cape Town
              </Link>
            </li>
            <li>
              <Link href="/growth/local/deep-cleaning/claremont" className="font-medium text-primary hover:underline">
                deep cleaning in Claremont
              </Link>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}
