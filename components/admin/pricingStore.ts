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

const SERVICE_TYPE_BY_ID: Record<string, string> = {
  standard: 'Standard',
  deep: 'Deep',
  movein: 'Move In/Out',
  office: 'Office',
  window: 'Window',
  airbnb: 'Airbnb',
  carpet: 'Carpet',
};

const PRICE_TYPE_BY_RULE_LABEL: Record<string, 'base' | 'bedroom' | 'bathroom' | 'extra_room'> = {
  base: 'base',
  'per bedroom': 'bedroom',
  'per bathroom': 'bathroom',
  'per extra room': 'extra_room',
};

function notify() {
  subscribers.forEach((fn) => fn());
}

function resolveServiceType(serviceId: string): string | null {
  return SERVICE_TYPE_BY_ID[serviceId] ?? null;
}

function resolvePriceTypeFromRuleLabel(label: string): 'base' | 'bedroom' | 'bathroom' | 'extra_room' | null {
  const key = label.trim().toLowerCase();
  return PRICE_TYPE_BY_RULE_LABEL[key] ?? null;
}

async function persistPricingUpdate(input: {
  id?: string | null;
  service_type?: string | null;
  price_type: 'base' | 'bedroom' | 'bathroom' | 'extra_room' | 'extra';
  item_name?: string | null;
  price: number;
}): Promise<void> {
  try {
    const response = await fetch('/api/admin/pricing/manage', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: input.id || undefined,
        service_type: input.service_type || null,
        price_type: input.price_type,
        item_name: input.item_name || null,
        price: input.price,
        effective_date: new Date().toISOString().split('T')[0],
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || 'Failed to persist pricing update');
    }
  } catch (error) {
    console.error('pricingStore persistence failed:', error);
  }
}

async function persistServiceActive(input: { service_type: string; is_active: boolean }): Promise<void> {
  try {
    const response = await fetch('/api/admin/services', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || 'Failed to persist service active state');
    }
  } catch (error) {
    console.error('pricingStore service active persistence failed:', error);
  }
}

async function persistPageConfigMutation(input: {
  entity: 'cleanerPricing' | 'bathroomRules' | 'extraRoomRules' | 'promoCodes';
  action: 'upsert' | 'delete';
  payload: Record<string, unknown>;
}): Promise<void> {
  try {
    const response = await fetch('/api/admin/pricing/page-config', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || 'Failed to persist page config update');
    }
  } catch (error) {
    console.error('pricingStore page-config persistence failed:', error);
  }
}

export const pricingStore = {
  // ── Read ─────────────────────────────────────────────────────────────
  getData(): PricingData {
    return _data;
  },
  replaceData(next: PricingData): void {
    _data = next;
    notify();
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
    const serviceRules = _data.rules.filter((r) => r.serviceId === params.serviceId);
    const byRuleLabel = new Map(serviceRules.map((r) => [r.label.trim().toLowerCase(), r]));

    const baseRule = byRuleLabel.get('base');
    const perBedroomRule = byRuleLabel.get('per bedroom');
    const perBathroomRule = byRuleLabel.get('per bathroom');
    const hasPerUnitRules = !!(baseRule || perBedroomRule || perBathroomRule);

    if (hasPerUnitRules) {
      total = baseRule?.price ?? service.basePrice;
      const bedroomNum = Math.max(1, parseInt(params.bedrooms || '1', 10) || 1);
      if (perBedroomRule) {
        total += Math.max(0, bedroomNum - 1) * perBedroomRule.price;
      }
      if (perBathroomRule) {
        const bathroomNum = Math.max(1, parseInt(params.bathrooms || '1', 10) || 1);
        total += Math.max(0, bathroomNum - 1) * perBathroomRule.price;
      }
    }

    // Apply room-based rule if available
    if (!hasPerUnitRules && service.priceType === 'per_room' && params.bedrooms) {
      const bedroomNum = parseInt(params.bedrooms, 10) || 1;
      const rules = serviceRules
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
    if (!perBathroomRule && params.bathrooms) {
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
    const target = _data.services.find((s) => s.id === id);
    _data = {
      ..._data,
      services: _data.services.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    };
    notify();
    if (target && typeof updates.basePrice === 'number') {
      const serviceType = resolveServiceType(id);
      const baseRule = _data.rules.find((r) => r.serviceId === id && r.label.trim().toLowerCase() === 'base');
      if (serviceType) {
        void persistPricingUpdate({
          id: baseRule?.id || null,
          service_type: serviceType,
          price_type: 'base',
          price: updates.basePrice,
        });
      }
    }
    if (target && typeof updates.active === 'boolean') {
      const serviceType = resolveServiceType(id);
      if (serviceType) {
        void persistServiceActive({
          service_type: serviceType,
          is_active: updates.active,
        });
      }
    }
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
    const existing = _data.rules.find((r) => r.id === id);
    _data = {
      ..._data,
      rules: _data.rules.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    };
    notify();
    const nextRule = _data.rules.find((r) => r.id === id) ?? existing;
    const priceType = nextRule ? resolvePriceTypeFromRuleLabel(nextRule.label) : null;
    const serviceType = nextRule ? resolveServiceType(nextRule.serviceId) : null;
    const nextPrice = typeof updates.price === 'number' ? updates.price : nextRule?.price;
    if (nextRule && priceType && serviceType && typeof nextPrice === 'number') {
      void persistPricingUpdate({
        id,
        service_type: serviceType,
        price_type: priceType,
        price: nextPrice,
      });
    }
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
    const existing = _data.extras.find((e) => e.id === id);
    _data = {
      ..._data,
      extras: _data.extras.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    };
    notify();
    const nextExtra = _data.extras.find((e) => e.id === id) ?? existing;
    const nextPrice = typeof updates.price === 'number' ? updates.price : nextExtra?.price;
    if (nextExtra && typeof nextPrice === 'number') {
      void persistPricingUpdate({
        id,
        price_type: 'extra',
        item_name: nextExtra.name,
        price: nextPrice,
      });
    }
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
    void persistPricingUpdate({
      price_type: 'extra',
      item_name: newExtra.name,
      price: newExtra.price,
    });
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
    const existing = _data.cleanerPricing.find((cp) => cp.id === id);
    _data = {
      ..._data,
      cleanerPricing: _data.cleanerPricing.map((cp) => (cp.id === id ? { ...cp, ...updates } : cp)),
    };
    notify();
    const next = _data.cleanerPricing.find((cp) => cp.id === id) ?? existing;
    if (next) {
      void persistPageConfigMutation({
        entity: 'cleanerPricing',
        action: 'upsert',
        payload: {
          id: next.id,
          type: next.type,
          baseRate: next.baseRate,
          additionalCleanerRate: next.additionalCleanerRate,
          label: next.label,
          description: next.description,
          active: true,
        },
      });
    }
  },
  // ── Update bathroom rules ─────────────────────────────────────────────
  updateBathroomRule(id: string, updates: Partial<BathroomRule>): void {
    const existing = _data.bathroomRules.find((b) => b.id === id);
    _data = {
      ..._data,
      bathroomRules: _data.bathroomRules.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    };
    notify();
    const next = _data.bathroomRules.find((b) => b.id === id) ?? existing;
    if (next) {
      void persistPageConfigMutation({
        entity: 'bathroomRules',
        action: 'upsert',
        payload: {
          id: next.id,
          label: next.label,
          price: next.price,
          description: next.description,
          active: next.active,
        },
      });
    }
  },
  addBathroomRule(rule: Omit<BathroomRule, 'id'>): void {
    const newRule: BathroomRule = { ...rule, id: `br-${Date.now()}` };
    _data = { ..._data, bathroomRules: [..._data.bathroomRules, newRule] };
    notify();
    void persistPageConfigMutation({
      entity: 'bathroomRules',
      action: 'upsert',
      payload: {
        label: newRule.label,
        price: newRule.price,
        description: newRule.description,
        active: newRule.active,
      },
    });
  },
  deleteBathroomRule(id: string): void {
    _data = { ..._data, bathroomRules: _data.bathroomRules.filter((b) => b.id !== id) };
    notify();
    void persistPageConfigMutation({
      entity: 'bathroomRules',
      action: 'delete',
      payload: { id },
    });
  },
  // ── Update extra rooms ────────────────────────────────────────────────
  updateExtraRoom(id: string, updates: Partial<ExtraRoomRecord>): void {
    const existing = _data.extraRooms.find((r) => r.id === id);
    _data = {
      ..._data,
      extraRooms: _data.extraRooms.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    };
    notify();
    const next = _data.extraRooms.find((r) => r.id === id) ?? existing;
    if (next) {
      void persistPageConfigMutation({
        entity: 'extraRoomRules',
        action: 'upsert',
        payload: {
          id: next.id,
          name: next.name,
          price: next.price,
          description: next.description,
          icon: next.icon,
          active: next.active,
        },
      });
    }
  },
  addExtraRoom(room: Omit<ExtraRoomRecord, 'id'>): void {
    const newRoom: ExtraRoomRecord = { ...room, id: `er-${Date.now()}` };
    _data = { ..._data, extraRooms: [..._data.extraRooms, newRoom] };
    notify();
    void persistPageConfigMutation({
      entity: 'extraRoomRules',
      action: 'upsert',
      payload: {
        name: newRoom.name,
        price: newRoom.price,
        description: newRoom.description,
        icon: newRoom.icon,
        active: newRoom.active,
      },
    });
  },
  deleteExtraRoom(id: string): void {
    _data = { ..._data, extraRooms: _data.extraRooms.filter((r) => r.id !== id) };
    notify();
    void persistPageConfigMutation({
      entity: 'extraRoomRules',
      action: 'delete',
      payload: { id },
    });
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
    void persistPageConfigMutation({
      entity: 'promoCodes',
      action: 'upsert',
      payload: {
        code: newPromo.code,
        description: newPromo.description,
        discountType: newPromo.discountType,
        discountValue: newPromo.discountValue,
        minOrderValue: newPromo.minOrderValue,
        maxUses: newPromo.maxUses,
        active: newPromo.active,
        expiresAt: newPromo.expiresAt,
        appliesTo: newPromo.appliesTo,
      },
    });
  },
  updatePromoCode(id: string, updates: Partial<PromoCode>): void {
    const existing = _data.promoCodes.find((p) => p.id === id);
    _data = {
      ..._data,
      promoCodes: _data.promoCodes.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    };
    notify();
    const next = _data.promoCodes.find((p) => p.id === id) ?? existing;
    if (next) {
      void persistPageConfigMutation({
        entity: 'promoCodes',
        action: 'upsert',
        payload: {
          id: next.id,
          code: next.code,
          description: next.description,
          discountType: next.discountType,
          discountValue: next.discountValue,
          minOrderValue: next.minOrderValue,
          maxUses: next.maxUses,
          active: next.active,
          expiresAt: next.expiresAt,
          appliesTo: next.appliesTo,
        },
      });
    }
  },
  deletePromoCode(id: string): void {
    _data = {
      ..._data,
      promoCodes: _data.promoCodes.filter((p) => p.id !== id),
    };
    notify();
    void persistPageConfigMutation({
      entity: 'promoCodes',
      action: 'delete',
      payload: { id },
    });
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
