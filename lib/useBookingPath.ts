'use client';

import { useMemo } from 'react';
import { serviceTypeToSlug, getStepName } from './booking-utils';

/**
 * Centralized booking URLs.
 *
 * All booking steps include the step slug in the URL: `/booking/[slug]/[step]`
 */
export function useBookingPath() {
  const isOldBookingPath = false;

  const getSelectPath = useMemo(() => {
    // Redirect to new unified booking flow (details page has service selection built in)
    return '/booking/standard/details';
  }, []);

  const getDetailsPath = useMemo(() => {
    return (serviceType: string) => {
      const slug = serviceTypeToSlug(serviceType as any);
      return `/booking/${slug}/details`;
    };
  }, []);

  const getSchedulePath = useMemo(() => {
    return (serviceType: string) => {
      const slug = serviceTypeToSlug(serviceType as any);
      return `/booking/${slug}/schedule`;
    };
  }, []);

  const getContactPath = useMemo(() => {
    return (serviceType: string) => {
      const slug = serviceTypeToSlug(serviceType as any);
      return `/booking/${slug}/contact`;
    };
  }, []);

  const getCleanerPath = useMemo(() => {
    return (serviceType: string) => {
      const slug = serviceTypeToSlug(serviceType as any);
      return `/booking/${slug}/cleaner`;
    };
  }, []);

  const getReviewPath = useMemo(() => {
    return (serviceType: string) => {
      const slug = serviceTypeToSlug(serviceType as any);
      return `/booking/${slug}/review`;
    };
  }, []);

  const getConfirmationPath = useMemo(() => {
    return (ref?: string) => {
      const basePath = '/booking/confirmation';
      return ref ? `${basePath}?ref=${ref}` : basePath;
    };
  }, []);

  // Helper to generate path with step number
  const getPathWithStep = useMemo(() => {
    return (serviceType: string, stepNumber: number) => {
      const slug = serviceTypeToSlug(serviceType as any);
      const stepName = getStepName(stepNumber);
      return `/booking/${slug}/${stepName}`;
    };
  }, []);

  return {
    isOldBookingPath,
    getSelectPath,
    getDetailsPath,
    getSchedulePath,
    getContactPath,
    getCleanerPath,
    getReviewPath,
    getConfirmationPath,
    getPathWithStep,
  };
}

