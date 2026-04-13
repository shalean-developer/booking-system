"use client";

import { createContext, useContext, useState, useEffect } from "react";

type Booking = {
  slug?: string;
  plan?: any;
  time?: any;
  crew?: any;
};

type BookingContextType = {
  booking: Booking;
  setBooking: (data: Booking) => void;
  resetBooking: () => void;
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: any) {
  const [booking, setBooking] = useState<Booking>({});

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("booking");
    if (saved) setBooking(JSON.parse(saved));
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("booking", JSON.stringify(booking));
  }, [booking]);

  function resetBooking() {
    setBooking({});
    localStorage.removeItem("booking");
  }

  return (
    <BookingContext.Provider value={{ booking, setBooking, resetBooking }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used inside BookingProvider");
  }
  return context;
}
