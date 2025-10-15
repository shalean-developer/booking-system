'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Home, 
  Sparkles, 
  TruckIcon, 
  Calendar,
  Plus,
  Minus,
  Receipt,
  ArrowRight,
  Mail,
  Phone,
  User
} from 'lucide-react';
import { PRICING } from '@/lib/pricing';
import type { ServiceType } from '@/types/booking';

export default function QuotePage() {
  const router = useRouter();
  const [service, setService] = useState<ServiceType | null>(null);
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);
  const [extras, setExtras] = useState<string[]>([]);
  const [showContactForm, setShowContactForm] = useState(false);
  
  // Contact form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const serviceOptions: { type: ServiceType; icon: any; description: string }[] = [
    {
      type: 'Standard',
      icon: Home,
      description: 'Regular home cleaning',
    },
    {
      type: 'Deep',
      icon: Sparkles,
      description: 'Thorough deep cleaning',
    },
    {
      type: 'Move In/Out',
      icon: TruckIcon,
      description: 'Moving transition cleaning',
    },
    {
      type: 'Airbnb',
      icon: Calendar,
      description: 'Guest turnover cleaning',
    },
  ];

  const toggleExtra = (extra: string) => {
    setExtras((prev) =>
      prev.includes(extra) ? prev.filter((e) => e !== extra) : [...prev, extra]
    );
  };

  const handleGetQuote = () => {
    if (!service) return;
    setShowContactForm(true);
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here you would typically send the quote request to your backend
    console.log('Quote request submitted:', {
      service,
      bedrooms,
      bathrooms,
      extras,
      firstName,
      lastName,
      email,
      phone,
    });

    // For now, redirect to booking page with pre-filled data
    // You could also store this in localStorage and redirect
    router.push('/booking');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-primary">Shalean</div>
              <span className="text-sm text-gray-500">Cleaning Services</span>
            </div>
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Free Quote Request
          </Badge>
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            Get Your Free Cleaning Quote
          </h1>
          <p className="text-lg text-gray-600">
            Tell us about your cleaning needs and we&apos;ll get back to you with a personalized quote
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
          {/* Quote Configuration */}
          <div className="space-y-6">
            {/* Service Type Selection */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>1. Select Your Service</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2">
                  {serviceOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = service === option.type;
                    return (
                      <button
                        key={option.type}
                        onClick={() => setService(option.type)}
                        className={`flex flex-col items-center gap-3 rounded-lg border-2 p-6 text-center transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div
                          className={`rounded-full p-3 ${
                            isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          <Icon className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{option.type}</div>
                          <div className="text-sm text-slate-600">{option.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Home Details */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>2. Home Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Bedrooms */}
                  <div>
                    <Label className="mb-3 block text-sm font-medium">
                      Bedrooms
                    </Label>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setBedrooms(Math.max(1, bedrooms - 1))}
                        disabled={bedrooms <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="flex h-12 w-20 items-center justify-center rounded-lg border-2 border-slate-200 bg-white text-xl font-semibold">
                        {bedrooms}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setBedrooms(Math.min(10, bedrooms + 1))}
                        disabled={bedrooms >= 10}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Bathrooms */}
                  <div>
                    <Label className="mb-3 block text-sm font-medium">
                      Bathrooms
                    </Label>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setBathrooms(Math.max(1, bathrooms - 1))}
                        disabled={bathrooms <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <div className="flex h-12 w-20 items-center justify-center rounded-lg border-2 border-slate-200 bg-white text-xl font-semibold">
                        {bathrooms}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setBathrooms(Math.min(10, bathrooms + 1))}
                        disabled={bathrooms >= 10}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Extras */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>3. Additional Services (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(PRICING.extras).map(([extra, price]) => (
                    <div
                      key={extra}
                      className="flex items-center rounded-lg border p-4 hover:bg-slate-50"
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={extra}
                          checked={extras.includes(extra)}
                          onCheckedChange={() => toggleExtra(extra)}
                        />
                        <label
                          htmlFor={extra}
                          className="cursor-pointer text-sm font-medium text-slate-900"
                        >
                          {extra}
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Contact Form (conditional) */}
            {showContactForm && (
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle>4. Your Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmitQuote} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="firstName">First Name</Label>
                        <div className="relative mt-2">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="firstName"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="John"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name</Label>
                        <div className="relative mt-2">
                          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            id="lastName"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Doe"
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <div className="relative mt-2">
                        <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="john.doe@example.com"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative mt-2">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+27 12 345 6789"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      Confirm Quote & Continue to Booking
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quote Summary (Sticky) */}
          <div className="lg:sticky lg:top-6 lg:h-fit">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Your Quote
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Service Summary */}
                  {service && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-slate-700">Service</h3>
                      <Badge variant="secondary" className="text-sm">
                        {service}
                      </Badge>
                    </div>
                  )}

                  {/* Home Details */}
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-slate-700">Home Details</h3>
                    <div className="space-y-1 text-sm text-slate-600">
                      <p>{bedrooms} Bedroom{bedrooms !== 1 ? 's' : ''}</p>
                      <p>{bathrooms} Bathroom{bathrooms !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {/* Extras */}
                  {extras.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-slate-700">
                        Additional Services
                      </h3>
                      <div className="space-y-1">
                        {extras.map((extra) => (
                          <div key={extra} className="flex items-center text-sm">
                            <span className="text-slate-600">• {extra}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quote Notice */}
                  <div className="border-t pt-4">
                    <div className="rounded-lg bg-primary/5 p-4 text-center">
                      <p className="text-sm font-medium text-slate-900 mb-1">
                        Custom Quote
                      </p>
                      <p className="text-xs text-slate-600">
                        We&apos;ll provide a personalized quote based on your selections
                      </p>
                    </div>
                  </div>

                  {/* CTA Button */}
                  {!showContactForm ? (
                    <Button
                      onClick={handleGetQuote}
                      disabled={!service}
                      size="lg"
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      Continue to Contact Details
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <div className="rounded-lg bg-green-50 p-4 text-center">
                      <p className="text-sm font-medium text-green-800">
                        ✓ Fill in your contact details below to receive your quote
                      </p>
                    </div>
                  )}

                  {/* Alternative CTA */}
                  <Link href="/booking" className="block">
                    <Button variant="outline" size="lg" className="w-full">
                      Skip to Full Booking
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

