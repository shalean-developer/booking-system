"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import Image from "next/image";
import { ChevronRight } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORT_WHATSAPP_URL } from '@/lib/contact';

const brandBlue = "#2B59FF";
const brandTeal = "#26B99A";
const WHATSAPP_URL = SUPPORT_WHATSAPP_URL;

const fallbackServiceOptions: {
  id: string;
  label: string;
  href: string;
}[] = [
  { id: "Standard", label: "Standard Cleaning", href: "/booking/service/standard/plan" },
  { id: "Deep", label: "Deep Cleaning", href: "/booking/service/deep/plan" },
  { id: "Move In/Out", label: "Move In/Out Cleaning", href: "/booking/service/move-in-out/plan" },
  { id: "Airbnb", label: "Airbnb Cleaning", href: "/booking/service/airbnb/plan" },
  { id: "Carpet", label: "Carpet Cleaning", href: "/booking/service/carpet/plan" },
];

const trustStrip = [
  { value: "10K+", label: "Happy clients" },
  { value: "4.87", label: "Average rating" },
  { value: "150+", label: "Professional cleaners" },
  { value: "100%", label: "Satisfaction guarantee" },
];

const slugifyServiceType = (value: string) =>
  value.toLowerCase().replace(/\s+/g, "-").replace(/\//g, "-");

const getServiceHref = (serviceType: string) =>
  `/booking/service/${slugifyServiceType(serviceType)}/plan`;

export function Hero() {
  const router = useRouter();
  const [serviceId, setServiceId] = useState(fallbackServiceOptions[0].id);
  const [serviceOptions, setServiceOptions] = useState(fallbackServiceOptions);

  useEffect(() => {
    let isMounted = true;

    const loadServices = async () => {
      try {
        const response = await fetch("/api/quote/services", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) {
          return;
        }

        const payload = await response.json();
        const dbOptions = Array.isArray(payload?.services)
          ? payload.services
              .filter(
                (item: any) =>
                  item &&
                  typeof item.id === "string"
              )
              .map((item: any) => {
                const fullLabelFromParts = `${item.label ?? ""} ${item.subLabel ?? ""}`.trim();
                const resolvedLabel =
                  item.displayName ??
                  item.display_name ??
                  item.name ??
                  (fullLabelFromParts || item.label || "Service");

                return {
                  id: String(item.id),
                  label: String(resolvedLabel),
                  href: getServiceHref(String(item.id)),
                };
              })
          : [];

        if (isMounted && dbOptions.length > 0) {
          setServiceOptions(dbOptions);
          setServiceId(dbOptions[0].id);
        }
      } catch {
        // Keep fallback options silently if API fails
      }
    };

    loadServices();

    return () => {
      isMounted = false;
    };
  }, []);

  const selectedOption = useMemo(
    () => serviceOptions.find((o) => o.id === serviceId) ?? serviceOptions[0],
    [serviceOptions, serviceId]
  );

  const handleFindCleaning = useCallback(() => {
    if (selectedOption?.href) {
      router.push(selectedOption.href);
    }
  }, [router, selectedOption]);

  return (
    <section className="pt-6 md:pt-8 pb-0 px-4 sm:px-6 bg-slate-50">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
        <div className="order-2 lg:order-1 space-y-6 lg:pt-4">
          <h1 className="text-4xl sm:text-5xl lg:text-[3rem] xl:text-[3.2rem] font-extrabold text-slate-900 leading-[1.05] tracking-tight">
            Book trusted home cleaning services in Cape Town
          </h1>
          <p className="max-w-2xl text-base md:text-lg text-slate-600">
            Book vetted local cleaners with transparent pricing.
          </p>

          <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-lg border border-slate-100/80 space-y-4">
            <div>
              <label htmlFor="hero-service" className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Choose a service
              </label>
              <Select value={serviceId} onValueChange={setServiceId}>
                <SelectTrigger
                  id="hero-service"
                  className="mt-1.5 h-auto min-h-[3rem] w-full rounded-xl border-2 bg-white px-4 py-3 text-left text-base font-medium text-slate-900 shadow-none focus:ring-2 focus:ring-offset-0 data-[placeholder]:text-slate-400 [&>span]:line-clamp-1 [&_svg]:opacity-100 [&_svg]:text-slate-900"
                  style={
                    {
                      borderColor: brandBlue,
                      ["--tw-ring-color" as string]: brandBlue,
                    } as CSSProperties
                  }
                >
                  <SelectValue placeholder="Choose a service" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="rounded-xl border-2 border-slate-200 shadow-lg"
                  style={{ borderColor: brandBlue }}
                >
                    {serviceOptions.map((o) => (
                    <SelectItem
                      key={o.id}
                      value={o.id}
                      className="cursor-pointer rounded-lg py-2.5 pl-9 pr-3 text-slate-900 focus:bg-blue-50 focus:text-blue-900"
                    >
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex w-full flex-row gap-3">
            <button
              type="button"
              onClick={handleFindCleaning}
              className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white shadow-md transition hover:opacity-95 active:scale-[0.98] sm:px-6"
              style={{ backgroundColor: brandBlue }}
            >
              Book now
              <ChevronRight className="h-5 w-5 shrink-0" aria-hidden />
            </button>
            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-center text-sm font-bold text-white shadow-md transition hover:opacity-95 active:scale-[0.98] sm:px-6"
              style={{ backgroundColor: brandTeal }}
            >
              WhatsApp Us
            </a>
          </div>
        </div>

        <div className="order-1 lg:order-2 space-y-0">
          <div className="relative aspect-[4/3] max-h-[min(72vh,540px)] rounded-2xl overflow-hidden bg-slate-200 shadow-xl">
            <Image
              src="/images/cleaning-team-hero.jpg"
              alt="Shalean professional cleaning team"
              fill
              className="object-cover"
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1e3a8a]/95 via-[#1e3a8a]/65 to-transparent pt-16 pb-5 px-5 sm:px-6">
              <p className="text-white text-lg sm:text-xl font-bold tracking-tight">
                Ready for a spotless home?
              </p>
              <button
                type="button"
                onClick={handleFindCleaning}
                className="mt-3 inline-flex items-center justify-center rounded-lg bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-md transition hover:bg-slate-50 active:scale-[0.98]"
              >
                Find a cleaner
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        className="mt-10 md:mt-12 -mx-4 sm:-mx-6 px-4 sm:px-6 py-5 md:py-6 text-white"
        style={{ backgroundColor: brandBlue }}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {trustStrip.map((item) => (
            <div key={item.label} className="text-center lg:text-left">
              <p className="text-2xl md:text-3xl font-black tabular-nums">{item.value}</p>
              <p className="text-sm text-white/85 font-medium mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
