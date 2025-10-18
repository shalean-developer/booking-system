'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, UserX, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBooking } from '@/lib/useBooking';
import { CleanerCard } from '@/components/cleaner-card';
import { cn } from '@/lib/utils';
import type { Cleaner, AvailableCleanersResponse, ServiceType } from '@/types/booking';

// Helper function to convert ServiceType to URL slug
function serviceTypeToSlug(serviceType: ServiceType): string {
  if (serviceType === 'Move In/Out') {
    return 'move-in-out';
  }
  
  return serviceType
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function StepSelectCleaner() {
  const { state, updateField } = useBooking();
  const router = useRouter();
  const [cleaners, setCleaners] = useState<Cleaner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCleanerId, setSelectedCleanerId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available cleaners
  useEffect(() => {
    const fetchCleaners = async () => {
      if (!state.date || !state.address.city) {
        setError('Date and address information is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const params = new URLSearchParams({
          date: state.date,
          city: state.address.city,
        });

        const response = await fetch(`/api/cleaners/available?${params}`);
        const data: AvailableCleanersResponse = await response.json();

        if (data.ok) {
          setCleaners(data.cleaners);
        } else {
          setError(data.error || 'Failed to fetch cleaners');
        }
      } catch (err) {
        console.error('Error fetching cleaners:', err);
        setError('Failed to load available cleaners');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCleaners();
  }, [state.date, state.address.city]);

  const handleSelectCleaner = async (cleanerId: string) => {
    try {
      setIsSubmitting(true);
      setSelectedCleanerId(cleanerId);
      
      // Update booking state
      updateField('cleaner_id', cleanerId);
      updateField('step', 6);

      // Navigate to review step
      const slug = serviceTypeToSlug(state.service!);
      router.push(`/booking/service/${slug}/review`);
    } catch (err) {
      console.error('Error selecting cleaner:', err);
      setError('Failed to select cleaner');
      setSelectedCleanerId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    const slug = serviceTypeToSlug(state.service!);
    router.push(`/booking/service/${slug}/contact`);
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100"
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Select Your Cleaner
          </h2>
          <p className="text-sm md:text-base text-gray-600">
            Finding available cleaners in {state.address.city} for {state.date}
          </p>
        </div>

        {/* Loading Skeletons */}
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-slate-200 h-64 rounded-2xl"></div>
            </div>
          ))}
        </div>

        {/* Loading Message */}
        <div className="flex items-center justify-center gap-3 py-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="text-sm font-medium text-slate-600">Loading available cleaners...</span>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100"
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Select Your Cleaner
          </h2>
          <p className="text-sm md:text-base text-gray-600">
            Available cleaners in {state.address.city} for {state.date}
          </p>
        </div>

        {/* Error State */}
        <div className="text-center py-12 px-4">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Cleaners</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">{error}</p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={() => window.location.reload()} 
              className={cn(
                "rounded-full px-6 font-semibold",
                "bg-primary hover:bg-primary/90 text-white",
                "focus:ring-2 focus:ring-primary/30 focus:outline-none"
              )}
            >
              Try Again
            </Button>
            <Button 
              onClick={handleBack}
              variant="outline"
              className={cn(
                "rounded-full px-6 font-semibold",
                "focus:ring-2 focus:ring-primary/30 focus:outline-none"
              )}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Contact
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  const handleManualAssignment = async () => {
    try {
      setIsSubmitting(true);
      
      // Set special 'manual' identifier for cleaner_id
      updateField('cleaner_id', 'manual');
      updateField('step', 6);

      // Navigate to review step
      const slug = serviceTypeToSlug(state.service!);
      router.push(`/booking/service/${slug}/review`);
    } catch (err) {
      console.error('Error proceeding with manual assignment:', err);
      setError('Failed to proceed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (cleaners.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100"
      >
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Let Us Choose for You
          </h2>
          <p className="text-sm md:text-base text-gray-600">
            Available cleaners in {state.address.city} for {state.date}
          </p>
        </div>

        {/* No Cleaners State */}
        <div className="text-center py-12 px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="max-w-md mx-auto"
          >
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <UserX className="w-10 h-10 text-primary" />
            </div>
            
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              No Available Cleaners in Our System
            </h3>
            
            <p className="text-gray-600 mb-8 leading-relaxed">
              We don't have cleaners available in our system for your selected date and area. 
              Don't worry! Our team will manually assign the best cleaner for you and confirm your booking.
            </p>

            <div className="space-y-3">
              <Button 
                onClick={handleManualAssignment}
                disabled={isSubmitting}
                size="lg"
                className={cn(
                  "w-full rounded-full px-8 py-3 font-semibold shadow-lg",
                  "bg-primary hover:bg-primary/90 text-white",
                  "focus:ring-2 focus:ring-primary/30 focus:outline-none",
                  "transition-all duration-200",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Choose for Me'
                )}
              </Button>
              
              <Button 
                onClick={handleBack} 
                variant="outline"
                size="lg"
                disabled={isSubmitting}
                className={cn(
                  "w-full rounded-full px-6 font-semibold",
                  "focus:ring-2 focus:ring-primary/30 focus:outline-none",
                  "transition-all duration-200"
                )}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Contact
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-6">
              Our team will contact you within 24 hours to confirm your cleaner assignment
            </p>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border border-gray-100"
    >
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
          Select Your Cleaner
        </h2>
        <p className="text-sm md:text-base text-gray-600">
          Choose from {cleaners.length} available cleaner{cleaners.length !== 1 ? 's' : ''} in {state.address.city} for {state.date}
        </p>
      </div>

      {/* Cleaners Grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8"
      >
        {cleaners.map((cleaner, index) => (
          <motion.div
            key={cleaner.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <CleanerCard
              cleaner={cleaner}
              onSelect={handleSelectCleaner}
              isSelected={selectedCleanerId === cleaner.id}
              isLoading={isSubmitting && selectedCleanerId === cleaner.id}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Navigation */}
      <div className="flex justify-between items-center gap-3 pt-6 border-t">
        <Button
          variant="outline"
          onClick={handleBack}
          disabled={isSubmitting}
          className={cn(
            "rounded-full px-6 font-semibold",
            "focus:ring-2 focus:ring-primary/30 focus:outline-none",
            "transition-all duration-200"
          )}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Back to Contact</span>
          <span className="sm:hidden">Back</span>
        </Button>
        
        {selectedCleanerId && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-green-600"
          >
            <div className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></div>
            <span className="text-sm font-medium">Cleaner selected! Proceeding...</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
