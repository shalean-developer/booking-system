'use client';

import React from 'react';
import { CheckCircle2, Users, Sparkles } from 'lucide-react';
import { PRICING } from '@/lib/pricing';
import type { ServiceType as DbServiceType } from '@/types/booking';

type ServiceType = 'standard' | 'deep' | 'airbnb' | 'move' | 'carpet';

const SERVICES: {
  id: ServiceType;
  name: string;
}[] = [{
  id: 'standard',
  name: 'Standard Cleaning',
}, {
  id: 'deep',
  name: 'Deep Cleaning',
}, {
  id: 'airbnb',
  name: 'Airbnb Cleaning',
}, {
  id: 'move',
  name: 'Move In/Out',
}, {
  id: 'carpet',
  name: 'Carpet Cleaning',
}];

interface BookingSummaryDetailsProps {
  selectedService: ServiceType | null;
  numCleaners: number;
  equipmentSupplied: boolean | null;
  serviceRatesLoading: boolean;
  basePrice: number;
  roomTotal: number;
  bookingDate: string;
  bookingTime: string;
  selectedExtras: string[];
  extrasTotal: number;
  subtotal: number;
  serviceFee: number;
  total: number;
  safeBedrooms: number;
  safeBathrooms: number;
  safeOfficeCount: number;
  carpetRoomStatus: 'empty' | 'hasProperty' | null;
  extrasPrices: Record<string, number>;
}

export function BookingSummaryDetails({
  selectedService,
  numCleaners,
  equipmentSupplied,
  serviceRatesLoading,
  basePrice,
  roomTotal,
  bookingDate,
  bookingTime,
  selectedExtras,
  extrasTotal,
  subtotal,
  serviceFee,
  total,
  safeBedrooms,
  safeBathrooms,
  safeOfficeCount,
  carpetRoomStatus,
  extrasPrices,
}: BookingSummaryDetailsProps) {
  return (
    <div className="lg:col-span-4 sticky top-24 -mr-4 sm:-mr-6 lg:-mr-8">
      <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-xl overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />
        
        <h2 className="text-2xl font-bold text-slate-900 mb-8">Booking Summary</h2>
        
        <div className="space-y-6">
          {/* Minimal summary */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Service</span>
              <span className="font-bold text-slate-900">
                {selectedService ? SERVICES.find((s) => s.id === selectedService)?.name : 'Not selected'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4 text-center">
              <div className="min-w-0 flex flex-col items-center">
                <span className="text-slate-500 text-sm">Cleaners</span>
                <div className="font-medium text-slate-900 truncate w-full">{numCleaners}</div>
              </div>
              <div className="min-w-0 flex flex-col items-center">
                <span className="text-slate-500 text-sm">Equipment</span>
                <div className="font-medium text-slate-900 truncate w-full">
                  {equipmentSupplied == null
                    ? 'No'
                    : equipmentSupplied
                      ? 'Yes'
                      : 'No'}
                </div>
              </div>
              <div className="min-w-0 flex flex-col items-center">
                <span className="text-slate-500 text-sm">Base</span>
                <div className="font-medium text-slate-900 truncate w-full">
                  {serviceRatesLoading ? 'Loading…' : `R${basePrice.toFixed(2)}`}
                </div>
              </div>
              <div className="min-w-0 flex flex-col items-center">
                <span className="text-slate-500 text-sm">Rooms</span>
                <div className="font-medium text-slate-900 truncate w-full">R{roomTotal.toFixed(2)}</div>
              </div>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Schedule</span>
              <span className="font-medium text-slate-900 text-right">
                {bookingDate && bookingTime ? `${bookingDate} @ ${bookingTime}` : 'Not scheduled'}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm border-t border-dashed border-gray-100 pt-3">
              <span className="text-slate-700 font-semibold">Service total</span>
              <span className="font-semibold text-slate-900">
                {serviceRatesLoading ? 'Loading…' : `R${(basePrice + roomTotal).toFixed(2)}`}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Add-ons</span>
              <span className="font-medium text-slate-900 text-right">
                {selectedExtras.length > 0 ? `${selectedExtras.length} item(s) — R${extrasTotal.toFixed(2)}` : 'None'}
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500">Estimated duration</span>
              <span className="font-medium text-slate-900 text-right">
                {selectedService
                  ? (() => {
                      let hours =
                        selectedService === 'standard'
                          ? 2.0
                          : selectedService === 'airbnb'
                          ? 2.5
                          : selectedService === 'deep'
                          ? 4.0
                          : selectedService === 'move'
                          ? 4.5
                          : selectedService === 'carpet'
                          ? 2.0
                          : 2.5;

                      if (selectedService === 'carpet') {
                        hours += safeBedrooms * 0.5; // fitted carpets proxy
                        hours += safeBathrooms * 0.25; // loose carpets proxy
                        if (carpetRoomStatus === 'hasProperty') hours += 0.5;
                      } else {
                        hours += safeBedrooms * 0.5;
                        hours += safeBathrooms * 0.75;
                        hours += safeOfficeCount * 0.25;
                      }

                      hours += selectedExtras.length * 0.25;
                      const roundHalf = (v: number) => Math.round(v * 2) / 2;
                      const base = Math.min(12, Math.max(1.5, roundHalf(hours)));
                      const min = Math.max(1, roundHalf(base * 0.9));
                      const max = Math.max(min, roundHalf(base * 1.1));
                      return `Est. ${min}–${max} hrs`;
                    })()
                  : '—'}
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="pt-6 border-t border-gray-100 flex justify-between items-end">
            <div>
              <span className="block text-3xl font-black text-blue-600">R{total.toFixed(2)}</span>
              <span className="text-[10px] text-gray-400 font-medium mt-1">ALL FEES INCLUDED</span>
            </div>
            <div className="text-right">
              <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                VAT Incl.
              </span>
            </div>
          </div>

          {/* View details (collapsed) */}
          <details className="border-t border-dashed border-gray-100 pt-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700 select-none">
              View details
            </summary>

            <div className="mt-4 space-y-6">
              <div>
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-4">Price Breakdown</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Base Price</span>
                    <span className="font-medium">{serviceRatesLoading ? 'Loading…' : `R${basePrice.toFixed(2)}`}</span>
                  </div>
                  {roomTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">
                        {selectedService === 'carpet'
                          ? `Fitted Carpets, Loose Carpets/Rugs & Room Status (${safeBedrooms} fitted, ${safeBathrooms} loose, ${
                              carpetRoomStatus === 'hasProperty' ? 'has property' : 'empty'
                            })`
                          : `Bedrooms, Bathrooms & Offices (${safeBedrooms} bed, ${safeBathrooms} bath, ${safeOfficeCount} office)`}
                      </span>
                      <span className="font-medium">R{roomTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedExtras.map((name) => {
                    const unitPrice = extrasPrices[name] ?? (PRICING.extras as any)[name] ?? 0;
                    return (
                      <div key={name} className="flex justify-between text-sm">
                        <span className="text-slate-500">{name}</span>
                        <span className="font-medium">R{Number(unitPrice).toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-gray-100 pt-6 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Subtotal</span>
                  <span className="font-bold">R{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Service Fee</span>
                  <span className="font-medium">R{serviceFee.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </details>

          {/* Primary continue action now lives in Special Instructions */}
        </div>

        {/* Trust Badges */}
        <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between opacity-60">
          <div className="flex flex-col items-center">
            <div className="bg-gray-100 p-2 rounded-full mb-1">
              <CheckCircle2 className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-[8px] font-bold uppercase">Insured</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-gray-100 p-2 rounded-full mb-1">
              <Users className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-[8px] font-bold uppercase">Vetted</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="bg-gray-100 p-2 rounded-full mb-1">
              <Sparkles className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-[8px] font-bold uppercase">Quality</span>
          </div>
        </div>
      </div>
    </div>
  );
}
