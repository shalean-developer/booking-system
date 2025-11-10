import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Home } from "lucide-react";

export function AboutHero() {
  return (
    <section className="py-20 bg-gradient-to-b from-primary/5 to-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Badge className="mb-4 bg-primary text-white border-primary/80 shadow-sm">Our Story</Badge>
          <h1 className="mb-6 text-5xl font-bold text-gray-900 sm:text-6xl">About <span className="text-primary">Shalean</span></h1>
          <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
            Transforming homes and businesses across South Africa with professional cleaning services built on trust, excellence, and care.
          </p>
        </div>
      </div>
    </section>
  );
}
