/**
 * Static defaults for marketing / category “instant price” demos.
 * Not used in the booking wizard — avoids smart-defaults + localStorage coupling.
 */
export function getMarketingInstantPriceInputDefaults() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return {
    bedrooms: 2,
    bathrooms: 1,
    extraRooms: 0,
    date: d.toISOString().slice(0, 10),
    time: '10:00',
  } as const;
}
