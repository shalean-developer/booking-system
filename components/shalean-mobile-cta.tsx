"use client";

import { usePathname } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { ShaleanButtonLink } from "@/components/shalean-ui";

const HIDE_PATHS = ["/booking", "/admin", "/dashboard"];
const HIDE_PREFIX = "/cleaner";

export function ShaleanMobileCta() {
  const pathname = usePathname();
  const shouldHide =
    !pathname ||
    (pathname === "/booking" || pathname.startsWith("/booking/service/")) ||
    HIDE_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith(HIDE_PREFIX);

  if (shouldHide) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 p-4 z-40 flex gap-4 pb-safe">
      <ShaleanButtonLink href="/booking/service/standard/plan" className="flex-1 py-4 text-lg shadow-lg">
        Book Now
      </ShaleanButtonLink>
      <a
        href="https://wa.me/27825915525"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-emerald-500 text-white p-4 rounded-full shadow-lg flex items-center justify-center"
        aria-label="WhatsApp"
      >
        <MessageSquare className="w-6 h-6" />
      </a>
    </div>
  );
}
