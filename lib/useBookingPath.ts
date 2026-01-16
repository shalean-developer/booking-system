'use client';

import { useMemo } from 'react';
import { serviceTypeToSlug } from './booking-utils';

/**
 * Centralized booking URLs.
 *
 * We no longer generate `/booking-v2/*` links. All booking navigation uses
 * the canonical `/booking/service/*` routes.
 */
export function useBookingPath() {
  const isOldBookingPath = true;

  const getSelectPath = useMemo(() => {
    // Redirect to new unified booking flow (details page has service selection built in)
    return '/booking/service/standard/details';
  }, []);

  const getDetailsPath = useMemo(() => {
    return (serviceType: string) => {
      const slug = serviceTypeToSlug(serviceType as any);
      return `/booking/service/${slug}/details`;
    };
  }, []);

  const getSchedulePath = useMemo(() => {
    return (serviceType: string) => {
      const slug = serviceTypeToSlug(serviceType as any);
      return `/booking/service/${slug}/worker`;
    };
  }, []);

  const getContactPath = useMemo(() => {
    return (serviceType: string) => {
      const slug = serviceTypeToSlug(serviceType as any);
      return `/booking/service/${slug}/contact`;
    };
  }, []);

  const getCleanerPath = useMemo(() => {
    return (serviceType: string) => {
      const slug = serviceTypeToSlug(serviceType as any);
      return `/booking/service/${slug}/worker`;
    };
  }, []);

  const getReviewPath = useMemo(() => {
    return (serviceType: string) => {
      const slug = serviceTypeToSlug(serviceType as any);
      return `/booking/service/${slug}/review`;
    };
  }, []);

  const getConfirmationPath = useMemo(() => {
    return (ref?: string) => {
      const basePath = '/booking/confirmation';
      return ref ? `${basePath}?ref=${ref}` : basePath;
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
  };
}

