'use client';

import { memo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Sparkles, AlertTriangle, Loader2, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ServiceRequestPanelProps {
  onBookService?: () => void;
  onEmergencyRequest?: () => void;
}

interface QuickService {
  id: string;
  name: string;
  fullName: string;
  icon: string;
  type: 'service' | 'extra';
  href: string;
}

export const ServiceRequestPanel = memo(function ServiceRequestPanel({ onBookService, onEmergencyRequest }: ServiceRequestPanelProps) {
  const [allServices, setAllServices] = useState<QuickService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get Standard and Deep as quick buttons
  const quickServices = allServices.filter(s => s.id === 'Standard' || s.id === 'Deep');
  
  // Get remaining services for dropdown (Move In/Out, Airbnb, Carpet)
  const dropdownServices = allServices.filter(s => 
    s.id === 'Move In/Out' || s.id === 'Airbnb' || s.id === 'Carpet'
  );

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/dashboard/services');

        const data = await response.json();
        if (data.ok && data.services && data.services.length > 0) {
          setAllServices(data.services);
        } else {
          // Fallback to default services (all 5 services)
          setAllServices([
            { id: 'Standard', name: 'Standard', fullName: 'Standard Cleaning', icon: '✨', type: 'service', href: '/booking/service/standard/details' },
            { id: 'Deep', name: 'Deep Clean', fullName: 'Deep Cleaning', icon: '✨', type: 'service', href: '/booking/service/deep/details' },
            { id: 'Move In/Out', name: 'Move In/Out', fullName: 'Move In/Out Cleaning', icon: '✨', type: 'service', href: '/booking/service/move-in-out/details' },
            { id: 'Airbnb', name: 'Airbnb', fullName: 'Airbnb Cleaning', icon: '✨', type: 'service', href: '/booking/service/airbnb/details' },
            { id: 'Carpet', name: 'Carpet', fullName: 'Carpet Cleaning', icon: '✨', type: 'service', href: '/booking/service/carpet/details' },
          ]);
        }
      } catch (error) {
        console.error('Error fetching services:', error);
        // Fallback to default services (all 5 services)
        setAllServices([
          { id: 'Standard', name: 'Standard', fullName: 'Standard Cleaning', icon: '✨', type: 'service', href: '/booking/service/standard/details' },
          { id: 'Deep', name: 'Deep Clean', fullName: 'Deep Cleaning', icon: '✨', type: 'service', href: '/booking/service/deep/details' },
          { id: 'Move In/Out', name: 'Move In/Out', fullName: 'Move In/Out Cleaning', icon: '✨', type: 'service', href: '/booking/service/move-in-out/details' },
          { id: 'Airbnb', name: 'Airbnb', fullName: 'Airbnb Cleaning', icon: '✨', type: 'service', href: '/booking/service/airbnb/details' },
          { id: 'Carpet', name: 'Carpet', fullName: 'Carpet Cleaning', icon: '✨', type: 'service', href: '/booking/service/carpet/details' },
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleBookService = () => {
    if (onBookService) {
      onBookService();
    }
  };

  const handleEmergency = () => {
    if (onEmergencyRequest) {
      onEmergencyRequest();
    } else {
      window.location.href = '/contact?type=emergency';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="min-w-0 w-full"
    >
      <Card className="bg-gradient-to-br from-white via-teal-50/50 to-blue-50/50 border border-teal-200 lg:border-2 transition-all duration-300 overflow-hidden">
      <CardHeader className="pb-2 px-3 pt-3">
        <CardTitle className="flex items-center gap-1.5 text-teal-900 text-sm sm:text-base lg:text-lg font-semibold">
          <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
          <span className="truncate">Service Requests</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5 px-3 pb-3 min-w-0">
        {/* Book New Cleaning */}
        <Button
          className="w-full bg-gradient-to-r from-teal-500 to-blue-500 active:from-teal-600 active:to-blue-600 text-white font-semibold h-10 sm:h-11 text-xs sm:text-sm lg:text-base touch-manipulation shadow-sm"
          onClick={handleBookService}
          asChild
        >
          <Link href="/booking/service/select" className="flex items-center justify-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
            <span>Book a New Cleaning</span>
          </Link>
        </Button>

        {/* Quick Services - Standard, Deep, and More dropdown */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-1.5 min-w-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col items-center justify-center gap-0.5 h-[68px] border border-teal-200 rounded-lg bg-white min-w-0">
                <Loader2 className="h-3.5 w-3.5 text-teal-600 animate-spin flex-shrink-0" />
                <span className="text-[8px] text-gray-400 truncate">Loading...</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5 min-w-0">
            {/* Standard Button */}
            {quickServices.find(s => s.id === 'Standard') && (
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-0.5 h-[68px] min-h-[68px] py-1.5 px-1 border-teal-200 active:bg-teal-50 bg-white touch-manipulation rounded-lg min-w-0"
                asChild
              >
                <Link href={quickServices.find(s => s.id === 'Standard')!.href} className="flex flex-col items-center justify-center w-full h-full min-w-0">
                  <Sparkles className="h-3.5 w-3.5 text-teal-600 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs lg:text-sm font-medium leading-tight text-center truncate w-full">Standard</span>
                </Link>
              </Button>
            )}
            
            {/* Deep Button */}
            {quickServices.find(s => s.id === 'Deep') && (
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-0.5 h-[68px] min-h-[68px] py-1.5 px-1 border-teal-200 active:bg-teal-50 bg-white touch-manipulation rounded-lg min-w-0"
                asChild
              >
                <Link href={quickServices.find(s => s.id === 'Deep')!.href} className="flex flex-col items-center justify-center w-full h-full min-w-0">
                  <Sparkles className="h-3.5 w-3.5 text-teal-600 flex-shrink-0" />
                  <span className="text-[10px] sm:text-xs lg:text-sm font-medium leading-tight text-center truncate w-full">Deep</span>
                </Link>
              </Button>
            )}

            {/* More Dropdown */}
            {dropdownServices.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex flex-col items-center justify-center gap-0.5 h-[68px] min-h-[68px] py-1.5 px-1 border-teal-200 active:bg-teal-50 bg-white w-full touch-manipulation rounded-lg min-w-0"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-teal-600 flex-shrink-0" />
                    <span className="text-[10px] sm:text-xs lg:text-sm font-medium leading-tight flex items-center justify-center gap-0.5 text-center truncate w-full">
                      More
                      <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={4} className="w-[calc(100vw-1.5rem)] max-w-[260px] p-1">
                  {dropdownServices.map((service) => (
                    <DropdownMenuItem key={service.id} asChild className="py-2.5 px-3 rounded-md">
                      <Link href={service.href} className="flex items-center gap-2 cursor-pointer w-full text-xs font-medium touch-manipulation">
                        <span>{service.name}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Fallback if services not loaded */}
            {quickServices.length === 0 && dropdownServices.length === 0 && (
              <>
                <Button
                  variant="outline"
                  className="flex flex-col items-center justify-center gap-0.5 h-[68px] min-h-[68px] py-1.5 px-1 border-teal-200 active:bg-teal-50 bg-white touch-manipulation rounded-lg min-w-0"
                  asChild
                >
                  <Link href="/booking/service/standard/details" className="flex flex-col items-center justify-center w-full h-full min-w-0">
                    <Sparkles className="h-3.5 w-3.5 text-teal-600 flex-shrink-0" />
                    <span className="text-[10px] sm:text-xs lg:text-sm font-medium leading-tight text-center truncate w-full">Standard</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center justify-center gap-0.5 h-[68px] min-h-[68px] py-1.5 px-1 border-teal-200 active:bg-teal-50 bg-white touch-manipulation rounded-lg min-w-0"
                  asChild
                >
                  <Link href="/booking/service/deep/details" className="flex flex-col items-center justify-center w-full h-full min-w-0">
                    <Sparkles className="h-3.5 w-3.5 text-teal-600 flex-shrink-0" />
                    <span className="text-[10px] sm:text-xs lg:text-sm font-medium leading-tight text-center truncate w-full">Deep</span>
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex flex-col items-center justify-center gap-0.5 h-[68px] min-h-[68px] py-1.5 px-1 border-teal-200 active:bg-teal-50 bg-white w-full touch-manipulation rounded-lg min-w-0"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-teal-600 flex-shrink-0" />
                      <span className="text-[10px] sm:text-xs lg:text-sm font-medium leading-tight flex items-center justify-center gap-0.5 text-center truncate w-full">
                        More
                        <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" sideOffset={4} className="w-[calc(100vw-2rem)] max-w-[280px] p-1.5">
                    <DropdownMenuItem asChild className="py-3 px-3 rounded-md">
                      <Link href="/booking/service/move-in-out/details" className="flex items-center gap-2 cursor-pointer w-full text-sm font-medium touch-manipulation">
                        <span>Move In/Out</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="py-3 px-3 rounded-md">
                      <Link href="/booking/service/airbnb/details" className="flex items-center gap-2 cursor-pointer w-full text-sm font-medium touch-manipulation">
                        <span>Airbnb</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="py-3 px-3 rounded-md">
                      <Link href="/booking/service/carpet/details" className="flex items-center gap-2 cursor-pointer w-full text-sm font-medium touch-manipulation">
                        <span>Carpet</span>
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
          </div>
        )}

        {/* Emergency Cleaning */}
        <Button
          variant="outline"
          className="w-full h-9 sm:h-10 border-red-300 text-red-600 active:bg-red-50 active:border-red-400 text-xs sm:text-sm font-medium touch-manipulation shadow-sm"
          onClick={handleEmergency}
        >
          <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 flex-shrink-0" />
          <span>Request Emergency Cleaning</span>
        </Button>
      </CardContent>
    </Card>
    </motion.div>
  );
});
