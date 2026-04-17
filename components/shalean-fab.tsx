"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Phone, Calendar } from "lucide-react";
import { SUPPORT_WHATSAPP_URL } from '@/lib/contact';

const HIDE_PATHS = ["/booking", "/admin", "/dashboard"];
const HIDE_PREFIX = "/cleaner";

export function ShaleanFab() {
  const pathname = usePathname();
  const shouldHide =
    !pathname ||
    HIDE_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/")) ||
    pathname.startsWith(HIDE_PREFIX);

  if (shouldHide) return null;

  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-40">
      <motion.a
        href={SUPPORT_WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="w-14 h-14 bg-emerald-500 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-emerald-600"
        aria-label="WhatsApp"
      >
        <Phone className="w-6 h-6" />
      </motion.a>
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="hidden md:flex"
      >
        <Link
          href="/booking/service/standard/plan"
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-blue-700"
          aria-label="Book a clean"
        >
          <Calendar className="w-6 h-6" />
        </Link>
      </motion.div>
    </div>
  );
}
