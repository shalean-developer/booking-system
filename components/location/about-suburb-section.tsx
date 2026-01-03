import { Fragment } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";

interface AboutSuburbSectionProps {
  suburb: string;
  city: string;
  area: string;
  citySlug: string;
  inlineRelatedLinks: Array<{ name: string; href: string }>;
}

const inlineLinkClass = "text-primary underline underline-offset-4 decoration-primary/40 hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/40 rounded-sm";

const renderLinkedSuburbs = (items: Array<{ name: string; href: string }>) =>
  items.map((item, index) => (
    <Fragment key={item.href}>
      <Link href={item.href} className={inlineLinkClass}>
        {item.name}
      </Link>
      {index < items.length - 2 ? ", " : index === items.length - 2 ? " and " : ""}
    </Fragment>
  ));

export function AboutSuburbSection({
  suburb,
  city,
  area,
  citySlug,
  inlineRelatedLinks,
}: AboutSuburbSectionProps) {
  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Professional Cleaning Services in {suburb}, {city}
            </h2>
            <div className="prose prose-lg max-w-none text-gray-600 space-y-4">
              <p>
                {suburb} is a vibrant neighborhood in the {area} region of {city}, known for its 
                {suburb.toLowerCase().includes('sea point') ? ' stunning ocean views, cosmopolitan atmosphere, and proximity to the Sea Point Promenade' : 
                 suburb.toLowerCase().includes('claremont') ? ' excellent schools, family-friendly environment, and vibrant shopping district along Main Road' :
                 suburb.toLowerCase().includes('constantia') ? ' prestigious wine estates, luxury properties, and historic Constantia Valley charm' :
                 suburb.toLowerCase().includes('camps bay') ? ' beautiful beaches, luxury properties, and iconic Camps Bay Beach with Table Mountain backdrop' :
                 suburb.toLowerCase().includes('green point') ? ' proximity to the V&A Waterfront, Green Point Park, and vibrant city center lifestyle' :
                 suburb.toLowerCase().includes('city bowl') ? ' central location, historic architecture, and proximity to Company Gardens and Parliament' :
                 suburb.toLowerCase().includes('newlands') ? ' leafy streets, Newlands Cricket Ground, and family-oriented community atmosphere' :
                 suburb.toLowerCase().includes('rondebosch') ? ' university proximity, historic charm, and Rondebosch Common nearby' :
                 ' unique character and community feel'}. 
                Residents and businesses in {suburb} trust Shalean Cleaning Services for reliable, 
                professional cleaning that fits their busy lifestyles.
              </p>
              <p>
                Our experienced cleaners understand the specific needs of {suburb} properties, from 
                {suburb.toLowerCase().includes('sea point') || suburb.toLowerCase().includes('camps bay') ? ' beachfront apartments and holiday rentals that require frequent turnover cleaning' :
                 suburb.toLowerCase().includes('claremont') || suburb.toLowerCase().includes('constantia') ? ' family homes and large estates that need comprehensive maintenance' :
                 suburb.toLowerCase().includes('green point') || suburb.toLowerCase().includes('city bowl') ? ' modern apartments and commercial spaces in the urban core' :
                 ' residential properties and commercial spaces'}. 
                We offer flexible scheduling, same-day availability, and eco-friendly cleaning options 
                to keep your {suburb} property spotless. Whether you're near 
                {suburb.toLowerCase().includes('sea point') ? ' the Sea Point Promenade or Beach Road' :
                 suburb.toLowerCase().includes('claremont') ? ' Claremont Main Road or the Southern Suburbs' :
                 suburb.toLowerCase().includes('constantia') ? ' the Constantia Wine Route or historic estates' :
                 suburb.toLowerCase().includes('camps bay') ? ' Camps Bay Beach or the Atlantic Seaboard' :
                 suburb.toLowerCase().includes('green point') ? ' the V&A Waterfront or Green Point Common' :
                 ' the local area'}, our team knows the unique cleaning challenges of {suburb} properties.
              </p>
              <p>
                Whether you need regular maintenance cleaning, a deep clean before hosting guests, 
                or move-in/out cleaning services, Shalean's vetted professionals deliver consistent, 
                high-quality results. Our cleaners are fully insured, background-checked, and trained 
                to meet the highest standards of cleanliness. We regularly serve {suburb} residents 
                with personalized cleaning plans that accommodate everything from high-rise apartment 
                living to spacious family homes.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/services/regular-cleaning" className="text-primary hover:text-primary/80 font-semibold underline underline-offset-4">
                Regular Cleaning Services →
              </Link>
              <Link href="/services/deep-cleaning" className="text-primary hover:text-primary/80 font-semibold underline underline-offset-4">
                Deep Cleaning Services →
              </Link>
              <Link href="/services/move-turnover" className="text-primary hover:text-primary/80 font-semibold underline underline-offset-4">
                Move-In/Out Cleaning →
              </Link>
            </div>
          </div>
          <div className="space-y-6">
            <Card className="border border-primary/10 shadow-lg p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Why {suburb} Residents Choose Shalean</h3>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Local knowledge of {suburb} properties and common cleaning challenges</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Flexible scheduling that works around your {suburb} lifestyle</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Same-day and next-day availability for urgent cleaning needs</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>Eco-friendly cleaning products safe for families and pets</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <span>100% satisfaction guarantee - we'll return if something's missed</span>
                </li>
              </ul>
            </Card>
            <Card className="border border-primary/10 shadow-lg p-6 bg-primary/5">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Serving {suburb} and Nearby Areas</h3>
              <p className="text-gray-600 mb-4">
                We also provide cleaning services in nearby suburbs including {renderLinkedSuburbs(inlineRelatedLinks)}.
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/location/${citySlug}`}>
                  View All {city} Service Areas
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}

