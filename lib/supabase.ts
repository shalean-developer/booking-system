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

// Helper function to get available cleaners
export async function getAvailableCleaners(date: string, city: string) {
  try {
    // Get cleaners in the area
    const { data: cleaners, error: cleanersError } = await supabase
      .from('cleaners')
      .select('*')
      .contains('areas', [city])
      .eq('is_active', true)

    if (cleanersError) {
      console.error('Error fetching cleaners:', cleanersError)
      return []
    }

    // Get bookings for the date
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('cleaner_id')
      .eq('booking_date', date)

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
      return cleaners || []
    }

    // Filter out booked cleaners
    const bookedCleanerIds = bookings?.map(b => b.cleaner_id) || []
    const available = cleaners?.filter(c => !bookedCleanerIds.includes(c.id)) || []

    return available
  } catch (error) {
    console.error('Error in getAvailableCleaners:', error)
    return []
  }
}
