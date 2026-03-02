'use client';

import { useMemo } from 'react';
import { serviceTypeToSlug, getStepName } from './booking-utils';

/**
 * Centralized booking URLs.
 *
 * Uses canonical 4-segment form: `/booking/service/[slug]/[step]`
 */
export function useBookingPath() {
  const isOldBookingPath = false;
  const prefix = '/booking/service';

  const getSelectPath = useMemo(() => {
    return '/booking/service/standard/plan';
  }, []);

  const getDetailsPath = useMemo(() => {
    return (serviceType: string) => {
      const slug = serviceTypeToSlug(serviceType as any);
      return `${prefix}/${slug}/plan`;
    };
  }, []);

  const getSchedulePath = useMemo(() => {
    return (serviceType: string) => {
      const slug = serviceTypeToSlug(serviceType as any);
      return `${prefix}/${slug}/schedule`;
    };
  }, []);

  const getContactPath = useMemo(() => {
    return (serviceType: string) => {
      const slug = serviceTypeToSlug(serviceType as any);
      return `${prefix}/${slug}/contact`;
    };
  }, []);

  const getCleanerPath = useMemo(() => {
    return (serviceType: string) => {
      const slug = serviceTypeToSlug(serviceType as any);
      return `${prefix}/${slug}/cleaner`;
    };
  }, []);

  const getReviewPath = useMemo(() => {
    return (serviceType: string) => {
      const slug = serviceTypeToSlug(serviceType as any);
      return `${prefix}/${slug}/review`;
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
      return `${prefix}/${slug}/${stepName}`;
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

