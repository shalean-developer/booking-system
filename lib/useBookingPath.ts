'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { serviceTypeToSlug } from './booking-utils';

/**
 * Hook to determine the correct booking path prefix based on current URL.
 * If user is on old booking URL (/booking/service/*), returns old pattern.
 * Otherwise returns new booking-v2 pattern.
 */
export function useBookingPath() {
  const pathname = usePathname();
  
  const isOldBookingPath = useMemo(() => {
    return pathname.startsWith('/booking/service/');
  }, [pathname]);

  const getSelectPath = useMemo(() => {
    return isOldBookingPath ? '/booking/service/select' : '/booking-v2/select';
  }, [isOldBookingPath]);

  const getDetailsPath = useMemo(() => {
    return (serviceType: string) => {
      const slug = serviceTypeToSlug(serviceType as any);
      return isOldBookingPath 
        ? `/booking/service/${slug}/details`
        : `/booking-v2/${slug}/details`;
    };
  }, [isOldBookingPath]);

  const getSchedulePath = useMemo(() => {
    return (serviceType: string) => {
      const slug = serviceTypeToSlug(serviceType as any);
      return isOldBookingPath 
        ? `/booking/service/${slug}/schedule`
        : `/booking-v2/${slug}/schedule`;
    };
  }, [isOldBookingPath]);

  const getContactPath = useMemo(() => {
    return (serviceType: string) => {
      const slug = serviceTypeToSlug(serviceType as any);
      return isOldBookingPath 
        ? `/booking/service/${slug}/contact`
        : `/booking-v2/${slug}/contact`;
    };
  }, [isOldBookingPath]);

  const getCleanerPath = useMemo(() => {
    return (serviceType: string) => {
      const slug = serviceTypeToSlug(serviceType as any);
      return isOldBookingPath 
        ? `/booking/service/${slug}/select-cleaner`
        : `/booking-v2/${slug}/cleaner`;
    };
  }, [isOldBookingPath]);

  const getReviewPath = useMemo(() => {
    return (serviceType: string) => {
      const slug = serviceTypeToSlug(serviceType as any);
      return isOldBookingPath 
        ? `/booking/service/${slug}/review`
        : `/booking-v2/${slug}/review`;
    };
  }, [isOldBookingPath]);

  const getConfirmationPath = useMemo(() => {
    return (ref?: string) => {
      // Always use old confirmation URL to maintain consistency
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

