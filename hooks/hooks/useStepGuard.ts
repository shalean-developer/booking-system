"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useBooking } from "@/context/BookingContext";

export function useStepGuard(step: string, slug: string) {
  const router = useRouter();
  const { booking } = useBooking();

  useEffect(() => {
    if (!booking) return;

    if (step === "time" && !booking.plan) {
      router.replace(`/booking/service/${slug}/plan`);
    }

    if (step === "crew" && !booking.time) {
      router.replace(`/booking/service/${slug}/time`);
    }

    if (step === "final" && !booking.crew) {
      router.replace(`/booking/service/${slug}/crew`);
    }

  }, [step, slug, booking, router]);
}