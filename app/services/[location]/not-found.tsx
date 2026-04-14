import Link from "next/link";
import { Header } from "@/components/header";
import { Button } from "@/components/ui/button";

export default function ServiceLocationNotFound() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Header />
      <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-24 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Page not found</h1>
        <p className="mt-3 text-slate-600">
          We don&apos;t have a service page at this address yet. Explore our services or book a clean in
          your area.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/services">All services</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/booking/service/standard/plan">Book Now</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
