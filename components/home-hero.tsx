'use client';

import { useState, useEffect } from 'react';
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Smile, Home, Star, Building, Calendar, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface Service {
  serviceType: string;
  category: string;
  avgPrice: string;
  basePrice: number;
  icon: string;
  image: string;
  order: number;
  description?: string;
}

export function HomeHero() {
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    async function fetchServices() {
      try {
        setLoadingServices(true);
        const response = await fetch('/api/services/popular', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setServices(data.services || []);
        }
      } catch (err) {
        console.error('Error fetching services:', err);
      } finally {
        setLoadingServices(false);
      }
    }

    fetchServices();
  }, []);

  return (
    <section className="relative min-h-[500px] sm:min-h-[600px] flex items-center justify-center bg-gray-100">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero-background.jpg"
          alt="Professional cleaning services Cape Town - Shalean Cleaning Services"
          fill
          className="object-cover"
          priority
          sizes="100vw"
          onError={(e) => {
            // Fallback to Unsplash if local image fails
            e.currentTarget.src = "https://images.unsplash.com/photo-1497366216548-37526070297c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80";
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/40 to-gray-900/20" />
      </div>

      {/* White Overlay Box */}
      <motion.div 
        className="relative z-10 mx-auto my-12 sm:my-20 px-4 sm:px-6 lg:px-8"
        style={{ 
          width: 'clamp(320px, calc(100% - 32px), 700px)'
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 md:p-8 lg:p-10 w-full">
          <div className="w-full mx-auto">
            {/* Headline */}
            <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-3 sm:mb-4 text-center leading-tight">
              <span className="block">Professional Cleaning Services</span>
              <span className="block">in Cape Town</span>
            </h1>

            {/* Descriptive Paragraph */}
            <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-4 sm:mb-6 text-center leading-relaxed">
              <span className="block">Cape Town's most trusted cleaning service. Book vetted cleaners</span>
              <span className="block">for your home, office, or Airbnb. Standard, deep, move in/out,</span>
              <span className="block">and specialized cleaning services. Same-day available.</span>
            </p>

            {/* Trust Signals */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-6 text-xs sm:text-sm text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="text-primary font-semibold">500+</span>
                <span>Happy Customers</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5">
                <span className="text-primary font-semibold">50+</span>
                <span>Expert Cleaners</span>
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5">
                <span className="text-primary font-semibold">Same-Day</span>
                <span>Available</span>
              </span>
            </div>

            {/* Search Bar and Button */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6 w-full">
              <div 
                className="relative w-full sm:flex-1 sm:max-w-none"
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => {
                  if (!inputValue) {
                    setIsDropdownOpen(false);
                  }
                }}
              >
                <Smile className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
                <Input
                  type="text"
                  placeholder="What cleaning service do you need?"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onBlur={() => {
                    // Delay closing to allow clicking on dropdown items
                    setTimeout(() => {
                      if (!inputValue) {
                        setIsDropdownOpen(false);
                      }
                    }, 200);
                  }}
                  className="w-full h-11 sm:h-12 pl-10 pr-4 text-sm sm:text-base border border-gray-300 rounded-lg focus:border-primary focus:ring-1 focus:ring-primary bg-white placeholder:text-gray-400"
                />
                
                {/* Services Dropdown */}
                {isDropdownOpen && services.length > 0 && (
                  <div 
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
                    onMouseEnter={() => setIsDropdownOpen(true)}
                    onMouseLeave={() => setIsDropdownOpen(false)}
                  >
                    <div className="p-4 border-b border-gray-200 bg-gray-50">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Popular Services</p>
                      <div className="grid grid-cols-2 gap-2">
                        <span className="text-xs font-medium text-gray-700">Service</span>
                        <span className="text-xs font-medium text-gray-700 text-right">From</span>
                      </div>
                    </div>
                    <div className="py-2">
                      {services.map((service) => {
                        // Map service types to Lucide icons
                        const getServiceIcon = (serviceType: string) => {
                          switch (serviceType) {
                            case 'Standard':
                              return <Home className="h-5 w-5 text-primary" />;
                            case 'Deep':
                              return <Star className="h-5 w-5 text-primary" />;
                            case 'Move In/Out':
                              return <Building className="h-5 w-5 text-primary" />;
                            case 'Airbnb':
                              return <Calendar className="h-5 w-5 text-primary" />;
                            case 'Carpet':
                              return <Sparkles className="h-5 w-5 text-primary" />;
                            default:
                              return <Home className="h-5 w-5 text-primary" />;
                          }
                        };

                        // Get description with fallback
                        const getServiceDescription = (serviceType: string, description?: string) => {
                          if (description && description.trim()) {
                            return description;
                          }
                          // Fallback descriptions
                          switch (serviceType) {
                            case 'Standard':
                              return 'Regular home cleaning to keep your space fresh and organized';
                            case 'Deep':
                              return 'Thorough, intensive cleaning that tackles every corner and surface';
                            case 'Move In/Out':
                              return 'Complete cleaning for property transitions';
                            case 'Airbnb':
                              return 'Professional turnover cleaning for short-term rentals';
                            case 'Carpet':
                              return 'Professional deep cleaning for carpets and rugs';
                            default:
                              return 'Professional cleaning service';
                          }
                        };

                        const serviceDescription = getServiceDescription(service.serviceType, service.description);

                        return (
                          <Link
                            key={service.serviceType}
                            href={`/booking/service/select?service=${service.serviceType}`}
                            className="block px-4 py-3 hover:bg-primary/5 transition-colors border-b border-gray-100 last:border-b-0 group"
                            onClick={() => {
                              setInputValue(service.category);
                              setIsDropdownOpen(false);
                            }}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex items-start gap-3 flex-1 min-w-0">
                                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors flex-shrink-0 mt-0.5">
                                  {getServiceIcon(service.serviceType)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors block mb-1">{service.category}</span>
                                  <span className="text-xs text-gray-500 line-clamp-2 block leading-relaxed">{serviceDescription}</span>
                                </div>
                              </div>
                              <span className="text-sm font-semibold text-primary flex-shrink-0 whitespace-nowrap">{service.avgPrice}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <Button
                className="bg-primary hover:bg-primary/90 text-white h-11 sm:h-12 px-4 md:px-6 whitespace-nowrap rounded-lg text-sm sm:text-base font-semibold shadow-sm w-full sm:w-auto flex-shrink-0"
                asChild
              >
                <Link href="/booking/service/select">Book a service</Link>
              </Button>
            </div>

            {/* Service Name Buttons - Replacing category buttons */}
            {!loadingServices && services.length > 0 && (
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-start">
                {services.map((service) => {
                  // Remove "Cleaning" from the service name for display
                  const displayName = service.category.replace(/\s+Cleaning$/i, '');
                  return (
                    <button
                      key={service.serviceType}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 border border-primary/30 bg-white text-primary rounded-lg hover:bg-primary/5 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
                    >
                      {displayName}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Loading state for service buttons */}
            {loadingServices && (
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-start">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 border border-primary/30 bg-white rounded-lg animate-pulse"
                  >
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
