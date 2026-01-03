import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SuburbMap } from "@/components/location/suburb-map";
import { MapPin, Phone, Mail, Clock, ArrowRight } from "lucide-react";

interface ContactMapSectionProps {
  suburb: string;
  city: string;
  area: string;
  businessName: string;
  phoneNumber: string;
  emailAddress: string;
  addressValue: string;
  serviceHours: string;
  mapUrl: string;
}

export function ContactMapSection({
  suburb,
  city,
  area,
  businessName,
  phoneNumber,
  emailAddress,
  addressValue,
  serviceHours,
  mapUrl,
}: ContactMapSectionProps) {
  return (
    <section id="contact" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="rounded-3xl border border-gray-200 bg-white p-10 shadow-xl">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              {businessName}
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Local Cleaning Experts in {suburb}
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Connect with our friendly support team to book vetted cleaners in {suburb}. We serve homes and offices across the {area}, delivering reliable service backed by a satisfaction guarantee.
            </p>
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="text-sm uppercase tracking-wide text-gray-500 font-semibold">Service Area</p>
                  <p className="text-lg text-gray-800">{addressValue}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="text-sm uppercase tracking-wide text-gray-500 font-semibold">Call Us</p>
                  <a href={`tel:${phoneNumber.replace(/\s+/g, "")}`} className="text-lg text-gray-800 hover:text-primary transition-colors">
                    {phoneNumber}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="text-sm uppercase tracking-wide text-gray-500 font-semibold">Email</p>
                  <a href={`mailto:${emailAddress}`} className="text-lg text-gray-800 hover:text-primary transition-colors">
                    {emailAddress}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-1" />
                <div>
                  <p className="text-sm uppercase tracking-wide text-gray-500 font-semibold">Operating Hours</p>
                  <p className="text-lg text-gray-800">{serviceHours}</p>
                </div>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-6" asChild>
                <Link href="/booking/service/select">
                  Book Online
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10 px-6" asChild>
                <Link href="/contact">
                  Talk to Our Team
                </Link>
              </Button>
            </div>
          </div>
          <SuburbMap
            mapUrl={mapUrl}
            title={`Map of ${suburb}, ${city}`}
            loadingText={`Loading ${suburb} map...`}
          />
        </div>
      </div>
    </section>
  );
}

