"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { BookingFormData } from "@/lib/useBookingFormData";

type Booking = Partial<BookingFormData>;

type BookingContextType = {
  booking: Booking;
  setBooking: (data: Booking) => void;
  updateBooking: (data: Partial<Booking>) => void;
  resetBooking: () => void;
};

const STORAGE_KEY = "booking";

function readStoredBooking(): Booking {
  if (typeof window === "undefined") return {};
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return {};
    return JSON.parse(saved) as Booking;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return {};
  }
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [booking, setBooking] = useState<Booking>(readStoredBooking);

  useEffect(() => {
    if (Object.keys(booking).length === 0) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(booking));
    } catch {
      // ignore quota / private mode
    }
  }, [booking]);

  function updateBooking(data: Partial<Booking>) {
    setBooking((prev) => ({
      ...prev,
      ...data,
    }));
  }

  function resetBooking() {
    setBooking({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  return (
    <BookingContext.Provider
      value={{ booking, setBooking, updateBooking, resetBooking }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within BookingProvider");
  }
  return context;
}
