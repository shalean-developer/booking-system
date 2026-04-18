/**
 * Add-ons that open a quantity picker (tile `id` = slugified DB name or legacy static EXTRAS id).
 * Shown on Deep / Move / Standard / Airbnb step-2 grids where applicable.
 */
export const quantityAddons = [
  'carpet_cleaning',
  'couch_cleaning',
  'mattress_cleaning',
  'balcony_cleaning',
  'garage_cleaning',
  'outside_windows',
  'outside_window_cleaning',
  'exterior_windows',
  'ironing',
  'laundry',
  'ceiling_cleaning',
  'ceiling',
  'extra_cleaner',
  // Legacy static step-2 tile ids (`booking-step2-schedule` EXTRAS)
  'carpet',
  'couch',
  'garage',
  'balcony',
  'windows',
] as const;

const quantityAddonSet = new Set<string>(quantityAddons);

export function isQuantityAddonTile(tileId: string): boolean {
  return quantityAddonSet.has(tileId);
}
