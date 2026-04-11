// ─── Pricing Store (Simulated DB / Global State) ─────────────────────────────
// This module acts as the single source of truth for all pricing data.
// In a real Supabase setup, these would be fetched via GET /api/pricing.

export interface ServiceRecord {
  id: string;
  name: string;
  basePrice: number;
  priceType: 'fixed' | 'per_room' | 'per_hour';
  duration: string;
  description: string;
  color: string;
  active: boolean;
}

export type ServicePriceType = ServiceRecord['priceType'];

export interface PricingRule {
  id: string;
  serviceId: string;
  label: string;
  price: number;
  extraPricePerUnit?: number;
}
export interface ExtraRecord {
  id: string;
  name: string;
  price: number;
  pricingType: 'fixed' | 'per_item';
  active: boolean;
  icon: string;
}
export interface CleanerPricing {
  id: string;
  type: 'individual' | 'team';
  baseRate: number;
  additionalCleanerRate: number;
  label: string;
  description: string;
}
export interface PromoCode {
  id: string;
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderValue: number;
  maxUses: number | null;
  usedCount: number;
  active: boolean;
  expiresAt: string | null;
  appliesTo: 'all' | string[];
}
export interface BathroomRule {
  id: string;
  label: string;
  price: number;
  description: string;
  active: boolean;
}
export interface ExtraRoomRecord {
  id: string;
  name: string;
  price: number;
  description: string;
  active: boolean;
  icon: string;
}
export interface PricingData {
  services: ServiceRecord[];
  rules: PricingRule[];
  extras: ExtraRecord[];
  cleanerPricing: CleanerPricing[];
  promoCodes: PromoCode[];
  bathroomRules: BathroomRule[];
  extraRooms: ExtraRoomRecord[];
}

// ─── Initial Data (Simulates DB seed) ────────────────────────────────────────

const INITIAL_SERVICES: ServiceRecord[] = [
  {
    id: 'standard',
    name: 'Standard Clean',
    basePrice: 145,
    priceType: 'per_room',
    duration: '2–3 hrs',
    description: 'Regular cleaning of all rooms, kitchen, and bathrooms',
    color: '#4F46E5',
    active: true,
  },
  {
    id: 'deep',
    name: 'Deep Clean',
    basePrice: 285,
    priceType: 'per_room',
    duration: '4–6 hrs',
    description: 'Thorough deep cleaning including inside appliances and cabinets',
    color: '#7C3AED',
    active: true,
  },
  {
    id: 'movein',
    name: 'Move-In/Out Clean',
    basePrice: 420,
    priceType: 'fixed',
    duration: '5–8 hrs',
    description: 'Complete clean for property handovers and moves',
    color: '#059669',
    active: true,
  },
  {
    id: 'office',
    name: 'Office Clean',
    basePrice: 380,
    priceType: 'per_hour',
    duration: '3–5 hrs',
    description: 'Commercial cleaning for offices and business premises',
    color: '#D97706',
    active: true,
  },
  {
    id: 'window',
    name: 'Window Clean',
    basePrice: 220,
    priceType: 'fixed',
    duration: '2–4 hrs',
    description: 'Interior and exterior window cleaning',
    color: '#DC2626',
    active: true,
  },
  {
    id: 'airbnb',
    name: 'Airbnb Turnover',
    basePrice: 195,
    priceType: 'fixed',
    duration: '1–3 hrs',
    description: 'Quick turnaround clean between Airbnb guests',
    color: '#0891B2',
    active: false,
  },
  {
    id: 'carpet',
    name: 'Carpet Clean',
    basePrice: 250,
    priceType: 'per_room',
    duration: '2–4 hrs',
    description: 'Professional carpet shampooing and steam cleaning',
    color: '#BE185D',
    active: true,
  },
];

const INITIAL_RULES: PricingRule[] = [
  // Standard Clean rules
  { id: 'r1', serviceId: 'standard', label: '1 Bedroom', price: 145 },
  { id: 'r2', serviceId: 'standard', label: '2 Bedrooms', price: 195 },
  { id: 'r3', serviceId: 'standard', label: '3 Bedrooms', price: 245 },
  { id: 'r4', serviceId: 'standard', label: '4 Bedrooms', price: 295 },
  { id: 'r5', serviceId: 'standard', label: '5+ Bedrooms', price: 350, extraPricePerUnit: 55 },
  // Deep Clean rules
  { id: 'r6', serviceId: 'deep', label: '1 Bedroom', price: 285 },
  { id: 'r7', serviceId: 'deep', label: '2 Bedrooms', price: 365 },
  { id: 'r8', serviceId: 'deep', label: '3 Bedrooms', price: 445 },
  { id: 'r9', serviceId: 'deep', label: '4+ Bedrooms', price: 525, extraPricePerUnit: 80 },
  // Carpet rules
  { id: 'r10', serviceId: 'carpet', label: '1 Room', price: 120 },
  { id: 'r11', serviceId: 'carpet', label: '2 Rooms', price: 200 },
  { id: 'r12', serviceId: 'carpet', label: '3 Rooms', price: 270 },
  { id: 'r13', serviceId: 'carpet', label: '4+ Rooms', price: 340, extraPricePerUnit: 70 },
];

const INITIAL_EXTRAS: ExtraRecord[] = [
  { id: 'e1', name: 'Fridge Clean', price: 85, pricingType: 'fixed', active: true, icon: '🧊' },
  { id: 'e2', name: 'Oven Clean', price: 95, pricingType: 'fixed', active: true, icon: '🔥' },
  { id: 'e3', name: 'Laundry & Folding', price: 120, pricingType: 'fixed', active: true, icon: '👕' },
  { id: 'e4', name: 'Ironing (per item)', price: 15, pricingType: 'per_item', active: true, icon: '✂️' },
  { id: 'e5', name: 'Balcony / Patio', price: 65, pricingType: 'fixed', active: true, icon: '🌿' },
  { id: 'e6', name: 'Garage Clean', price: 150, pricingType: 'fixed', active: false, icon: '🚗' },
  { id: 'e7', name: 'Pet Hair Removal', price: 75, pricingType: 'fixed', active: true, icon: '🐾' },
  { id: 'e8', name: 'Interior Windows', price: 55, pricingType: 'fixed', active: true, icon: '🪟' },
];

const INITIAL_CLEANER_PRICING: CleanerPricing[] = [
  {
    id: 'cp1',
    type: 'individual',
    baseRate: 145,
    additionalCleanerRate: 0,
    label: 'Individual Cleaner',
    description: 'Single cleaner assignment for standard bookings',
  },
  {
    id: 'cp2',
    type: 'team',
    baseRate: 245,
    additionalCleanerRate: 95,
    label: 'Team Clean (2+ cleaners)',
    description: 'Multi-cleaner team for large or deep clean jobs',
  },
];

const INITIAL_PROMO_CODES: PromoCode[] = [
  {
    id: 'promo1',
    code: 'WELCOME20',
    description: '20% off for new customers',
    discountType: 'percentage',
    discountValue: 20,
    minOrderValue: 0,
    maxUses: 100,
    usedCount: 34,
    active: true,
    expiresAt: '2025-12-31',
    appliesTo: 'all',
  },
  {
    id: 'promo2',
    code: 'DEEP50',
    description: 'R50 flat off on Deep Clean bookings',
    discountType: 'fixed',
    discountValue: 50,
    minOrderValue: 200,
    maxUses: 50,
    usedCount: 18,
    active: true,
    expiresAt: '2025-09-30',
    appliesTo: ['deep'],
  },
  {
    id: 'promo3',
    code: 'SUMMER15',
    description: '15% summer discount on all services',
    discountType: 'percentage',
    discountValue: 15,
    minOrderValue: 150,
    maxUses: null,
    usedCount: 72,
    active: false,
    expiresAt: '2025-03-31',
    appliesTo: 'all',
  },
  {
    id: 'promo4',
    code: 'AIRBNB100',
    description: 'R100 off Airbnb Turnover bookings',
    discountType: 'fixed',
    discountValue: 100,
    minOrderValue: 195,
    maxUses: 30,
    usedCount: 12,
    active: true,
    expiresAt: null,
    appliesTo: ['airbnb'],
  },
];

const INITIAL_BATHROOM_RULES: BathroomRule[] = [
  { id: 'br1', label: '1 Bathroom', price: 0, description: 'Included in base price', active: true },
  { id: 'br2', label: '2 Bathrooms', price: 85, description: 'Additional bathroom surcharge', active: true },
  { id: 'br3', label: '3 Bathrooms', price: 160, description: 'Two extra bathrooms surcharge', active: true },
  { id: 'br4', label: '4+ Bathrooms', price: 230, description: 'Three+ extra bathrooms surcharge', active: true },
];

const INITIAL_EXTRA_ROOMS: ExtraRoomRecord[] = [
  {
    id: 'er1',
    name: 'Study / Home Office',
    price: 120,
    description: 'Full clean of a dedicated home office or study',
    active: true,
    icon: '💼',
  },
  {
    id: 'er2',
    name: 'Dining Room',
    price: 95,
    description: 'Clean dining area including table and chairs',
    active: true,
    icon: '🪑',
  },
  {
    id: 'er3',
    name: 'Lounge / Sitting Room',
    price: 110,
    description: 'Additional lounge or sitting area',
    active: true,
    icon: '🛋️',
  },
  {
    id: 'er4',
    name: 'Linen Room / Utility',
    price: 85,
    description: 'Utility room, linen cupboard area',
    active: true,
    icon: '🧺',
  },
  {
    id: 'er5',
    name: 'Playroom',
    price: 130,
    description: 'Dedicated kids playroom including toys tidy',
    active: true,
    icon: '🧸',
  },
  {
    id: 'er6',
    name: 'Gym / Fitness Room',
    price: 145,
    description: 'Equipment wipe-down and floor clean',
    active: false,
    icon: '🏋️',
  },
  {
    id: 'er7',
    name: 'Wine Cellar',
    price: 180,
    description: 'Deep clean of a dedicated wine room',
    active: false,
    icon: '🍷',
  },
];

// ─── In-memory store with subscriber support ──────────────────────────────────

let _data: PricingData = {
  services: JSON.parse(JSON.stringify(INITIAL_SERVICES)) as ServiceRecord[],
  rules: JSON.parse(JSON.stringify(INITIAL_RULES)) as PricingRule[],
  extras: JSON.parse(JSON.stringify(INITIAL_EXTRAS)) as ExtraRecord[],
  cleanerPricing: JSON.parse(JSON.stringify(INITIAL_CLEANER_PRICING)) as CleanerPricing[],
  promoCodes: JSON.parse(JSON.stringify(INITIAL_PROMO_CODES)) as PromoCode[],
  bathroomRules: JSON.parse(JSON.stringify(INITIAL_BATHROOM_RULES)) as BathroomRule[],
  extraRooms: JSON.parse(JSON.stringify(INITIAL_EXTRA_ROOMS)) as ExtraRoomRecord[],
};

type Subscriber = () => void;
const subscribers: Set<Subscriber> = new Set();

function notify() {
  subscribers.forEach((fn) => fn());
}

export const pricingStore = {
  // ── Read ─────────────────────────────────────────────────────────────
  getData(): PricingData {
    return _data;
  },
  subscribe(fn: Subscriber): () => void {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  },
  getActiveServices(): ServiceRecord[] {
    return _data.services.filter((s) => s.active);
  },
  getRulesForService(serviceId: string): PricingRule[] {
    return _data.rules.filter((r) => r.serviceId === serviceId);
  },
  getActiveExtras(): ExtraRecord[] {
    return _data.extras.filter((e) => e.active);
  },
  getActiveBathroomRules(): BathroomRule[] {
    return _data.bathroomRules.filter((b) => b.active);
  },
  getActiveExtraRooms(): ExtraRoomRecord[] {
    return _data.extraRooms.filter((r) => r.active);
  },
  // ── Calculate booking price ───────────────────────────────────────────
  calculateTotal(params: {
    serviceId: string;
    bedrooms?: string;
    bathrooms?: string;
    extraIds?: string[];
    extraRoomIds?: string[];
    cleanerCount?: number;
    useTeam?: boolean;
  }): number {
    const service = _data.services.find((s) => s.id === params.serviceId);
    if (!service) return 0;
    let total = service.basePrice;

    // Apply room-based rule if available
    if (service.priceType === 'per_room' && params.bedrooms) {
      const bedroomNum = parseInt(params.bedrooms, 10) || 1;
      const rules = _data.rules
        .filter((r) => r.serviceId === params.serviceId)
        .sort((a, b) => {
          const aNum = parseInt(a.label, 10) || 0;
          const bNum = parseInt(b.label, 10) || 0;
          return aNum - bNum;
        });
      if (rules.length > 0) {
        let matched: PricingRule | null = null;
        for (const rule of rules) {
          const ruleNum = parseInt(rule.label, 10) || 0;
          if (bedroomNum <= ruleNum) {
            matched = rule;
            break;
          }
        }
        if (!matched) matched = rules[rules.length - 1];
        if (matched) {
          total = matched.price;
          if (matched.extraPricePerUnit) {
            const ruleNum = parseInt(matched.label, 10) || 1;
            const extra = Math.max(0, bedroomNum - ruleNum);
            total += extra * matched.extraPricePerUnit;
          }
        }
      }
    }

    // Apply bathroom surcharge
    if (params.bathrooms) {
      const bathroomNum = parseInt(params.bathrooms, 10) || 1;
      const activeRules = _data.bathroomRules
        .filter((b) => b.active)
        .sort((a, b) => {
          const aNum = parseInt(a.label, 10) || 0;
          const bNum = parseInt(b.label, 10) || 0;
          return aNum - bNum;
        });
      if (activeRules.length > 0) {
        let matched: BathroomRule | null = null;
        for (const rule of activeRules) {
          const ruleNum = parseInt(rule.label, 10) || 0;
          if (bathroomNum <= ruleNum) {
            matched = rule;
            break;
          }
        }
        if (!matched) matched = activeRules[activeRules.length - 1];
        if (matched) {
          total += matched.price;
        }
      }
    }

    // Add extra rooms
    if (params.extraRoomIds && params.extraRoomIds.length > 0) {
      params.extraRoomIds.forEach((rid) => {
        const room = _data.extraRooms.find((r) => r.id === rid);
        if (room && room.active) {
          total += room.price;
        }
      });
    }

    // Add extras
    if (params.extraIds && params.extraIds.length > 0) {
      params.extraIds.forEach((eid) => {
        const extra = _data.extras.find((e) => e.id === eid);
        if (extra && extra.active) {
          total += extra.price;
        }
      });
    }

    // Adjust for team pricing
    if (params.useTeam && (params.cleanerCount ?? 1) > 1) {
      const teamPricing = _data.cleanerPricing.find((cp) => cp.type === 'team');
      if (teamPricing) {
        const extra = ((params.cleanerCount ?? 2) - 1) * teamPricing.additionalCleanerRate;
        total += extra;
      }
    }

    return Math.round(total);
  },
  // ── Update services ───────────────────────────────────────────────────
  updateService(id: string, updates: Partial<ServiceRecord>): void {
    _data = {
      ..._data,
      services: _data.services.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    };
    notify();
  },
  addService(service: Omit<ServiceRecord, 'id'>): void {
    const newService: ServiceRecord = {
      ...service,
      id: `svc-${Date.now()}`,
    };
    _data = {
      ..._data,
      services: [..._data.services, newService],
    };
    notify();
  },
  // ── Update rules ──────────────────────────────────────────────────────
  updateRule(id: string, updates: Partial<PricingRule>): void {
    _data = {
      ..._data,
      rules: _data.rules.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    };
    notify();
  },
  addRule(rule: Omit<PricingRule, 'id'>): void {
    const newRule: PricingRule = {
      ...rule,
      id: `rule-${Date.now()}`,
    };
    _data = {
      ..._data,
      rules: [..._data.rules, newRule],
    };
    notify();
  },
  deleteRule(id: string): void {
    _data = {
      ..._data,
      rules: _data.rules.filter((r) => r.id !== id),
    };
    notify();
  },
  // ── Update extras ─────────────────────────────────────────────────────
  updateExtra(id: string, updates: Partial<ExtraRecord>): void {
    _data = {
      ..._data,
      extras: _data.extras.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    };
    notify();
  },
  addExtra(extra: Omit<ExtraRecord, 'id'>): void {
    const newExtra: ExtraRecord = {
      ...extra,
      id: `ext-${Date.now()}`,
    };
    _data = {
      ..._data,
      extras: [..._data.extras, newExtra],
    };
    notify();
  },
  deleteExtra(id: string): void {
    _data = {
      ..._data,
      extras: _data.extras.filter((e) => e.id !== id),
    };
    notify();
  },
  // ── Update cleaner pricing ────────────────────────────────────────────
  updateCleanerPricing(id: string, updates: Partial<CleanerPricing>): void {
    _data = {
      ..._data,
      cleanerPricing: _data.cleanerPricing.map((cp) => (cp.id === id ? { ...cp, ...updates } : cp)),
    };
    notify();
  },
  // ── Update bathroom rules ─────────────────────────────────────────────
  updateBathroomRule(id: string, updates: Partial<BathroomRule>): void {
    _data = {
      ..._data,
      bathroomRules: _data.bathroomRules.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    };
    notify();
  },
  addBathroomRule(rule: Omit<BathroomRule, 'id'>): void {
    const newRule: BathroomRule = { ...rule, id: `br-${Date.now()}` };
    _data = { ..._data, bathroomRules: [..._data.bathroomRules, newRule] };
    notify();
  },
  deleteBathroomRule(id: string): void {
    _data = { ..._data, bathroomRules: _data.bathroomRules.filter((b) => b.id !== id) };
    notify();
  },
  // ── Update extra rooms ────────────────────────────────────────────────
  updateExtraRoom(id: string, updates: Partial<ExtraRoomRecord>): void {
    _data = {
      ..._data,
      extraRooms: _data.extraRooms.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    };
    notify();
  },
  addExtraRoom(room: Omit<ExtraRoomRecord, 'id'>): void {
    const newRoom: ExtraRoomRecord = { ...room, id: `er-${Date.now()}` };
    _data = { ..._data, extraRooms: [..._data.extraRooms, newRoom] };
    notify();
  },
  deleteExtraRoom(id: string): void {
    _data = { ..._data, extraRooms: _data.extraRooms.filter((r) => r.id !== id) };
    notify();
  },
  // ── Promo Codes ───────────────────────────────────────────────────────
  getActivePromoCodes(): PromoCode[] {
    return _data.promoCodes.filter((p) => p.active);
  },
  addPromoCode(promo: Omit<PromoCode, 'id' | 'usedCount'>): void {
    const newPromo: PromoCode = {
      ...promo,
      id: `promo-${Date.now()}`,
      usedCount: 0,
    };
    _data = {
      ..._data,
      promoCodes: [..._data.promoCodes, newPromo],
    };
    notify();
  },
  updatePromoCode(id: string, updates: Partial<PromoCode>): void {
    _data = {
      ..._data,
      promoCodes: _data.promoCodes.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    };
    notify();
  },
  deletePromoCode(id: string): void {
    _data = {
      ..._data,
      promoCodes: _data.promoCodes.filter((p) => p.id !== id),
    };
    notify();
  },
  applyPromoCode(
    code: string,
    subtotal: number,
    serviceId: string
  ): {
    valid: boolean;
    discount: number;
    message: string;
    promoId?: string;
  } {
    const trimmed = code.trim();
    if (!trimmed) {
      return { valid: false, discount: 0, message: 'Enter a promo code' };
    }
    if (subtotal <= 0) {
      return { valid: false, discount: 0, message: 'Select a service first' };
    }
    const promo = _data.promoCodes.find((p) => p.code.toUpperCase() === trimmed.toUpperCase());
    if (!promo) return { valid: false, discount: 0, message: 'Promo code not found' };
    if (!promo.active) return { valid: false, discount: 0, message: 'This promo code is no longer active' };
    if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) {
      return { valid: false, discount: 0, message: 'This promo code has expired' };
    }
    if (promo.maxUses !== null && promo.usedCount >= promo.maxUses) {
      return { valid: false, discount: 0, message: 'This promo code has reached its usage limit' };
    }
    if (subtotal < promo.minOrderValue) {
      return { valid: false, discount: 0, message: `Minimum order value of R${promo.minOrderValue} required` };
    }
    if (Array.isArray(promo.appliesTo) && !promo.appliesTo.includes(serviceId)) {
      return { valid: false, discount: 0, message: 'This promo code does not apply to the selected service' };
    }
    const discount =
      promo.discountType === 'percentage'
        ? Math.round((subtotal * promo.discountValue) / 100)
        : Math.min(promo.discountValue, subtotal);
    return {
      valid: true,
      discount,
      message: `${promo.discountType === 'percentage' ? `${promo.discountValue}%` : `R${promo.discountValue}`} discount applied!`,
      promoId: promo.id,
    };
  },
  redeemPromoCode(promoId: string): void {
    _data = {
      ..._data,
      promoCodes: _data.promoCodes.map((p) =>
        p.id === promoId ? { ...p, usedCount: p.usedCount + 1 } : p
      ),
    };
    notify();
  },
};
