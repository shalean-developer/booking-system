"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { BookingFormData } from "@/components/booking-system-types";
import { BOOKING_FORM_SESSION_KEY } from "@/lib/booking-form-session";

function readStoredForm(): Partial<BookingFormData> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(BOOKING_FORM_SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<BookingFormData>;
  } catch {
    return null;
  }
}

function hasCompletedPlan(data: Partial<BookingFormData>): boolean {
  return Boolean(data.workingArea?.trim());
}

function hasCompletedSchedule(data: Partial<BookingFormData>): boolean {
  if (!data.date || !data.time) return false;
  if (data.service === "standard" || data.service === "airbnb") {
    return data.scheduleEquipmentPref === "bring" || data.scheduleEquipmentPref === "own";
  }
  return true;
}

/**
 * Keeps URL steps aligned with persisted booking data (same source as `BookingSystem`).
 */
export function useStepGuard(step: string, slug: string) {
  const router = useRouter();

  useEffect(() => {
    const data = readStoredForm() ?? {};

    if (step === "plan") return;

    if (!hasCompletedPlan(data)) {
      router.replace(`/booking/service/${slug}/plan`);
      return;
    }

    if (step === "time") return;

    if (!hasCompletedSchedule(data)) {
      router.replace(`/booking/service/${slug}/time`);
      return;
    }

    if (step === "crew" || step === "final") return;
  }, [step, slug, router]);
}
