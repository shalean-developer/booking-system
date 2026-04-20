import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { createMetadata, generateCanonical, generateOgImageUrl } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Weekly Cleaning Guide | Practical Home Routine",
  description:
    "A practical weekly cleaning guide for busy homes: what to do daily, weekly, and monthly to keep standards high without over-cleaning.",
  canonical: generateCanonical("/weekly-cleaning-guide"),
  ogImage: {
    url: generateOgImageUrl("home-maintenance"),
    alt: "Weekly cleaning routine guide for homes",
  },
});

export default function WeeklyCleaningGuidePage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Weekly cleaning guide for busy homes</h1>
        <p className="mt-4 text-slate-600">
          This guide helps split cleaning into manageable blocks so your home stays consistently clean without long
          weekend catch-up sessions.
        </p>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">Daily resets (10–15 minutes)</h2>
          <ul className="list-disc space-y-2 pl-5 text-slate-600">
            <li>Kitchen surfaces and sink wipe-down.</li>
            <li>Bathroom quick refresh (mirror, basin, taps).</li>
            <li>High-traffic floor sweep or vacuum pass.</li>
          </ul>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">Weekly core tasks</h2>
          <ul className="list-disc space-y-2 pl-5 text-slate-600">
            <li>Dusting and surface sanitization in living and sleeping areas.</li>
            <li>Bathrooms fully cleaned and descaled where needed.</li>
            <li>Mop floors and refresh rubbish/recycling zones.</li>
          </ul>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">Monthly add-ons</h2>
          <ul className="list-disc space-y-2 pl-5 text-slate-600">
            <li>Inside appliance clean (fridge, oven, microwave).</li>
            <li>Cupboard fronts, light switches, and skirtings.</li>
            <li>Window interior pass and deep bathroom detail work.</li>
          </ul>
        </section>

        <section className="mt-10 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Related local pages</h2>
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
