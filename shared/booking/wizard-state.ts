import type { BookingFormData, ServiceType } from '@/components/booking-system-types';
import { MAX_TEAM_SIZE, MIN_TEAM_SIZE } from '@/lib/team-optimizer';
import { WIZARD_DEFAULT_FORM } from './wizard-defaults';

function normalizeWizardParsed(merged: BookingFormData): BookingFormData {
  const n =
    typeof merged.numberOfCleaners === 'number' && merged.numberOfCleaners >= 1
      ? Math.min(MAX_TEAM_SIZE, Math.max(MIN_TEAM_SIZE, Math.round(merged.numberOfCleaners)))
      : WIZARD_DEFAULT_FORM.numberOfCleaners;
  const mode =
    merged.pricingMode === 'basic' || merged.pricingMode === 'premium'
      ? merged.pricingMode
      : WIZARD_DEFAULT_FORM.pricingMode;
  const rawBasicH = merged.basicPlannedHours as number | string | null | undefined;
  let coercedBasicH = NaN;
  if (typeof rawBasicH === 'number') {
    coercedBasicH = rawBasicH;
  } else if (typeof rawBasicH === 'string') {
    const t = rawBasicH.trim();
    if (t !== '') coercedBasicH = Number(t);
  }
  const maxBasicH = 6;
  const basicH =
    mode === 'premium'
      ? null
      : Number.isFinite(coercedBasicH) &&
          coercedBasicH >= 2 &&
          coercedBasicH <= maxBasicH
        ? coercedBasicH
        : WIZARD_DEFAULT_FORM.basicPlannedHours;
  return {
    ...merged,
    numberOfCleaners: n,
    teamSizeUserOverride: Boolean(merged.teamSizeUserOverride),
    pricingMode: mode,
    basicPlannedHours: basicH,
  };
}

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
  if (typeof window === 'undefined') return normalizeWizardParsed(base);
  try {
    const stored = window.sessionStorage.getItem(options.storageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<BookingFormData>;
      if (options.serviceFromPath) {
        return normalizeWizardParsed({ ...base, ...parsed, service: options.serviceFromPath });
      }
      return normalizeWizardParsed({ ...base, ...parsed });
    }
  } catch {
    // ignore storage errors
  }
  return normalizeWizardParsed(base);
}
