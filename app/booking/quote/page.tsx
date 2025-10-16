'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Home, 
  Sparkles, 
  TruckIcon, 
  Calendar,
  Receipt,
  ArrowRight,
  Mail,
  Phone,
  User,
  Settings,
  Building,
  Key,
  Star,
  Users,
  Award,
  BarChart3,
  Plus,
  Loader2
} from 'lucide-react';
import { PRICING } from '@/lib/pricing';
import type { ServiceType } from '@/types/booking';

export default function QuotePage() {
  const router = useRouter();
  const [service, setService] = useState<ServiceType | null>(null);
  const [bedrooms, setBedrooms] = useState(0);
  const [bathrooms, setBathrooms] = useState(1);
  const [extras, setExtras] = useState<string[]>([]);
  const [showContactForm, setShowContactForm] = useState(false);
  
  // Contact form fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const serviceOptions: { type: ServiceType; icon: any; label: string; subLabel: string; description: string; fillColor: string; iconColor: string }[] = [
    {
      type: 'Standard',
      icon: Home,
      label: 'Standard',
      subLabel: 'Cleaning',
      description: 'Regular home cleaning',
      fillColor: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      type: 'Deep',
      icon: Star,
      label: 'Deep',
      subLabel: 'Cleaning',
      description: 'Thorough deep cleaning services',
      fillColor: 'bg-teal-50',
      iconColor: 'text-teal-600',
    },
    {
      type: 'Move In/Out',
      icon: Building,
      label: 'Moving',
      subLabel: 'Cleaning',
      description: 'Moving transition cleaning',
      fillColor: 'bg-orange-50',
      iconColor: 'text-orange-500',
    },
    {
      type: 'Airbnb',
      icon: Calendar,
      label: 'Airbnb',
      subLabel: 'Cleaning',
      description: 'Airbnb turnover cleaning',
      fillColor: 'bg-teal-50',
      iconColor: 'text-teal-600',
    },
  ];

  const extraIconMap: { [key: string]: any } = {
    'Inside Fridge': Home,
    'Inside Oven': Star,
    'Inside Cabinets': Building,
    'Interior Windows': Users,
    'Interior Walls': Award,
    'Ironing': BarChart3,
    'Laundry': Plus,
  };

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
    setIsSubmitting(true);
    
    try {
      // Send quote confirmation request to backend
      const response = await fetch('/api/quote-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service,
          bedrooms,
          bathrooms,
          extras,
          firstName,
          lastName,
          email,
          phone,
        }),
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        console.error('HTTP error:', response.status, response.statusText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Try to parse JSON response
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error('Invalid response from server');
      }

      if (result.ok) {
        console.log('Quote confirmation sent successfully:', result);
        
        // Show success message even if email failed
        if (result.emailError) {
          if (result.emailError === 'Email service not configured') {
            console.log('Quote recorded successfully (email service not configured):', result.quoteId);
          } else {
            console.warn('Email sending failed but quote was recorded:', result.emailError);
          }
        }
        
        // Redirect to quote confirmation page after successful submission
        router.push('/booking/quote/confirmation');
      } else {
        console.error('Quote confirmation failed:', result.error);
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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {serviceOptions.map((option) => {
                    const Icon = option.icon;
                    const isSelected = service === option.type;
                    return (
                      <button
                        key={option.type}
                        onClick={() => setService(option.type)}
                        className={`flex flex-col items-center gap-5 rounded-xl border-2 p-8 text-center transition-all hover:shadow-md ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className={`relative rounded-full p-4 ${option.fillColor}`}>
                          <Icon className={`h-8 w-8 ${option.iconColor}`} strokeWidth={1.5} />
                          {option.type === 'Airbnb' && (
                            <div className="absolute -top-1 -right-1 flex gap-0.5">
                              <Sparkles className="h-2.5 w-2.5 text-gray-600" strokeWidth={1.5} />
                              <Sparkles className="h-2.5 w-2.5 text-gray-600" strokeWidth={1.5} />
                            </div>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <div className="font-medium text-gray-900 text-sm leading-tight">{option.label}</div>
                          <div className="font-medium text-gray-900 text-sm leading-tight">{option.subLabel}</div>
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
                  {/* Bedrooms & Bathrooms */}
                  <div className="grid gap-6 sm:grid-cols-2">
                    {/* Bedrooms */}
                    <div>
                      <Label className="mb-3 block text-sm font-medium">
                        Bedrooms
                      </Label>
                      <Select value={bedrooms.toString()} onValueChange={(value) => setBedrooms(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bedrooms" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0 Bedrooms</SelectItem>
                          <SelectItem value="1">1 Bedroom</SelectItem>
                          <SelectItem value="2">2 Bedrooms</SelectItem>
                          <SelectItem value="3">3 Bedrooms</SelectItem>
                          <SelectItem value="4">4 Bedrooms</SelectItem>
                          <SelectItem value="5">5+ Bedrooms</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Bathrooms */}
                    <div>
                      <Label className="mb-3 block text-sm font-medium">
                        Bathrooms
                      </Label>
                      <Select value={bathrooms.toString()} onValueChange={(value) => setBathrooms(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select bathrooms" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Bathroom</SelectItem>
                          <SelectItem value="2">2 Bathrooms</SelectItem>
                          <SelectItem value="3">3 Bathrooms</SelectItem>
                          <SelectItem value="4">4 Bathrooms</SelectItem>
                          <SelectItem value="5">5+ Bathrooms</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Extras */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900">3. Additional Services (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
                  {Object.entries(PRICING.extras).map(([extra, price]) => {
                    const Icon = extraIconMap[extra];
                    const isSelected = extras.includes(extra);
                    const labelWords = extra.split(' ');
                    
                    return (
                      <button
                        key={extra}
                        onClick={() => toggleExtra(extra)}
                        className="flex flex-col items-center gap-4 group cursor-pointer"
                      >
                        <div className={`relative w-24 h-24 rounded-full border bg-white flex items-center justify-center transition-all ${
                          isSelected 
                            ? 'border-primary bg-primary/5' 
                            : 'border-blue-600 hover:border-blue-700'
                        }`}>
                          <Icon 
                            className={`h-10 w-10 transition-colors ${
                              isSelected 
                                ? 'text-primary' 
                                : 'text-blue-600 group-hover:text-blue-700'
                            }`} 
                            strokeWidth={1.5}
                          />
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                              <div className="w-3 h-3 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                        <div className="text-center">
                          {labelWords.map((word, index) => (
                            <div key={index} className="text-sm font-medium text-gray-900 leading-tight">
                              {word}
                            </div>
                          ))}
                        </div>
                      </button>
                    );
                  })}
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
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending Quote...
                        </>
                      ) : (
                        <>
                          Confirm Quote & Continue to Booking
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
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
                    <div className="rounded-lg bg-blue-50 p-4 text-center">
                      <p className="text-sm font-medium text-blue-800">
                        ✓ Fill in your contact details below to receive your quote
                      </p>
                    </div>
                  )}

                  {/* Alternative CTA */}
                  <Link href="/booking/service/select" className="block">
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

