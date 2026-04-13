"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { BookingFormData } from "@/lib/useBookingFormData";

// ✅ IMPORTANT CHANGE (this is what you asked about)
type Booking = Partial<BookingFormData>;

type BookingContextType = {
  booking: Booking;
  setBooking: (data: Booking) => void;
  updateBooking: (data: Partial<Booking>) => void;
  resetBooking: () => void;
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [booking, setBooking] = useState<Booking>({});

  // ✅ Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("booking");
    if (saved) {
      try {
        setBooking(JSON.parse(saved));
      } catch {
        localStorage.removeItem("booking");
      }
    }
  }, []);

  // ✅ Save to localStorage
  useEffect(() => {
    localStorage.setItem("booking", JSON.stringify(booking));
  }, [booking]);

  // ✅ Safe updater (merge data)
  function updateBooking(data: Partial<Booking>) {
    setBooking((prev) => ({
      ...prev,
      ...data,
    }));
  }

  // ✅ Reset booking
  function resetBooking() {
    setBooking({});
    localStorage.removeItem("booking");
  }

  return (
    <BookingContext.Provider
      value={{ booking, setBooking, updateBooking, resetBooking }}
    >
      {children}
    </BookingContext.Provider>
  );
}

// ✅ Hook
export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within BookingProvider");
  }
  return context;
}