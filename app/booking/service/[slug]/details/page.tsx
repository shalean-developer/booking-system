'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Home, Sparkles, Key, ArrowRightLeft, Trash2, Box, Layers, Wind, Calendar as CalendarIcon, Users, Info, ChevronRight, CheckCircle2, Clock, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin, Calendar, Waves, Building, Bed, Droplet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { supabase as supabaseClient } from '@/lib/supabase-client';
import { PRICING } from '@/lib/pricing';
import type { ServiceType as DbServiceType } from '@/types/booking';
import { EXTRA_ICONS } from '@/components/extra-service-icons';

// Types
type ServiceType = 'standard' | 'deep' | 'airbnb' | 'move' | 'carpet';
interface ExtraService {
  id: string;
  name: string;
  price: number;
  icon: React.ReactNode;
}

// Constants
const SERVICES: {
  id: ServiceType;
  name: string;
  icon: React.ReactNode;
  description: string;
}[] = [{
  id: 'standard',
  name: 'Standard Cleaning',
  icon: <Home className="w-6 h-6" />,
  description: 'Regular home cleaning.'
}, {
  id: 'deep',
  name: 'Deep Cleaning',
  icon: <Sparkles className="w-6 h-6" />,
  description: 'Intensive thorough cleaning.'
}, {
  id: 'airbnb',
  name: 'Airbnb Cleaning',
  icon: <Key className="w-6 h-6" />,
  description: 'Turnover cleaning for rentals.'
}, {
  id: 'move',
  name: 'Move In/Out',
  icon: <ArrowRightLeft className="w-6 h-6" />,
  description: 'Property transition cleaning.'
}, {
  id: 'carpet',
  name: 'Carpet Cleaning',
  icon: <Waves className="w-6 h-6" />,
  description: 'Deep cleaning and stain removal.'
}];
// Extras allow-lists by service type (names must match DB item_name)
const STANDARD_AIRBNB_EXTRAS_ALLOWLIST = [
  'Inside Fridge',
  'Inside Oven',
  'Interior Walls',
  'Interior Windows',
  'Inside Cabinets',
  'Laundry & Ironing',
  'Laundry',
  'Ironing',
] as const;

// Carpet-related extras (also used as quantity extras elsewhere)
const CARPET_EXTRAS_ALLOWLIST = [
  'Carpet Cleaning',
  'Couch Cleaning',
  'Ceiling Cleaning',
  'Mattress Cleaning',
] as const;

// Fallback prices (used until DB pricing is loaded)
const BASE_PRICE = 250;
const ROOM_PRICE = 35;

// Map URL/service-card IDs to DB pricing service_type values
const SERVICE_ID_TO_DB: Record<ServiceType, DbServiceType> = {
  standard: 'Standard',
  deep: 'Deep',
  airbnb: 'Airbnb',
  move: 'Move In/Out',
  carpet: 'Carpet',
};

// Helper Components
const StepIndicator = ({
  currentStep
}: {
  currentStep: number;
}) => {
  const steps = [{
    id: 1,
    label: 'Details'
  }, {
    id: 2,
    label: 'Worker'
  }, {
    id: 3,
    label: 'Submit'
  }];
  return <div className="flex items-center justify-center space-x-3">
      {steps.map((step, idx) => <React.Fragment key={step.id}>
          <div className="flex flex-col items-center">
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors", currentStep >= step.id ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500")}>
              {currentStep > step.id ? <CheckCircle2 className="w-4 h-4" /> : step.id}
            </div>
            <span className={cn("text-[10px] mt-1.5 font-medium uppercase tracking-wider", currentStep >= step.id ? "text-blue-600" : "text-gray-400")}>
              {step.label}
            </span>
          </div>
          {idx < steps.length - 1 && <div className={cn("h-px w-12", currentStep > step.id ? "bg-blue-600" : "bg-gray-200")} />}
        </React.Fragment>)}
    </div>;
};
const Footer = () => <footer className="bg-slate-900 text-white mt-20 h-20 flex items-center">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      <div className="flex flex-col md:flex-row justify-between items-center text-slate-500 text-xs">
        <p>© 2026 Shalean Cleaning Services. All rights reserved.</p>
        <div className="flex space-x-6 mt-4 md:mt-0">
          <a href="#" className="hover:text-slate-300">Privacy Policy</a>
          <a href="#" className="hover:text-slate-300">Terms of Service</a>
        </div>
      </div>
    </div>
  </footer>;


// Section IDs in order
type SectionId = 'service' | 'house-details' | 'additional-services' | 'equipment' | 'cleaners' | 'schedule' | 'instructions';
const SECTION_ORDER: SectionId[] = ['service', 'house-details', 'additional-services', 'equipment', 'cleaners', 'schedule', 'instructions'];

// @component: BookingDetails
export const BookingDetails = () => {
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [bedrooms, setBedrooms] = useState<number | null>(null);
  const [bathrooms, setBathrooms] = useState<number | null>(null);
  const [officeCount, setOfficeCount] = useState<number | null>(null);
  const [carpetRoomStatus, setCarpetRoomStatus] = useState<'empty' | 'hasProperty' | null>(null);
  const [selectedExtras, setSelectedExtras] = useState<string[]>([]);
  const [equipmentSupplied, setEquipmentSupplied] = useState<boolean | null>(null);
  const [numCleaners, setNumCleaners] = useState<number | null>(null);
  const [bookingDate, setBookingDate] = useState<string>('');
  const [bookingTime, setBookingTime] = useState<string>('');
  const [specialInstructions, setSpecialInstructions] = useState<string>('');
  
  // Progressive disclosure state
  const [completedSections, setCompletedSections] = useState<Set<SectionId>>(new Set());

  // Live pricing (from DB) for the selected service
  const [serviceRates, setServiceRates] = useState<{ base: number; bedroom: number; bathroom: number } | null>(null);
  const [serviceRatesLoading, setServiceRatesLoading] = useState(false);

  // Live pricing (from DB) for extras
  const [extrasPrices, setExtrasPrices] = useState<Record<string, number>>({});
  const [extrasList, setExtrasList] = useState<string[]>([]);
  const [extrasLoading, setExtrasLoading] = useState(false);
  
  const toggleExtra = (id: string) => {
    setSelectedExtras(prev => prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]);
  };

  // Fetch extras (names + prices) from DB once (real-time prices, filtered per service in UI)
  useEffect(() => {
    let cancelled = false;
    setExtrasLoading(true);

    (async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabaseClient
        .from('pricing_config')
        .select('item_name, price, effective_date')
        .eq('is_active', true)
        .eq('price_type', 'extra')
        .lte('effective_date', today)
        .or(`end_date.is.null,end_date.gt.${today}`)
        .order('effective_date', { ascending: false });

      if (error) throw error;

      const prices: Record<string, number> = {};
      const seen = new Set<string>();
      for (const row of (data || []) as any[]) {
        const name = String(row.item_name || '').trim();
        if (!name || seen.has(name)) continue;
        seen.add(name);
        prices[name] = Number(row.price) || 0;
      }

      const list = Object.keys(prices);

      if (!cancelled) {
        setExtrasPrices(prices);
        setExtrasList(list);
        setExtrasLoading(false);
      }
    })().catch(() => {
      if (cancelled) return;
      // Fallback to PRICING.extras (static)
      const fallbackPrices = PRICING.extras as Record<string, number>;
      setExtrasPrices(fallbackPrices);
      setExtrasList(Object.keys(fallbackPrices));
      setExtrasLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch service prices from DB when selected service changes (real-time summary updates)
  useEffect(() => {
    let cancelled = false;

    const serviceKey: DbServiceType | null = selectedService ? SERVICE_ID_TO_DB[selectedService] : null;
    if (!serviceKey) {
      setServiceRates(null);
      setServiceRatesLoading(false);
      return;
    }

    setServiceRatesLoading(true);
    (async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabaseClient
        .from('pricing_config')
        .select('price_type, price, effective_date')
        .eq('is_active', true)
        .eq('service_type', serviceKey)
        // @ts-expect-error supabase-js typing for `in()` can be strict
        .in('price_type', ['base', 'bedroom', 'bathroom'])
        .lte('effective_date', today)
        .or(`end_date.is.null,end_date.gt.${today}`)
        .order('effective_date', { ascending: false });

      if (error) throw error;

      // Take the most recent value per price_type
      const latest: Partial<Record<'base' | 'bedroom' | 'bathroom', number>> = {};
      for (const row of (data || []) as any[]) {
        const pt = row.price_type as 'base' | 'bedroom' | 'bathroom';
        if (latest[pt] === undefined) {
          latest[pt] = Number(row.price);
        }
      }

      const fallback = (PRICING.services as any)[serviceKey] as { base: number; bedroom: number; bathroom: number } | undefined;
      const nextRates = {
        base: latest.base ?? fallback?.base ?? BASE_PRICE,
        bedroom: latest.bedroom ?? fallback?.bedroom ?? ROOM_PRICE,
        bathroom: latest.bathroom ?? fallback?.bathroom ?? ROOM_PRICE,
      };

      if (!cancelled) {
        setServiceRates(nextRates);
        setServiceRatesLoading(false);
      }
    })().catch(() => {
      if (cancelled) return;
      const fallback = (PRICING.services as any)[serviceKey] as { base: number; bedroom: number; bathroom: number } | undefined;
      setServiceRates({
        base: fallback?.base ?? BASE_PRICE,
        bedroom: fallback?.bedroom ?? ROOM_PRICE,
        bathroom: fallback?.bathroom ?? ROOM_PRICE,
      });
      setServiceRatesLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [selectedService]);
  
  // Completion detection
  const isSectionComplete = (sectionId: SectionId): boolean => {
    switch (sectionId) {
      case 'service':
        return selectedService !== null;
      case 'house-details':
        // For Carpet service: bedrooms = fitted carpets, bathrooms = loose carpets/rugs, office = room status
        if (selectedService === 'carpet') {
          return bedrooms !== null && bedrooms >= 0 && bathrooms !== null && bathrooms >= 0 && carpetRoomStatus !== null;
        }
        return bedrooms !== null && bedrooms >= 0 && bathrooms !== null && bathrooms >= 1 && officeCount !== null && officeCount >= 0;
      case 'additional-services':
        return completedSections.has('additional-services'); // Manual completion
      case 'equipment':
        return equipmentSupplied !== null && equipmentSupplied !== undefined;
      case 'cleaners':
        return numCleaners !== null;
      case 'schedule':
        return bookingDate !== '' && bookingTime !== '';
      case 'instructions':
        return completedSections.has('instructions'); // Manual completion
      default:
        return false;
    }
  };
  
  // Get next section in order
  const getNextSection = (currentSection: SectionId): SectionId | null => {
    const currentIndex = SECTION_ORDER.indexOf(currentSection);
    return currentIndex < SECTION_ORDER.length - 1 ? SECTION_ORDER[currentIndex + 1] : null;
  };
  
  // Convert Set to array for dependency tracking
  const completedSectionsArray = useMemo(() => {
    return Array.from(completedSections).sort();
  }, [completedSections.size]);
  
  // Calculate current visible section based on form state
  // This ensures the section updates immediately when form state changes
  const currentVisibleSection = useMemo<SectionId>(() => {
    // If no service selected, show service section
    if (!selectedService) {
      return 'service';
    }
    
    // Service is selected - IMMEDIATELY show house-details
    // We check completedSections, but if service is selected and house-details is not completed, show it
    const houseDetailsCompleted = completedSections.has('house-details');
    if (!houseDetailsCompleted) {
      return 'house-details';
    }
    
    // Check additional-services (manual completion)
    if (!completedSections.has('additional-services')) {
      return 'additional-services';
    }
    
    // Check equipment
    if (!completedSections.has('equipment')) {
      return 'equipment';
    }
    
    // Check cleaners
    if (!completedSections.has('cleaners')) {
      return 'cleaners';
    }
    
    // Check schedule
    if (!completedSections.has('schedule')) {
      return 'schedule';
    }
    
    // Check instructions (manual completion)
    if (!completedSections.has('instructions')) {
      return 'instructions';
    }
    
    // All sections completed, show last one
    return 'instructions';
  }, [selectedService, completedSectionsArray.join(',')]);
  
  // Handle section completion
  const handleSectionComplete = useCallback((sectionId: SectionId) => {
    setCompletedSections(prev => {
      if (!prev.has(sectionId)) {
        return new Set([...prev, sectionId]);
      }
      return prev;
    });
  }, []);
  
  // Handle manual completion (for sections with Continue buttons)
  const handleContinue = (sectionId: SectionId) => {
    handleSectionComplete(sectionId);
  };
  
  // Convert Set to string for dependency tracking - use stable string representation
  const completedSectionsKey = useMemo(() => {
    const sections = Array.from(completedSections);
    return sections.length > 0 ? sections.sort().join(',') : '';
  }, [completedSections.size]);
  
  // Auto-complete sections based on form state
  useEffect(() => {
    if (selectedService) {
      // Service is selected, mark it complete
      setCompletedSections(prev => {
        const newSet = new Set(prev);
        if (!newSet.has('service')) {
          newSet.add('service');
        }
        // Ensure house-details is NOT completed yet (user needs to fill it)
        newSet.delete('house-details');
        return newSet;
      });
    } else {
      // Reset service completion if no service selected
      setCompletedSections(prev => {
        const newSet = new Set(prev);
        newSet.delete('service');
        return newSet;
      });
    }
  }, [selectedService]);
  
  useEffect(() => {
    // Check if service is completed by checking the key string
    const serviceCompleted = completedSectionsKey.includes('service');
    const houseDetailsCompleted = completedSectionsKey.includes('house-details');
    // Only auto-complete house-details if user has actually filled in the values (not null)
    if (serviceCompleted && isSectionComplete('house-details') && !houseDetailsCompleted) {
      handleSectionComplete('house-details');
    }
  }, [bedrooms, bathrooms, officeCount, carpetRoomStatus, completedSectionsKey]);
  
  useEffect(() => {
    const additionalServicesCompleted = completedSectionsKey.includes('additional-services');
    const equipmentCompleted = completedSectionsKey.includes('equipment');
    if (additionalServicesCompleted && isSectionComplete('equipment') && !equipmentCompleted) {
      handleSectionComplete('equipment');
    }
  }, [equipmentSupplied, completedSectionsKey]);
  
  useEffect(() => {
    const equipmentCompleted = completedSectionsKey.includes('equipment');
    const cleanersCompleted = completedSectionsKey.includes('cleaners');
    if (equipmentCompleted && isSectionComplete('cleaners') && !cleanersCompleted) {
      handleSectionComplete('cleaners');
    }
  }, [numCleaners, completedSectionsKey]);
  
  useEffect(() => {
    const cleanersCompleted = completedSectionsKey.includes('cleaners');
    const scheduleCompleted = completedSectionsKey.includes('schedule');
    if (cleanersCompleted && isSectionComplete('schedule') && !scheduleCompleted) {
      handleSectionComplete('schedule');
    }
  }, [bookingDate, bookingTime, completedSectionsKey]);
  
  // Determine which sections should be visible
  // Flow:
  // - Before service: show service
  // - After service: hide service; show house-details + additional-services together
  // - After "Continue" on additional-services: hide house-details + additional-services; show equipment + cleaners together
  // - Then schedule + instructions together
  const visibleSections = useMemo(() => {
    if (!selectedService) return ['service'];

    // After service is selected, show house-details + additional-services until additional-services is continued.
    if (!completedSections.has('additional-services')) {
      return ['house-details', 'additional-services'];
    }

    // After additional-services continue, show equipment + cleaners together.
    if (!completedSections.has('equipment') || !completedSections.has('cleaners')) {
      return ['equipment', 'cleaners'];
    }

    // Show schedule + special instructions together until both are completed
    if (!completedSections.has('schedule') || !completedSections.has('instructions')) {
      return ['schedule', 'instructions'];
    }

    // Done
    return ['instructions'];
  }, [selectedService, completedSectionsArray.join(',')]);

  const allowedExtraNames = useMemo(() => {
    if (!selectedService) return [] as string[];

    // Standard/Airbnb group
    if (selectedService === 'standard' || selectedService === 'airbnb') {
      return extrasList.filter((name) => (STANDARD_AIRBNB_EXTRAS_ALLOWLIST as readonly string[]).includes(name));
    }

    // Deep/Move group: everything except Standard/Airbnb extras + laundry variants
    if (selectedService === 'deep' || selectedService === 'move') {
      const exclude = new Set<string>([
        ...(STANDARD_AIRBNB_EXTRAS_ALLOWLIST as readonly string[]),
        'Laundry & Ironing',
        'Laundry',
        'Ironing',
      ]);
      return extrasList.filter((name) => !exclude.has(name));
    }

    // Carpet group
    if (selectedService === 'carpet') {
      return extrasList.filter((name) => (CARPET_EXTRAS_ALLOWLIST as readonly string[]).includes(name));
    }

    return [];
  }, [selectedService, extrasList]);

  // If user switches service, drop any selected extras not allowed for that service
  useEffect(() => {
    if (!selectedService) return;
    const allowed = new Set(allowedExtraNames);
    setSelectedExtras((prev) => prev.filter((name) => allowed.has(name)));
  }, [selectedService, allowedExtraNames.join('|')]);

  const displayExtras: ExtraService[] = useMemo(() => {
    return allowedExtraNames.map((name) => {
      const Icon = (EXTRA_ICONS as any)?.[name] as React.ComponentType<{ className?: string }> | undefined;
      return {
        id: name,
        name,
        price: extrasPrices[name] ?? (PRICING.extras as any)[name] ?? 0,
        icon: Icon ? <Icon className="w-5 h-5" /> : <Layers className="w-5 h-5" />,
      };
    });
  }, [allowedExtraNames.join('|'), extrasPrices]);

  const extrasTotal = selectedExtras.reduce((acc, name) => acc + (extrasPrices[name] ?? (PRICING.extras as any)[name] ?? 0), 0);
  const safeBedrooms = bedrooms ?? 0;
  const safeBathrooms = bathrooms ?? 0;
  const safeOfficeCount = officeCount ?? 0;
  const selectedServiceKey: DbServiceType | null = selectedService ? SERVICE_ID_TO_DB[selectedService] : null;
  const fallbackRates = selectedServiceKey ? ((PRICING.services as any)[selectedServiceKey] as { base: number; bedroom: number; bathroom: number } | undefined) : undefined;
  const basePrice = serviceRates?.base ?? fallbackRates?.base ?? BASE_PRICE;
  const bedroomRate = serviceRates?.bedroom ?? fallbackRates?.bedroom ?? ROOM_PRICE;
  const bathroomRate = serviceRates?.bathroom ?? fallbackRates?.bathroom ?? ROOM_PRICE;

  // Rooms pricing:
  // - Standard/Airbnb/Deep/Move: bedrooms + bathrooms + offices (office uses bedroom rate)
  // - Carpet: bedrooms = fitted carpets (bedroomRate), bathrooms = loose carpets/rugs (bathroomRate), plus room-status fee if property present
  const carpetPropertyMoveFee = selectedServiceKey === 'Carpet' && carpetRoomStatus === 'hasProperty' ? 250 : 0;
  const roomTotal = selectedServiceKey === 'Carpet'
    ? (safeBedrooms * bedroomRate + safeBathrooms * bathroomRate + carpetPropertyMoveFee)
    : (safeBedrooms * bedroomRate + safeBathrooms * bathroomRate + safeOfficeCount * bedroomRate);
  const subtotal = basePrice + roomTotal + extrasTotal;
  const serviceFee = subtotal * 0.1176; // Calculated from R318.52 - R285.00 roughly
  const total = subtotal + serviceFee;

  // @return
  return <div className="min-h-screen bg-[#F9FAFB] font-sans text-slate-900">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <Waves className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Shalean</span>
          </div>

          {/* Stepper - Between logo and navlinks */}
          <div className="hidden md:flex items-center justify-center flex-1 px-8">
            <StepIndicator currentStep={1} />
          </div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#" className="hover:text-blue-600">Services</a>
            <a href="#" className="hover:text-blue-600">Pricing</a>
            <a href="#" className="hover:text-blue-600">Help Center</a>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition-colors">
              Book Now
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Main Form Area */}
          <div className="lg:col-span-8 space-y-8">
            <AnimatePresence>
              {/* Select Service */}
              {visibleSections.includes('service') && (
                <motion.section
                  key="service"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl py-8 -ml-4 sm:-ml-6 lg:-ml-8"
                >
              <div className="space-y-6">
                {/* Main Question */}
                <div className="text-center space-y-2">
                  <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">
                    Select Your Service
                  </h2>
                  <p className="text-base md:text-lg text-gray-700">
                    Choose the type of cleaning service you need
                  </p>
                </div>

                {/* Cards Container */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  {SERVICES.map(service => (
                    <motion.button
                      key={service.id}
                      type="button"
                      onClick={() => setSelectedService(service.id)}
                      className={cn(
                        'w-full bg-white rounded-xl shadow-md p-4',
                        'transition-all duration-200',
                        'hover:shadow-lg hover:scale-[1.02]',
                        'focus:outline-none focus:ring-2 focus:ring-blue-500/30',
                        selectedService === service.id
                          ? 'bg-blue-50 shadow-lg'
                          : ''
                      )}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex flex-col space-y-2">
                        {/* Icon and Title Row */}
                        <div className="flex items-center gap-3">
                          {/* Icon */}
                          <div className={cn(
                            "w-10 h-10 flex items-center justify-center flex-shrink-0 rounded-lg",
                            selectedService === service.id ? "bg-blue-100 text-blue-600" : "bg-gray-50 text-gray-600"
                          )}>
                            {service.icon}
                          </div>

                          {/* Title */}
                          <h3 className="text-lg font-semibold text-gray-900 text-left">
                            {service.name}
                          </h3>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 text-left">
                          {service.description}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>
                </motion.section>
              )}

              {/* House Details */}
              {visibleSections.includes('house-details') && (
                <motion.section
                  key="house-details"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl p-8 -ml-4 sm:-ml-6 lg:-ml-8"
                >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Home className="w-5 h-5 text-blue-500" />
                House Details
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Bed className="w-4 h-4 text-blue-500" />
                    {selectedService === 'carpet' ? 'Fitted Carpets' : 'Bedrooms'}
                  </label>
                  <select
                    value={bedrooms ?? ''}
                    onChange={e => setBedrooms(e.target.value === '' ? null : Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                  >
                    <option value="">Select...</option>
                    {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Bedroom' : 'Bedrooms'}</option>)}
                  </select>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Droplet className="w-4 h-4 text-blue-500" />
                    {selectedService === 'carpet' ? 'Loose Carpets/Rugs' : 'Bathrooms'}
                  </label>
                  <select value={bathrooms ?? ''} onChange={e => setBathrooms(e.target.value === '' ? null : Number(e.target.value))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none">
                    <option value="">Select...</option>
                    {selectedService === 'carpet'
                      ? [0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Item' : 'Items'}</option>)
                      : [1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Bathroom' : 'Bathrooms'}</option>)
                    }
                  </select>
                </div>
                <div className="bg-white rounded-xl p-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-500" />
                    {selectedService === 'carpet' ? 'Room Status' : 'Office'}
                  </label>
                  {selectedService === 'carpet' ? (
                    <select
                      value={carpetRoomStatus ?? ''}
                      onChange={e => setCarpetRoomStatus(e.target.value === '' ? null : (e.target.value as any))}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                    >
                      <option value="">Select...</option>
                      <option value="empty">Empty</option>
                      <option value="hasProperty">Has Property</option>
                    </select>
                  ) : (
                    <select value={officeCount ?? ''} onChange={e => setOfficeCount(e.target.value === '' ? null : Number(e.target.value))} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none">
                      <option value="">Select...</option>
                      {[0, 1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} {n === 1 ? 'Office' : 'Offices'}</option>)}
                    </select>
                  )}
                </div>
              </div>
                </motion.section>
              )}

              {/* Additional Services */}
              {visibleSections.includes('additional-services') && (
                <motion.section
                  key="additional-services"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl px-8 pb-8 pt-0 -ml-4 sm:-ml-6 lg:-ml-8"
                >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Box className="w-5 h-5 text-blue-500" />
                Additional Services <span className="text-sm font-normal text-gray-400 ml-2">(Optional)</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {displayExtras.map(extra => <button key={extra.id} onClick={() => toggleExtra(extra.id)} className={cn("flex flex-col items-center p-3 rounded-xl border transition-all text-center bg-white", selectedExtras.includes(extra.id) ? "border-blue-500 bg-blue-50 text-blue-600" : "border-gray-100 hover:border-gray-200 text-gray-500")}>
                    <div className={cn("p-2 rounded-lg mb-2", selectedExtras.includes(extra.id) ? "bg-blue-100" : "bg-gray-50")}>
                      {extra.icon}
                    </div>
                    <span className="text-sm font-semibold text-gray-700 line-clamp-2 min-h-[40px] leading-tight">
                      {extra.name}
                    </span>
                    <span className="text-sm font-semibold text-gray-700 mt-1">R{extra.price}</span>
                  </button>)}
              </div>
              
              {/* Continue Button for Additional Services */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => handleContinue('additional-services')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  Continue
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.section>
              )}

              {/* Equipment + Cleaners (side-by-side dropdowns) */}
              {(visibleSections.includes('equipment') || visibleSections.includes('cleaners')) && (
                <motion.section
                  key="equipment-cleaners"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-8 -ml-4 sm:-ml-6 lg:-ml-8"
                >
                  <h2 className="text-xl font-bold mb-6">Cleaning Setup</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Info className="w-4 h-4 text-blue-500" />
                        Cleaning Equipment
                      </label>
                      <select
                        value={equipmentSupplied === null ? '' : equipmentSupplied ? 'yes' : 'no'}
                        onChange={(e) => {
                          const v = e.target.value;
                          setEquipmentSupplied(v === '' ? null : v === 'yes');
                        }}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                      >
                        <option value="">Select...</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </div>

                    <div className="bg-white rounded-xl p-4 border border-gray-200">
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-500" />
                        Number of Cleaners
                      </label>
                      <select
                        value={numCleaners ?? ''}
                        onChange={(e) => setNumCleaners(e.target.value === '' ? null : Number(e.target.value))}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                      >
                        <option value="">Select...</option>
                        {[1, 2, 3, 4, 5].map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? 'cleaner' : 'cleaners'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* Schedule */}
              {visibleSections.includes('schedule') && (
                <motion.section
                  key="schedule"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-8 -ml-4 sm:-ml-6 lg:-ml-8"
                >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-blue-500" />
                Schedule
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pick a date</label>
                  <div className="relative">
                    <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} className="booking-native-datetime w-full bg-gray-50 border border-gray-200 rounded-xl px-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none" />
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select time</label>
                  <div className="relative">
                    <input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)} className="booking-native-datetime w-full bg-gray-50 border border-gray-200 rounded-xl px-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none" />
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>
              </div>
                </motion.section>
              )}

              {/* Special Instructions */}
              {visibleSections.includes('instructions') && (
                <motion.section
                  key="instructions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-8 -ml-4 sm:-ml-6 lg:-ml-8"
                >
              <h2 className="text-xl font-bold mb-4">Special Instructions</h2>
              <textarea placeholder="Add your notes here... (e.g. key location, pets, focus areas)" value={specialInstructions} onChange={e => setSpecialInstructions(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px] resize-none appearance-none" />
              
              {/* Continue Button for Special Instructions */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => handleContinue('instructions')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  Continue to Worker Selection
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <p className="text-[11px] text-right text-gray-400 leading-tight mt-3">
                By clicking continue, you agree to our terms of service and privacy policy regarding your cleaning appointment.
              </p>
            </motion.section>
              )}
            </AnimatePresence>
          </div>

          {/* Sticky Sidebar Summary */}
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

                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Schedule</span>
                    <span className="font-medium text-slate-900 text-right">
                      {bookingDate && bookingTime ? `${bookingDate} @ ${bookingTime}` : 'Not scheduled'}
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
        </div>
      </main>

      <Footer />
    </div>;
};

export default BookingDetails;
