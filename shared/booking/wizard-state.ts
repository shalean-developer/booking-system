import type { BookingFormData, ServiceType } from '@/components/booking-system-types';
import type { WizardDisplayPricing } from '@/shared/booking-engine/wizard-display-pricing';
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
    pricing: merged.pricing ?? null,
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
    const stored = window.localStorage.getItem(options.storageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<BookingFormData> & {
        wizardPriceLock?: WizardDisplayPricing | null;
      };
      const pricingFromLegacy =
        parsed.pricing ?? (parsed.wizardPriceLock != null ? parsed.wizardPriceLock : undefined);
      const { wizardPriceLock: _drop, ...parsedRest } = parsed;
      const merged: Partial<BookingFormData> = {
        ...parsedRest,
        ...(pricingFromLegacy !== undefined ? { pricing: pricingFromLegacy } : {}),
      };
      if (options.serviceFromPath) {
        return normalizeWizardParsed({ ...base, ...merged, service: options.serviceFromPath });
      }
      return normalizeWizardParsed({ ...base, ...merged });
    }
  } catch {
    // ignore storage errors
  }
  return normalizeWizardParsed(base);
}
