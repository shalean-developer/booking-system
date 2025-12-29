"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Home,
  Star,
  Building,
  Calendar,
  Mail,
  Phone,
  User,
  ArrowLeft,
  ArrowRight,
  Loader2,
  LucideIcon,
} from 'lucide-react';
import {
  FridgeIcon,
  OvenIcon,
  CabinetsIcon,
  WindowsIcon,
  WallsIcon,
  IroningIcon,
  LaundryIcon,
  EXTRA_ICONS,
} from '@/components/extra-service-icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { ServiceType } from '@/types/booking';

// Service type to Lucide icon mapping
const SERVICE_ICON_MAP: Record<string, LucideIcon> = {
  'Standard': Home,
  'Deep': Star,
  'Move In/Out': Building,
  'Airbnb': Calendar,
};

interface ServiceOption {
  id: ServiceType;
  label: string;
  subLabel: string;
  icon: LucideIcon;
  description: string;
}

interface ExtraService {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ContactCardProps {
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  setContact: (contact: any) => void;
}

function ContactCard({ contact, setContact }: ContactCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-lg sm:text-xl">1. Your Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName" className="text-sm text-gray-600 mb-2 block">
                First name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="firstName"
                  value={contact.firstName}
                  onChange={(e) => setContact({ ...contact, firstName: e.target.value })}
                  className="pl-10"
                  placeholder="John"
                  aria-label="First name"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="lastName" className="text-sm text-gray-600 mb-2 block">
                Last name
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="lastName"
                  value={contact.lastName}
                  onChange={(e) => setContact({ ...contact, lastName: e.target.value })}
                  className="pl-10"
                  placeholder="Doe"
                  aria-label="Last name"
                  required
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="email" className="text-sm text-gray-600 mb-2 block">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={contact.email}
                  onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  className="pl-10"
                  placeholder="john.doe@example.com"
                  aria-label="Email"
                  required
                />
              </div>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="phone" className="text-sm text-gray-600 mb-2 block">
                Phone Number
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  value={contact.phone}
                  onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  className="pl-10"
                  placeholder="+27 12 345 6789"
                  aria-label="Phone number"
                  required
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ServiceGridProps {
  selected: ServiceType | null;
  setSelected: (service: ServiceType) => void;
}

interface ServiceGridProps {
  selected: ServiceType | null;
  setSelected: (service: ServiceType) => void;
  services: ServiceOption[];
}

function ServiceGrid({ selected, setSelected, services }: ServiceGridProps) {
  if (services.length === 0) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
            <CardTitle className="text-lg sm:text-xl">2. Select Your Service</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-center text-gray-500 py-8">Loading services...</div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-lg sm:text-xl">2. Select Your Service</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {services.map((s) => {
              const isSelected = selected === s.id;
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelected(s.id)}
                  className={`rounded-xl p-4 sm:p-5 text-center cursor-pointer transform transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                    isSelected
                      ? 'ring-2 ring-primary/60 bg-primary/5 border-2 border-primary'
                      : 'border-2 border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary" strokeWidth={1.5} />
                  </div>
                  <div className="text-sm font-medium text-gray-800">{s.label}</div>
                  <div className="text-sm font-medium text-gray-800">{s.subLabel}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface HomeDetailsCardProps {
  bedrooms: number;
  setBedrooms: (bedrooms: number) => void;
  bathrooms: number;
  setBathrooms: (bathrooms: number) => void;
}

function HomeDetailsCard({ bedrooms, setBedrooms, bathrooms, setBathrooms }: HomeDetailsCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-lg sm:text-xl">3. Home Details</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="bedrooms" className="text-sm text-gray-600 mb-2 block">
                Bedrooms
              </Label>
              <Select value={bedrooms.toString()} onValueChange={(value) => setBedrooms(Number(value))}>
                <SelectTrigger id="bedrooms">
                  <SelectValue placeholder="Select bedrooms" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i} {i === 1 ? 'Bedroom' : 'Bedrooms'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bathrooms" className="text-sm text-gray-600 mb-2 block">
                Bathrooms
              </Label>
              <Select value={bathrooms.toString()} onValueChange={(value) => setBathrooms(Number(value))}>
                <SelectTrigger id="bathrooms">
                  <SelectValue placeholder="Select bathrooms" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <SelectItem key={i} value={i.toString()}>
                      {i} {i === 1 ? 'Bathroom' : 'Bathrooms'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3">Bedrooms and bathrooms affect the base price.</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ExtrasGridProps {
  selectedExtras: string[];
  toggleExtra: (extra: string) => void;
  extras: ExtraService[];
}

function ExtrasGrid({ selectedExtras, toggleExtra, extras }: ExtrasGridProps) {
  if (extras.length === 0) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
            <CardTitle className="text-lg sm:text-xl font-bold text-gray-800">4. Additional Services (Optional)</CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
            <div className="text-center text-gray-500 py-8">Loading extra services...</div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-lg sm:text-xl font-bold text-gray-800">4. Additional Services (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="flex flex-wrap gap-4 sm:gap-5 md:gap-6">
            {extras.map((ex) => {
              const isPressed = selectedExtras.includes(ex.id);
              const Icon = ex.icon;
              return (
                <button
                  key={ex.id}
                  aria-pressed={isPressed}
                  onClick={() => toggleExtra(ex.id)}
                  className="flex flex-col items-center gap-3 cursor-pointer transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500/30"
                  type="button"
                >
                  <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full border flex items-center justify-center transition-colors ${
                    isPressed
                      ? 'border-green-600 bg-green-50/50'
                      : 'border-green-500 bg-white'
                  }`}>
                    <Icon className={`h-8 w-8 sm:h-9 sm:w-9 ${
                      isPressed ? 'text-green-700' : 'text-green-600'
                    }`} />
                  </div>
                  <span className="text-xs sm:text-sm text-gray-700 font-normal text-center leading-tight max-w-[80px]">
                    {ex.label}
                  </span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface QuoteSummaryProps {
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  serviceId: ServiceType | null;
  bedrooms: number;
  bathrooms: number;
  extras: string[];
  onSubmit: () => void;
  isSubmitting: boolean;
}

function QuoteSummary({ contact, serviceId, bedrooms, bathrooms, extras, onSubmit, isSubmitting }: QuoteSummaryProps) {
  const isFormValid = contact.firstName && contact.lastName && contact.email && contact.phone && serviceId;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 }}
      className="lg:sticky lg:top-6 lg:h-fit"
    >
      <Card className="border-0 shadow-lg">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5">
          <CardTitle className="text-lg sm:text-xl">Your Quote</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Service</div>
              <div className="text-sm font-medium text-gray-800">
                {serviceId || <span className="text-gray-400">Not selected</span>}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Home details</div>
              <div className="text-sm font-medium text-gray-800">
                {bedrooms} bd • {bathrooms} ba
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Extras</div>
              <div className="text-sm font-medium text-gray-800">{extras.length}</div>
            </div>

            <hr className="border-t border-gray-200 my-2" />

            {/* Custom Quote Notice - No Price Display */}
            <div className="rounded-lg bg-primary/5 p-4 text-center">
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Custom Quote
              </p>
              <p className="text-xs text-gray-600">
                We&apos;ll provide a personalized quote based on your selections
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Button
              onClick={onSubmit}
              disabled={!isFormValid || isSubmitting}
              size="lg"
              className="w-full bg-primary hover:bg-primary/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">Sending Quote...</span>
                  <span className="sm:hidden">Sending...</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Confirm Quote & Continue</span>
                  <span className="sm:hidden">Confirm & Continue</span>
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            <Link href="/booking/service/select" className="block">
              <Button variant="outline" size="lg" className="w-full">
                <span className="hidden sm:inline">Skip to Full Booking</span>
                <span className="sm:hidden">Full Booking</span>
              </Button>
            </Link>

            <p className="text-xs text-gray-500 text-center mt-3">
              We will email this quote to {contact.email || 'your email'}.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function QuoteContent() {
  const router = useRouter();
  const [contact, setContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });
  const [serviceId, setServiceId] = useState<ServiceType | null>(null);
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(1);
  const [extras, setExtras] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [extrasList, setExtrasList] = useState<ExtraService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch services and extras from database
  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/quote/services');
        const data = await response.json();

        if (data.ok) {
          // Transform services data
          const transformedServices: ServiceOption[] = data.services.map((s: any) => ({
            id: s.id as ServiceType,
            label: s.label,
            subLabel: s.subLabel,
            icon: SERVICE_ICON_MAP[s.id] || Home, // Fallback to Home icon
            description: s.description || '',
          }));

          // Transform extras data with icon mapping
          const transformedExtras: ExtraService[] = data.extras.map((ex: any) => {
            // Map database name to icon component
            // Try exact match first
            let IconComponent = EXTRA_ICONS[ex.id as keyof typeof EXTRA_ICONS];
            
            // Handle variations and individual services
            if (!IconComponent) {
              const idLower = ex.id.toLowerCase();
              if (idLower.includes('laundry') && idLower.includes('ironing')) {
                IconComponent = EXTRA_ICONS['Laundry & Ironing'] || LaundryIcon;
              } else if (idLower.includes('ironing')) {
                IconComponent = IroningIcon;
              } else if (idLower.includes('laundry')) {
                IconComponent = LaundryIcon;
              } else if (idLower.includes('fridge')) {
                IconComponent = FridgeIcon;
              } else if (idLower.includes('oven')) {
                IconComponent = OvenIcon;
              } else if (idLower.includes('cabinet')) {
                IconComponent = CabinetsIcon;
              } else if (idLower.includes('window')) {
                IconComponent = WindowsIcon;
              } else if (idLower.includes('wall')) {
                IconComponent = WallsIcon;
              } else {
                // Try to find a partial match in EXTRA_ICONS
                const matchingKey = Object.keys(EXTRA_ICONS).find(key => 
                  key.toLowerCase().includes(idLower) || idLower.includes(key.toLowerCase())
                );
                if (matchingKey) {
                  IconComponent = EXTRA_ICONS[matchingKey as keyof typeof EXTRA_ICONS];
                } else {
                  // Default fallback
                  IconComponent = FridgeIcon;
                }
              }
            }
            
            return {
              id: ex.id,
              label: ex.label,
              icon: IconComponent,
            };
          });

          setServices(transformedServices);
          setExtrasList(transformedExtras);
        } else {
          console.error('Failed to fetch services:', data.error);
          // Fallback to empty arrays on error
          setServices([]);
          setExtrasList([]);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        // Fallback to empty arrays on error
        setServices([]);
        setExtrasList([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  function toggleExtra(id: string) {
    setExtras((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  const handleSubmit = async () => {
    if (!serviceId) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/quote-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service: serviceId,
          bedrooms,
          bathrooms,
          extras,
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.ok) {
        // Show success message even if email failed
        if (result.emailError) {
          if (result.emailError === 'Email service not configured') {
            console.log('Quote recorded successfully (email service not configured):', result.quoteId);
          } else {
            console.warn('Email sending failed but quote was recorded:', result.emailError);
          }
        }

        // Redirect to quote confirmation page
        router.push('/booking/quote/confirmation');
      } else {
        alert(`Failed to send quote confirmation: ${result.error || 'Please try again.'}`);
      }
    } catch (error) {
      console.error('Quote confirmation error:', error);
      alert(`An error occurred: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:py-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="text-xl sm:text-2xl font-bold text-primary">Shalean</div>
              <span className="text-xs sm:text-sm text-gray-500 hidden xs:inline">Cleaning Services</span>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm" className="h-9 px-2 sm:px-4">
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Back to Home</span>
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 py-6 sm:py-8 lg:py-12">
        <motion.header initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 sm:mb-8 text-center">
          <Badge className="mb-3 sm:mb-4 bg-primary/10 text-primary border-primary/20 text-xs sm:text-sm">
            Free Quote Request
          </Badge>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 px-2">
            Get Your Free Cleaning Quote
          </h1>
          <p className="mt-2 sm:mt-3 text-sm sm:text-base text-gray-600 px-4">
            Tell us about your cleaning needs and we&apos;ll get back to you with a personalized quote
          </p>
        </motion.header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <ContactCard contact={contact} setContact={setContact} />
            {isLoading ? (
              <Card className="border-0 shadow-lg">
                <CardContent className="px-4 sm:px-6 py-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                  <p className="text-sm text-gray-600">Loading services...</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <ServiceGrid selected={serviceId} setSelected={setServiceId} services={services} />
                <HomeDetailsCard
                  bedrooms={bedrooms}
                  setBedrooms={setBedrooms}
                  bathrooms={bathrooms}
                  setBathrooms={setBathrooms}
                />
                <ExtrasGrid selectedExtras={extras} toggleExtra={toggleExtra} extras={extrasList} />
              </>
            )}
          </div>

          <div className="hidden lg:block lg:col-span-4">
            <QuoteSummary
              contact={contact}
              serviceId={serviceId}
              bedrooms={bedrooms}
              bathrooms={bathrooms}
              extras={extras}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>

      {/* Mobile condensed summary bar (visible below lg) - No Price Display */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
        <div className="bg-white rounded-xl shadow-lg p-4 border border-gray-100 flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-900">Custom Quote</div>
            <div className="text-xs text-gray-600">Personalized pricing</div>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!contact.firstName || !contact.lastName || !contact.email || !contact.phone || !serviceId || isSubmitting}
            className="bg-primary hover:bg-primary/90"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Confirm
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

