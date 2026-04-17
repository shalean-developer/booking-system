import type { BookingFormData, ServiceType } from '@/components/booking-system-types';
import { WIZARD_DEFAULT_FORM } from './wizard-defaults';

export function createInitialWizardState(options: {
  storageKey: string;
  initialService?: ServiceType;
  /** When set, overrides persisted service (URL is source of truth for entry points). */
  serviceFromPath?: ServiceType;
}): BookingFormData {
  const base: BookingFormData = {
    ...WIZARD_DEFAULT_FORM,
    ...(options.initialService && { service: options.initialService }),
  };
  if (typeof window === 'undefined') return base;
  try {
    const stored = window.sessionStorage.getItem(options.storageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<BookingFormData>;
      if (options.serviceFromPath) {
        return { ...base, ...parsed, service: options.serviceFromPath };
      }
      return { ...base, ...parsed };
    }
  } catch {
    // ignore storage errors
  }
  return base;
}
