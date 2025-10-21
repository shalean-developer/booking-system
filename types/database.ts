// Supabase Database Schema Types
// Generated for TypeScript type safety

export interface Database {
  public: {
    Tables: {
      bookings: {
        Row: {
          id: string;
          customer_id: string | null;
          cleaner_id: string | null; // UUID
          service_type: string | null;
          booking_date: string;
          booking_time: string;
          bedrooms: number | null;
          bathrooms: number | null;
          extras: string[] | null;
          notes: string | null;
          frequency: string | null;
          customer_name: string | null;
          customer_email: string | null;
          customer_phone: string | null;
          address_line1: string | null;
          address_suburb: string | null;
          address_city: string | null;
          total_amount: number | null;
          cleaner_earnings: number | null;
          status: string;
          cleaner_claimed_at: string | null;
          cleaner_accepted_at: string | null;
          cleaner_on_my_way_at: string | null;
          cleaner_started_at: string | null;
          cleaner_completed_at: string | null;
          customer_rating_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          cleaner_id?: string | null; // UUID
          service_type?: string | null;
          booking_date: string;
          booking_time: string;
          bedrooms?: number | null;
          bathrooms?: number | null;
          extras?: string[] | null;
          notes?: string | null;
          frequency?: string | null;
          customer_name?: string | null;
          customer_email?: string | null;
          customer_phone?: string | null;
          address_line1?: string | null;
          address_suburb?: string | null;
          address_city?: string | null;
          total_amount?: number | null;
          cleaner_earnings?: number | null;
          status?: string;
          cleaner_claimed_at?: string | null;
          cleaner_accepted_at?: string | null;
          cleaner_on_my_way_at?: string | null;
          cleaner_started_at?: string | null;
          cleaner_completed_at?: string | null;
          customer_rating_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          cleaner_id?: string | null; // UUID
          service_type?: string | null;
          booking_date?: string;
          booking_time?: string;
          bedrooms?: number | null;
          bathrooms?: number | null;
          extras?: string[] | null;
          notes?: string | null;
          frequency?: string | null;
          customer_name?: string | null;
          customer_email?: string | null;
          customer_phone?: string | null;
          address_line1?: string | null;
          address_suburb?: string | null;
          address_city?: string | null;
          total_amount?: number | null;
          cleaner_earnings?: number | null;
          status?: string;
          cleaner_claimed_at?: string | null;
          cleaner_accepted_at?: string | null;
          cleaner_on_my_way_at?: string | null;
          cleaner_started_at?: string | null;
          cleaner_completed_at?: string | null;
          customer_rating_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      cleaners: {
        Row: {
          id: string; // UUID
          name: string;
          phone: string;
          photo_url: string | null;
          areas: string[];
          rating: number;
          is_active: boolean;
          is_available: boolean;
          available_monday: boolean | null;
          available_tuesday: boolean | null;
          available_wednesday: boolean | null;
          available_thursday: boolean | null;
          available_friday: boolean | null;
          available_saturday: boolean | null;
          available_sunday: boolean | null;
          password_hash: string | null;
          auth_provider: string | null;
          last_location_lat: number | null;
          last_location_lng: number | null;
          last_location_updated: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string; // UUID
          name: string;
          phone: string;
          photo_url?: string | null;
          areas: string[];
          rating?: number;
          is_active?: boolean;
          is_available?: boolean;
          available_monday?: boolean | null;
          available_tuesday?: boolean | null;
          available_wednesday?: boolean | null;
          available_thursday?: boolean | null;
          available_friday?: boolean | null;
          available_saturday?: boolean | null;
          available_sunday?: boolean | null;
          password_hash?: string | null;
          auth_provider?: string | null;
          last_location_lat?: number | null;
          last_location_lng?: number | null;
          last_location_updated?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string; // UUID
          name?: string;
          phone?: string;
          photo_url?: string | null;
          areas?: string[];
          rating?: number;
          is_active?: boolean;
          is_available?: boolean;
          available_monday?: boolean | null;
          available_tuesday?: boolean | null;
          available_wednesday?: boolean | null;
          available_thursday?: boolean | null;
          available_friday?: boolean | null;
          available_saturday?: boolean | null;
          available_sunday?: boolean | null;
          password_hash?: string | null;
          auth_provider?: string | null;
          last_location_lat?: number | null;
          last_location_lng?: number | null;
          last_location_updated?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      customer_ratings: {
        Row: {
          id: string; // UUID
          cleaner_id: string; // UUID
          booking_id: string;
          customer_phone: string | null;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string; // UUID
          cleaner_id: string; // UUID
          booking_id: string;
          customer_phone?: string | null;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string; // UUID
          cleaner_id?: string; // UUID
          booking_id?: string;
          customer_phone?: string | null;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
