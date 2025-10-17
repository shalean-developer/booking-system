'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBooking } from '@/lib/useBooking';
import { CleanerCard } from '@/components/cleaner-card';
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
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Select Your Cleaner</CardTitle>
          <p className="text-slate-600">
            Finding available cleaners in {state.address.city} for {state.date}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-slate-200 h-64 rounded-lg"></div>
              </div>
            ))}
          </div>
          <div className="flex justify-center mt-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-slate-600">Loading available cleaners...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Select Your Cleaner</CardTitle>
          <p className="text-slate-600">
            Available cleaners in {state.address.city} for {state.date}
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">
              <UserX className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Unable to Load Cleaners</h3>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
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
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Let Us Choose for You</CardTitle>
          <p className="text-slate-600">
            Available cleaners in {state.address.city} for {state.date}
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-md mx-auto"
            >
              <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserX className="w-10 h-10 text-primary" />
              </div>
              
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                No Available Cleaners in Our System
              </h3>
              
              <p className="text-slate-600 mb-8 leading-relaxed">
                We don't have cleaners available in our system for your selected date and area. 
                Don't worry! Our team will manually assign the best cleaner for you and confirm your booking.
              </p>

              <div className="space-y-3">
                <Button 
                  onClick={handleManualAssignment}
                  disabled={isSubmitting}
                  size="lg"
                  className="w-full"
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
                  className="w-full"
                  disabled={isSubmitting}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Contact
                </Button>
              </div>

              <p className="text-xs text-slate-500 mt-6">
                Our team will contact you within 24 hours to confirm your cleaner assignment
              </p>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Select Your Cleaner</CardTitle>
        <p className="text-slate-600">
          Choose from {cleaners.length} available cleaner{cleaners.length !== 1 ? 's' : ''} in {state.address.city} for {state.date}
        </p>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
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

        <div className="flex justify-between gap-3 pt-6">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isSubmitting}
              className="transition-all duration-150"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Contact
            </Button>
          
          {selectedCleanerId && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center text-green-600"
            >
              <span className="text-sm font-medium">Cleaner selected! Proceeding...</span>
            </motion.div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
