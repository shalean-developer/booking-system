import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { createMetadata, generateCanonical, generateOgImageUrl } from "@/lib/metadata";

export const metadata: Metadata = createMetadata({
  title: "Move-Out Cleaning Checklist | Handover Ready",
  description:
    "Use this move-out cleaning checklist to prepare your property for handover, avoid missed areas, and keep standards consistent across rooms.",
  canonical: generateCanonical("/move-out-cleaning-checklist"),
  ogImage: {
    url: generateOgImageUrl("move-turnover"),
    alt: "Move-out cleaning checklist for handover preparation",
  },
});

export default function MoveOutCleaningChecklistPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold tracking-tight text-slate-900">Move-out cleaning checklist</h1>
        <p className="mt-4 text-slate-600">
          A practical, room-by-room checklist for handover cleaning. Use it before tenant exit inspections or owner
          walkthroughs to avoid common misses.
        </p>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">Kitchen</h2>
          <ul className="list-disc space-y-2 pl-5 text-slate-600">
            <li>Inside and outside cupboards and drawers wiped.</li>
            <li>Hob, extractor, and oven degreased.</li>
            <li>Sink and taps descaled; splashback cleaned.</li>
          </ul>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">Bathrooms</h2>
          <ul className="list-disc space-y-2 pl-5 text-slate-600">
            <li>Shower, bath, basin, and toilet disinfected and rinsed.</li>
            <li>Tiles and grout scrubbed where needed.</li>
            <li>Mirrors, fittings, and ventilation covers cleaned.</li>
          </ul>
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">Final handover pass</h2>
          <ol className="list-decimal space-y-2 pl-5 text-slate-600">
            <li>Skirtings, switches, and door handles checked.</li>
            <li>Floors vacuumed and mopped end-to-end.</li>
            <li>Photos taken after completion for records.</li>
          </ol>
        </section>

        <section className="mt-10 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-xl font-semibold text-slate-900">Related local pages</h2>
          <ul className="space-y-2">
            <li>
              <Link href="/growth/local/move-out-cleaning/cape-town" className="font-medium text-primary hover:underline">
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
