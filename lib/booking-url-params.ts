/**
 * URL parameter encoding/decoding utilities for booking state
 * Provides minimal URL params as backup/initial values
 * Full state is stored in sessionStorage, URL params are just for visibility/debugging
 */

/**
 * Minimal state that can be encoded in URL parameters
 */
export interface BookingUrlState {
  // Details step
  br?: number;  // bedrooms
  bh?: number;  // bathrooms
  of?: number;  // offices
  cl?: number;  // cleaners
  eq?: number;  // equipment (0/1)
  
  // Schedule step
  d?: string;   // date (YYYY-MM-DD)
  t?: string;   // time (HH:MM)
  f?: string;   // frequency (ot/w/bw/m)
  rd?: string;  // recurring days (comma-separated: "1,3,5")
  rt?: string;  // recurring times (comma-separated: "09:00,10:00,11:00")
  
  // Cleaner step
  clid?: string; // cleaner ID
}

/**
 * Encode booking state to URL search parameters
 */
export function encodeBookingStateToUrl(state: {
  bedrooms?: number;
  bathrooms?: number;
  offices?: number;
  numberOfCleaners?: number;
  provideEquipment?: boolean;
  date?: string | null;
  timeSlot?: string | null;
  frequency?: string;
  recurringFrequency?: string | null;
  recurringDays?: number[];
  recurringTimesByDay?: Record<number, string>;
  selectedCleanerId?: string | null;
}): BookingUrlState {
  const urlState: BookingUrlState = {};
  
  // Details step params
  if (state.bedrooms !== undefined) urlState.br = state.bedrooms;
  if (state.bathrooms !== undefined) urlState.bh = state.bathrooms;
  if (state.offices !== undefined) urlState.of = state.offices;
  if (state.numberOfCleaners !== undefined) urlState.cl = state.numberOfCleaners;
  if (state.provideEquipment !== undefined) urlState.eq = state.provideEquipment ? 1 : 0;
  
  // Schedule step params
  if (state.date) urlState.d = state.date;
  if (state.timeSlot) urlState.t = state.timeSlot;
  if (state.frequency) {
    // Map frequency to short code
    const freqMap: Record<string, string> = {
      'one-time': 'ot',
      'weekly': 'w',
      'bi-weekly': 'bw',
      'monthly': 'm',
    };
    urlState.f = freqMap[state.frequency] || state.frequency;
  }
  
  // Recurring schedule params
  if (state.recurringFrequency && state.recurringDays && state.recurringDays.length > 0) {
    urlState.rd = state.recurringDays.join(',');
    
    // Encode recurring times
    if (state.recurringTimesByDay) {
      const times = state.recurringDays
        .map(day => state.recurringTimesByDay?.[day])
        .filter(Boolean) as string[];
      if (times.length > 0) {
        urlState.rt = times.join(',');
      }
    }
  }
  
  // Cleaner step params
  if (state.selectedCleanerId) urlState.clid = state.selectedCleanerId;
  
  return urlState;
}

/**
 * Decode URL search parameters to booking state partial
 */
export function decodeBookingStateFromUrl(params: URLSearchParams): Partial<{
  bedrooms: number;
  bathrooms: number;
  offices: number;
  numberOfCleaners: number;
  provideEquipment: boolean;
  date: string;
  timeSlot: string;
  frequency: string;
  recurringFrequency: string | null;
  recurringDays: number[];
  recurringTimesByDay: Record<number, string>;
  selectedCleanerId: string;
}> {
  const state: any = {};
  
  // Details step params
  if (params.has('br')) {
    const val = parseInt(params.get('br') || '1', 10);
    if (!isNaN(val)) state.bedrooms = val;
  }
  if (params.has('bh')) {
    const val = parseInt(params.get('bh') || '1', 10);
    if (!isNaN(val)) state.bathrooms = val;
  }
  if (params.has('of')) {
    const val = parseInt(params.get('of') || '0', 10);
    if (!isNaN(val)) state.offices = val;
  }
  if (params.has('cl')) {
    const val = parseInt(params.get('cl') || '1', 10);
    if (!isNaN(val)) state.numberOfCleaners = val;
  }
  if (params.has('eq')) {
    state.provideEquipment = params.get('eq') === '1';
  }
  
  // Schedule step params
  if (params.has('d')) {
    state.date = params.get('d') || null;
  }
  if (params.has('t')) {
    state.timeSlot = params.get('t') || null;
  }
  if (params.has('f')) {
    const freqCode = params.get('f') || 'ot';
    const freqMap: Record<string, string> = {
      'ot': 'one-time',
      'w': 'weekly',
      'bw': 'bi-weekly',
      'm': 'monthly',
    };
    state.frequency = freqMap[freqCode] || freqCode;
  }
  
  // Recurring schedule params
  if (params.has('rd')) {
    const daysStr = params.get('rd') || '';
    state.recurringDays = daysStr
      .split(',')
      .map(d => parseInt(d, 10))
      .filter(d => !isNaN(d) && d >= 0 && d <= 6);
    
    if (params.has('rt') && state.recurringDays.length > 0) {
      const timesStr = params.get('rt') || '';
      const times = timesStr.split(',').filter(Boolean);
      state.recurringTimesByDay = {};
      state.recurringDays.forEach((day, index) => {
        if (times[index]) {
          state.recurringTimesByDay[day] = times[index];
        }
      });
      
      // Set recurring frequency based on frequency param or default
      if (state.frequency === 'weekly' || state.frequency === 'bi-weekly') {
        state.recurringFrequency = state.frequency === 'weekly' ? 'custom-weekly' : 'custom-bi-weekly';
      }
    }
  }
  
  // Cleaner step params
  if (params.has('clid')) {
    state.selectedCleanerId = params.get('clid') || null;
  }
  
  return state;
}

/**
 * Build URL search string from booking state and session ID
 */
export function buildBookingUrlSearch(
  state: {
    bedrooms?: number;
    bathrooms?: number;
    offices?: number;
    numberOfCleaners?: number;
    provideEquipment?: boolean;
    date?: string | null;
    timeSlot?: string | null;
    frequency?: string;
    recurringFrequency?: string | null;
    recurringDays?: number[];
    recurringTimesByDay?: Record<number, string>;
    selectedCleanerId?: string | null;
  },
  sessionId?: string | null
): string {
  const params = new URLSearchParams();
  
  // Add session ID if provided
  if (sessionId) {
    params.set('sid', sessionId);
  }
  
  // Encode state to URL params
  const urlState = encodeBookingStateToUrl(state);
  
  // Add non-default values to params
  // For details step, only include if different from defaults
  if (urlState.br !== undefined && urlState.br !== 1) params.set('br', urlState.br.toString());
  if (urlState.bh !== undefined && urlState.bh !== 1) params.set('bh', urlState.bh.toString());
  if (urlState.of !== undefined && urlState.of !== 0) params.set('of', urlState.of.toString());
  if (urlState.cl !== undefined && urlState.cl !== 1) params.set('cl', urlState.cl.toString());
  if (urlState.eq !== undefined && urlState.eq !== 0) params.set('eq', urlState.eq.toString());
  
  // Schedule params (always include if present)
  if (urlState.d) params.set('d', urlState.d);
  if (urlState.t) params.set('t', urlState.t);
  if (urlState.f && urlState.f !== 'ot') params.set('f', urlState.f);
  if (urlState.rd) params.set('rd', urlState.rd);
  if (urlState.rt) params.set('rt', urlState.rt);
  
  // Cleaner params
  if (urlState.clid) params.set('clid', urlState.clid);
  
  const searchString = params.toString();
  return searchString ? `?${searchString}` : '';
}
