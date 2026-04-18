/**
 * Shared tip preset metadata for booking checkout (ZAR).
 * Used by TipCard, pricing preview, and breakdown display.
 */

export interface TipOption {
  id: string;
  /** Short label for buttons, e.g. R0, R25 */
  label: string;
  value: number;
}

/** Preset amounts shown as quick-select chips (matches premium Tip Card UI). */
export const BOOKING_TIP_PRESETS: TipOption[] = [
  { id: 'tip-0', label: 'R0', value: 0 },
  { id: 'tip-25', label: 'R25', value: 25 },
  { id: 'tip-50', label: 'R50', value: 50 },
  { id: 'tip-100', label: 'R100', value: 100 },
  { id: 'tip-150', label: 'R150', value: 150 },
];

const PRESET_VALUES = new Set(BOOKING_TIP_PRESETS.map((t) => t.value));

/** @deprecated Use BOOKING_TIP_PRESETS */
export const BOOKING_TIP_OPTIONS = BOOKING_TIP_PRESETS;

/**
 * Resolves display metadata for a tip amount (preset row or custom).
 */
export function getTipOptionForAmount(amount: number): TipOption {
  const found = BOOKING_TIP_PRESETS.find((t) => t.value === amount);
  if (found) return found;
  return {
    id: 'custom',
    label: amount <= 0 ? 'R0' : `R${amount}`,
    value: amount,
  };
}

export function isPresetTipAmount(amount: number): boolean {
  return PRESET_VALUES.has(amount);
}
