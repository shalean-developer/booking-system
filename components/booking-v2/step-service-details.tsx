'use client';

import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { ServiceType } from '@/types/booking';
import { useBookingV2 } from '@/lib/useBookingV2';
import { useBookingPath } from '@/lib/useBookingPath';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { serviceTypeToSlug } from '@/lib/booking-utils';
import { format, startOfToday } from 'date-fns';
import { SuburbModal } from '@/components/booking-v2/suburb-modal';
import { ServiceSelector } from './service-selector';
import { HouseDetailsForm } from './house-details-form';
import { ExtrasSelector } from './extras-selector';
import { ScheduleSelector } from './schedule-selector';
import { CarpetDetailsForm } from './carpet-details-form';
import { EquipmentOption } from './equipment-option';
import { useExtrasLogic } from './useExtrasLogic';
import { useBookingFormData } from '@/lib/useBookingFormData';
import { fallbackServices, fallbackAllExtrasList, fallbackStandardAndAirbnbExtras, fallbackDeepAndMoveExtras } from './booking-constants';
import type { CarpetDetails } from '@/lib/useBookingV2';

export function StepServiceDetails() {
  const router = useRouter();
  const { state, updateField } = useBookingV2();
  const { getDetailsPath, getSchedulePath } = useBookingPath();
  const [isSuburbModalOpen, setIsSuburbModalOpen] = useState(false);
  
  // Fetch dynamic booking form data
  const { data: formData, loading: formDataLoading } = useBookingFormData();
  
  // Use dynamic data or fallback to constants
  const services = formData?.services || fallbackServices;
  const allExtrasList = formData?.extras.all || fallbackAllExtrasList;
  const standardAndAirbnbExtras = formData?.extras.standardAndAirbnb || fallbackStandardAndAirbnbExtras;
  const deepAndMoveExtras = formData?.extras.deepAndMove || fallbackDeepAndMoveExtras;
  const quantityExtras = formData?.extras.quantityExtras;

  const { allowedExtras, toggleExtra, adjustQuantity } = useExtrasLogic({
    service: state.service,
    extras: state.extras,
    extrasQuantities: state.extrasQuantities,
    updateField,
    allExtrasList,
    standardAndAirbnbExtras,
    deepAndMoveExtras,
    quantityExtras,
  });

  const handleServiceSelect = useCallback((serviceType: ServiceType) => {
    updateField('service', serviceType);
    const slug = serviceTypeToSlug(serviceType);
    const detailsPath = getDetailsPath(serviceType);
    router.push(detailsPath);
  }, [updateField, router, getDetailsPath]);

  const handleNext = useCallback(() => {
    if (!state.service || state.bathrooms < 1 || !state.date || !state.time) return;
    // Open suburb modal instead of navigating directly
    setIsSuburbModalOpen(true);
  }, [state.service, state.bathrooms, state.date, state.time]);

  const handleSuburbSubmit = useCallback((suburb: string) => {
    // Update suburb in state
    updateField('address', {
      ...state.address,
      suburb: suburb,
    });
    // Close modal
    setIsSuburbModalOpen(false);
    // Navigate to schedule page
    if (state.service) {
      router.push(getSchedulePath(state.service));
    }
  }, [state.address, state.service, updateField, router, getSchedulePath]);

  const handleBedroomChange = useCallback((value: string) => {
    updateField('bedrooms', parseInt(value));
  }, [updateField]);

  const handleBathroomChange = useCallback((value: string) => {
    updateField('bathrooms', parseInt(value));
  }, [updateField]);

  const handleDateChange = useCallback((value: string) => {
    updateField('date', value);
    // Clear time if date changes to today and current time is in the past
    if (value === format(startOfToday(), 'yyyy-MM-dd') && state.time) {
      const now = new Date();
      const [hours, minutes] = state.time.split(':').map(Number);
      const selectedTime = new Date();
      selectedTime.setHours(hours, minutes, 0, 0);
      if (selectedTime < now) {
        updateField('time', '');
      }
    }
  }, [updateField, state.time]);

  const handleTimeChange = useCallback((value: string) => {
    updateField('time', value);
  }, [updateField]);

  // Initialize carpet details when Carpet service is selected
  const handleCarpetDetailsChange = useCallback((details: CarpetDetails) => {
    updateField('carpetDetails', details);
  }, [updateField]);

  // Handle equipment option change
  const handleProvideEquipmentChange = useCallback((value: boolean) => {
    updateField('provideEquipment', value);
  }, [updateField]);

  // Reset provideEquipment when service changes away from Standard/Airbnb
  useEffect(() => {
    if (state.service && state.service !== 'Standard' && state.service !== 'Airbnb' && state.provideEquipment) {
      updateField('provideEquipment', false);
    }
  }, [state.service, state.provideEquipment, updateField]);

  // Initialize or reset carpet details based on service type
  useEffect(() => {
    if (state.service === 'Carpet' && !state.carpetDetails) {
      updateField('carpetDetails', {
        hasFittedCarpets: false,
        hasLooseCarpets: false,
        numberOfRooms: 0,
        numberOfLooseCarpets: 0,
        roomStatus: 'empty',
      });
    } else if (state.service !== 'Carpet' && state.carpetDetails) {
      updateField('carpetDetails', null);
    }
  }, [state.service, state.carpetDetails, updateField]);

  // Validation for carpet service
  const isCarpetService = state.service === 'Carpet';
  const hasCarpetDetails = state.carpetDetails && (
    state.carpetDetails.hasFittedCarpets || state.carpetDetails.hasLooseCarpets
  );
  const carpetDetailsValid = !isCarpetService || (isCarpetService && hasCarpetDetails);

  const isValid = state.service !== null && 
    state.bathrooms >= 1 && 
    !!state.date && 
    !!state.time &&
    carpetDetailsValid;
  const validationMessage = 
    !state.service
      ? 'Please select a service type'
      : isCarpetService && !hasCarpetDetails
      ? 'Please select at least one carpet type (Fitted or Loose)'
      : !isCarpetService && state.bathrooms < 1 
      ? 'Please select at least 1 bathroom'
      : !state.date
      ? 'Please select a date'
      : !state.time
      ? 'Please select a time'
      : '';

  return (
    <div className="space-y-8 w-full md:max-w-[586px] md:mx-auto">
      <ServiceSelector
        selectedService={state.service}
        onSelect={handleServiceSelect}
        services={services}
        loading={formDataLoading}
      />

      {/* Details Form Section - Only show when service is selected */}
      {state.service && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="bg-white rounded-2xl shadow-md p-4 md:p-6 border border-slate-100 mx-0 md:mx-0"
        >
          <div className="space-y-10">
            {state.service === 'Carpet' ? (
              state.carpetDetails && (
                <CarpetDetailsForm
                  carpetDetails={state.carpetDetails}
                  onCarpetDetailsChange={handleCarpetDetailsChange}
                />
              )
            ) : (
              <HouseDetailsForm
                bedrooms={state.bedrooms}
                bathrooms={state.bathrooms}
                onBedroomChange={handleBedroomChange}
                onBathroomChange={handleBathroomChange}
              />
            )}

            <ExtrasSelector
              allowedExtras={allowedExtras}
              selectedExtras={state.extras}
              extrasQuantities={state.extrasQuantities}
              onToggleExtra={toggleExtra}
              onAdjustQuantity={adjustQuantity}
              extrasMeta={formData?.extras.meta}
              extrasPrices={formData?.extras.prices}
              loading={formDataLoading}
            />

            {/* Equipment Option - Only for Standard and Airbnb services */}
            {(state.service === 'Standard' || state.service === 'Airbnb') && (
              <EquipmentOption
                provideEquipment={state.provideEquipment}
                onProvideEquipmentChange={handleProvideEquipmentChange}
                equipmentItems={formData?.equipment?.items || []}
                equipmentCharge={formData?.equipment?.charge || 500}
              />
            )}

            <ScheduleSelector
              date={state.date}
              time={state.time}
              onDateChange={handleDateChange}
              onTimeChange={handleTimeChange}
            />

            <section className="space-y-3" aria-labelledby="special-instructions">
              <h3 id="special-instructions" className="text-base font-semibold text-gray-900">
                Special Instructions
              </h3>
              <Textarea
                id="notes"
                placeholder="Add your notes here......"
                value={state.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                rows={4}
                className="resize-none focus:ring-2 focus:ring-primary/30 bg-blue-50/50"
              />
            </section>
          </div>

          <div className="mt-8 space-y-4 border-t pt-6">
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
              <Button 
                onClick={handleNext} 
                size="lg" 
                disabled={!isValid}
                className={cn(
                  "rounded-full px-8 py-3 font-semibold shadow-lg w-full sm:w-auto justify-center",
                  isValid ? "bg-primary hover:bg-primary/90 text-white" : "bg-gray-300 text-gray-500 cursor-not-allowed",
                  "focus:ring-2 focus:ring-primary/30 focus:outline-none",
                  "transition-all duration-200"
                )}
                type="button"
              >
                Continue
              </Button>
            </div>
          </div>

          {!isValid && validationMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm"
            >
              {validationMessage}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Suburb Modal */}
      <SuburbModal
        open={isSuburbModalOpen}
        onClose={() => setIsSuburbModalOpen(false)}
        onSubmit={handleSuburbSubmit}
        currentSuburb={state.address.suburb}
      />
    </div>
  );
}

