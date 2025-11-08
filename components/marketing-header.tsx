import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";

type NavKey = "home" | "services" | "how-it-works" | "locations";

type MarketingHeaderProps = {
  activeItem?: NavKey;
};

const navItems: Array<{ label: string; href: string; key: NavKey }> = [
  { label: "Home", href: "/", key: "home" },
  { label: "Services", href: "/services", key: "services" },
  { label: "How It Works", href: "/how-it-works", key: "how-it-works" },
  { label: "Locations", href: "/location", key: "locations" },
];

export function MarketingHeader({ activeItem = "locations" }: MarketingHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:flex-nowrap sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-blue-50">
            <Image
              src="/logo.svg"
              alt="Shalean Logo"
              width={40}
              height={40}
              priority
              className="h-8 w-8"
            />
          </div>
          <span className="text-xl font-semibold text-primary">Shalean</span>
        </Link>

        <nav className="hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-1 py-1 md:flex">
          {navItems.map((item) => {
            const isActive = item.key === activeItem;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive ? "bg-primary text-white" : "text-gray-600 hover:bg-gray-100 hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
          <Button asChild className="rounded-full bg-primary px-4 py-2 text-sm text-white hover:bg-primary/90">
            <Link href="/booking/service/select">Book a Clean</Link>
          </Button>
          <Button
            variant="outline"
            asChild
            className="rounded-full px-4 py-2 text-sm text-primary hover:bg-primary/10"
          >
            <Link href="/booking/quote">Get Free Quote</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

