import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types for type safety
export interface Database {
  public: {
    Tables: {
      cleaners: {
        Row: {
          id: string
          name: string
          photo_url: string | null
          rating: number
          areas: string[]
          bio: string | null
          years_experience: number | null
          specialties: string[] | null
          phone: string | null
          email: string | null
          is_active: boolean
          created_at: string
          updated_at: string
          password_hash: string | null
          auth_provider: string
          is_available: boolean
          last_location_lat: number | null
          last_location_lng: number | null
          last_location_updated: string | null
          completion_rate: number | null
          otp_code: string | null
          otp_expires_at: string | null
          otp_attempts: number
          otp_last_sent: string | null
        }
        Insert: {
          id?: string
          name: string
          photo_url?: string | null
          rating?: number
          areas: string[]
          bio?: string | null
          years_experience?: number | null
          specialties?: string[] | null
          phone?: string | null
          email?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          password_hash?: string | null
          auth_provider?: string
          is_available?: boolean
          last_location_lat?: number | null
          last_location_lng?: number | null
          last_location_updated?: string | null
          completion_rate?: number | null
          otp_code?: string | null
          otp_expires_at?: string | null
          otp_attempts?: number
          otp_last_sent?: string | null
        }
        Update: {
          id?: string
          name?: string
          photo_url?: string | null
          rating?: number
          areas?: string[]
          bio?: string | null
          years_experience?: number | null
          specialties?: string[] | null
          phone?: string | null
          email?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
          password_hash?: string | null
          auth_provider?: string
          is_available?: boolean
          last_location_lat?: number | null
          last_location_lng?: number | null
          last_location_updated?: string | null
          completion_rate?: number | null
          otp_code?: string | null
          otp_expires_at?: string | null
          otp_attempts?: number
          otp_last_sent?: string | null
        }
      }
      bookings: {
        Row: {
          id: string  // TEXT primary key (BK-... format)
          cleaner_id: string | null  // TEXT - can be 'manual' or UUID string
          booking_date: string
          booking_time: string
          service_type: string | null
          customer_name: string | null
          customer_email: string | null
          customer_phone: string | null
          address_line1: string | null
          address_suburb: string | null
          address_city: string | null
          payment_reference: string | null
          total_amount: number | null  // Total booking price in cents
          status: string
          created_at: string
          customer_id: string | null  // Links to customer profile
          cleaner_claimed_at: string | null
          cleaner_started_at: string | null
          cleaner_completed_at: string | null
          customer_rating_id: string | null
          customer_reviewed: boolean
          customer_review_id: string | null
        }
        Insert: {
          id: string  // Required TEXT ID (BK-... format)
          cleaner_id?: string | null  // Optional TEXT - can be 'manual' or UUID string
          booking_date: string
          booking_time: string
          service_type?: string | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          address_line1?: string | null
          address_suburb?: string | null
          address_city?: string | null
          payment_reference?: string | null
          total_amount?: number | null  // Total booking price in cents
          status?: string
          created_at?: string
          customer_id?: string | null  // Links to customer profile
          cleaner_claimed_at?: string | null
          cleaner_started_at?: string | null
          cleaner_completed_at?: string | null
          customer_rating_id?: string | null
          customer_reviewed?: boolean
          customer_review_id?: string | null
        }
        Update: {
          id?: string
          cleaner_id?: string | null
          booking_date?: string
          booking_time?: string
          service_type?: string | null
          customer_name?: string | null
          customer_email?: string | null
          customer_phone?: string | null
          address_line1?: string | null
          address_suburb?: string | null
          address_city?: string | null
          payment_reference?: string | null
          total_amount?: number | null  // Total booking price in cents
          status?: string
          created_at?: string
          customer_id?: string | null  // Links to customer profile
          cleaner_claimed_at?: string | null
          cleaner_started_at?: string | null
          cleaner_completed_at?: string | null
          customer_rating_id?: string | null
          customer_reviewed?: boolean
          customer_review_id?: string | null
        }
      }
      customer_ratings: {
        Row: {
          id: string
          cleaner_id: string
          booking_id: string
          customer_phone: string | null
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          cleaner_id: string
          booking_id: string
          customer_phone?: string | null
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          cleaner_id?: string
          booking_id?: string
          customer_phone?: string | null
          rating?: number
          comment?: string | null
          created_at?: string
        }
      }
      cleaner_reviews: {
        Row: {
          id: string
          booking_id: string
          cleaner_id: string
          customer_id: string
          overall_rating: number
          quality_rating: number
          punctuality_rating: number
          professionalism_rating: number
          review_text: string | null
          photos: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          cleaner_id: string
          customer_id: string
          overall_rating: number
          quality_rating: number
          punctuality_rating: number
          professionalism_rating: number
          review_text?: string | null
          photos?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          cleaner_id?: string
          customer_id?: string
          overall_rating?: number
          quality_rating?: number
          punctuality_rating?: number
          professionalism_rating?: number
          review_text?: string | null
          photos?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      quotes: {
        Row: {
          id: string  // TEXT primary key (QT-... format)
          service_type: string
          bedrooms: number
          bathrooms: number
          extras: string[]
          first_name: string
          last_name: string
          email: string
          phone: string
          location: string | null
          status: string
          estimated_price: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string  // Required TEXT ID (QT-... format)
          service_type: string
          bedrooms?: number
          bathrooms?: number
          extras?: string[]
          first_name: string
          last_name: string
          email: string
          phone: string
          location?: string | null
          status?: string
          estimated_price?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_type?: string
          bedrooms?: number
          bathrooms?: number
          extras?: string[]
          first_name?: string
          last_name?: string
          email?: string
          phone?: string
          location?: string | null
          status?: string
          estimated_price?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

/** Normalize "9:00", "09:00:00" to HH:MM for comparison */
function normalizeTimeHm(value: string): string {
  const m = String(value).trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return String(value).trim();
  const h = Math.min(23, Math.max(0, parseInt(m[1], 10)));
  const min = Math.min(59, Math.max(0, parseInt(m[2], 10)));
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function timeSlotConflictsWithBooking(slotRaw: unknown, bookingTime: string): boolean {
  if (slotRaw == null) return false;
  return normalizeTimeHm(String(slotRaw)) === normalizeTimeHm(bookingTime);
}

export type GetAvailableCleanersOptions = {
  /** Match cleaners whose `areas` contains any of these strings (union, deduped). */
  areas: string[];
  /**
   * When set, exclude cleaners who already have a `cleaner_time_slots` row for this date+time.
   * When omitted, do not exclude based on slots (avoid empty lists before a time is chosen).
   */
  bookingTime?: string | null;
};

const MAX_AVAILABLE_CLEANERS = 8;

// Helper function to get available cleaners
export async function getAvailableCleaners(date: string, options: GetAvailableCleanersOptions) {
  try {
    const areaList = [...new Set(options.areas.map((a) => a.trim()).filter(Boolean))];
    if (areaList.length === 0) {
      return [];
    }

    // Determine day of week from date
    const dateObj = new Date(date + 'T00:00:00'); // Force consistent parsing
    const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayColumns = [
      'available_sunday',
      'available_monday',
      'available_tuesday',
      'available_wednesday',
      'available_thursday',
      'available_friday',
      'available_saturday'
    ];
    const dayColumn = dayColumns[dayOfWeek];

    console.log(`🗓️ Fetching cleaners for ${date} (${dayColumns[dayOfWeek]}) in areas: ${areaList.join(', ')}`);

    const cleanerById = new Map<string, Database['public']['Tables']['cleaners']['Row']>();

    for (const area of areaList) {
      const { data: batch, error: cleanersError } = await supabase
        .from('cleaners')
        .select('*')
        .contains('areas', [area])
        .eq('is_active', true)
        .eq('is_available', true)
        .eq(dayColumn, true);

      if (cleanersError) {
        console.error('Error fetching cleaners:', cleanersError);
        continue;
      }
      for (const c of batch || []) {
        cleanerById.set(c.id, c);
      }
    }

    const cleaners = Array.from(cleanerById.values());
    console.log(`✅ Found ${cleaners.length} cleaners (union by area) on ${dayColumn}`);

    const { data: bookedSlots, error: slotsError } = await supabase
      .from('cleaner_time_slots')
      .select('cleaner_id, time_slot')
      .eq('date', date)
      .eq('status', 'booked');

    if (slotsError) {
      console.error('Error fetching time slots:', slotsError);
      return cleaners;
    }

    const bookingTime = options.bookingTime?.trim() || '';
    let unavailableIds: Set<string>;

    if (bookingTime) {
      const conflicting = (bookedSlots || []).filter((slot) =>
        timeSlotConflictsWithBooking(slot.time_slot, bookingTime)
      );
      unavailableIds = new Set(conflicting.map((s) => s.cleaner_id));
      console.log(
        `🚫 ${unavailableIds.size} cleaners already booked at ${bookingTime} on ${date}`
      );
    } else {
      unavailableIds = new Set();
      console.log(`🚫 Skipping slot filter (no booking time) — ${bookedSlots?.length || 0} booked rows ignored`);
    }

    let availableCleaners = cleaners.filter((c) => !unavailableIds.has(c.id));

    console.log(`📋 ${availableCleaners.length} cleaners after slot filter`);

    // Prefer higher rating, completion rate, and experience — do not hard-drop low ratings
    // (avoids empty UI when DB has new cleaners or thin metrics)
    availableCleaners.sort((a, b) => {
      const ratingA = a.rating ?? 0;
      const ratingB = b.rating ?? 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
      const relA = a.completion_rate ?? 0;
      const relB = b.completion_rate ?? 0;
      if (relB !== relA) return relB - relA;
      const expA = a.years_experience ?? 0;
      const expB = b.years_experience ?? 0;
      return expB - expA;
    });

    const topCleaners = availableCleaners.slice(0, MAX_AVAILABLE_CLEANERS);
    console.log(`📋 Returning top ${topCleaners.length} cleaners (max ${MAX_AVAILABLE_CLEANERS})`);

    return topCleaners;
  } catch (error) {
    console.error('Error in getAvailableCleaners:', error);
    return [];
  }
}
