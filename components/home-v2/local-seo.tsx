"use client";

import Link from "next/link";
import { MapPin, ExternalLink, ChevronRight } from "lucide-react";
import { SectionHeading, ShaleanButtonLink } from "@/components/shalean-ui";
import { LOCATIONS, LOCATION_BASE } from "@/lib/shalean-constants";

export function LocalSeo() {
  return (
    <section className="px-6 py-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionHeading subtitle="">
              Professional Cleaning Services Across Cape Town
            </SectionHeading>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                Shalean Cleaning Services proudly serves homeowners, landlords,
                and Airbnb hosts across all major Cape Town suburbs. From the
                vibrant streets of{" "}
                <strong className="text-slate-900">Sea Point</strong> and{" "}
                <strong className="text-slate-900">Gardens</strong> to the leafy
                avenues of{" "}
                <strong className="text-slate-900">Constantia</strong> and{" "}
                <strong className="text-slate-900">Claremont</strong>, our
                professionally trained team is never far away.
              </p>
              <p>
                Whether you&apos;re in{" "}
                <strong className="text-slate-900">Century City</strong>,{" "}
                <strong className="text-slate-900">Durbanville</strong>,{" "}
                <strong className="text-slate-900">Table View</strong>, or{" "}
                <strong className="text-slate-900">Observatory</strong>, we offer
                fast scheduling with same-week availability across the greater
                Cape Town metro. Our local teams know your area and are ready to
                deliver a spotless clean every time.
              </p>
            </div>
            <div className="mt-8">
              <ShaleanButtonLink href="/booking/service/standard/plan" variant="primary">
                Book Cleaning in Cape Town <ChevronRight className="w-5 h-5" />
              </ShaleanButtonLink>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3">
            {LOCATIONS.map((loc) => (
              <Link
                key={loc.slug}
                href={`${LOCATION_BASE}/${loc.slug}`}
                className="flex items-center gap-2 p-4 bg-white border border-slate-100 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all group"
              >
                <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="text-sm font-semibold text-slate-700 group-hover:text-blue-700">
                  {loc.name}
                </span>
                <ExternalLink className="w-3 h-3 text-slate-300 group-hover:text-blue-400 ml-auto flex-shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
