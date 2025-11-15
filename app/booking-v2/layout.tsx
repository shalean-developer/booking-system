'use client';

import { Header } from '@/components/header';

export default function BookingV2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 md:px-16 py-8 md:py-12">
          {children}
        </div>
      </div>
    </>
  );
}
