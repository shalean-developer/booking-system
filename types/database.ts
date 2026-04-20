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
          assigned_cleaner_id: string | null;
          /** All cleaners assigned to this booking (same slot). */
          assigned_cleaners: string[] | null;
          service_type: string | null;
          booking_date: string;
          booking_time: string;
          start_time: string | null;
          end_time: string | null;
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
          latitude: number | null;
          longitude: number | null;
          total_amount: number | null;
          cleaner_earnings: number | null;
          earnings_status: string | null;
          earnings_calculated: number | null;
          earnings_final: number | null;
          earnings_reviewed_by: string | null;
          earnings_reviewed_at: string | null;
          total_hours: number | null;
          team_size: number | null;
          hours_per_cleaner: number | null;
          hourly_rate_used: number | null;
          equipment_cost: number;
          extra_cleaner_fee: number;
          company_profit_cents: number | null;
          earnings_breakdown: Record<string, unknown> | null;
          tip_amount: number | null;
          service_fee: number | null;
          status: string;
          cleaner_claimed_at: string | null;
          cleaner_accepted_at: string | null;
          cleaner_on_my_way_at: string | null;
          cleaner_started_at: string | null;
          cleaner_completed_at: string | null;
          accepted_at: string | null;
          on_my_way_at: string | null;
          started_at: string | null;
          completed_at: string | null;
          sla_status: string | null;
          sla_delay_customer_notified_at: string | null;
          sla_admin_notified_at: string | null;
          sla_severity: string | null;
          reassigned_at: string | null;
          reassignment_count: number | null;
          expected_end_time: string | null;
          duration_minutes: number | null;
          customer_rating_id: string | null;
          user_id: string | null;
          price: number | null;
          paystack_ref: string | null;
          zoho_invoice_id: string | null;
          payment_status: string | null;
          dispatch_review_required: boolean;
          payout_status: string | null;
          paid_amount_minor: number | null;
          paid_currency: string | null;
          paystack_verified_at: string | null;
          tracking_status: string | null;
          cleaner_locations: Record<string, unknown> | null;
          /** PostGIS geography(Point,4326). */
          location: unknown | null;
          /** Suburb/area label for coverage matching. */
          area: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          cleaner_id?: string | null; // UUID
          assigned_cleaner_id?: string | null;
          assigned_cleaners?: string[] | null;
          service_type?: string | null;
          booking_date: string;
          booking_time: string;
          start_time?: string | null;
          end_time?: string | null;
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
          latitude?: number | null;
          longitude?: number | null;
          total_amount?: number | null;
          cleaner_earnings?: number | null;
          earnings_status?: string | null;
          earnings_calculated?: number | null;
          earnings_final?: number | null;
          earnings_reviewed_by?: string | null;
          earnings_reviewed_at?: string | null;
          total_hours?: number | null;
          team_size?: number | null;
          hours_per_cleaner?: number | null;
          hourly_rate_used?: number | null;
          equipment_cost?: number;
          extra_cleaner_fee?: number;
          company_profit_cents?: number | null;
          earnings_breakdown?: Record<string, unknown> | null;
          tip_amount?: number | null;
          service_fee?: number | null;
          status?: string;
          cleaner_claimed_at?: string | null;
          cleaner_accepted_at?: string | null;
          cleaner_on_my_way_at?: string | null;
          cleaner_started_at?: string | null;
          cleaner_completed_at?: string | null;
          accepted_at?: string | null;
          on_my_way_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          sla_status?: string | null;
          sla_delay_customer_notified_at?: string | null;
          sla_admin_notified_at?: string | null;
          sla_severity?: string | null;
          reassigned_at?: string | null;
          reassignment_count?: number | null;
          expected_end_time?: string | null;
          duration_minutes?: number | null;
          customer_rating_id?: string | null;
          user_id?: string | null;
          price?: number | null;
          paystack_ref?: string | null;
          zoho_invoice_id?: string | null;
          payment_status?: string | null;
          dispatch_review_required?: boolean;
          payout_status?: string | null;
          paid_amount_minor?: number | null;
          paid_currency?: string | null;
          paystack_verified_at?: string | null;
          tracking_status?: string | null;
          cleaner_locations?: Record<string, unknown> | null;
          location?: unknown;
          area?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          cleaner_id?: string | null; // UUID
          assigned_cleaner_id?: string | null;
          assigned_cleaners?: string[] | null;
          service_type?: string | null;
          booking_date?: string;
          booking_time?: string;
          start_time?: string | null;
          end_time?: string | null;
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
          latitude?: number | null;
          longitude?: number | null;
          total_amount?: number | null;
          cleaner_earnings?: number | null;
          earnings_status?: string | null;
          earnings_calculated?: number | null;
          earnings_final?: number | null;
          earnings_reviewed_by?: string | null;
          earnings_reviewed_at?: string | null;
          total_hours?: number | null;
          team_size?: number | null;
          hours_per_cleaner?: number | null;
          hourly_rate_used?: number | null;
          equipment_cost?: number;
          extra_cleaner_fee?: number;
          company_profit_cents?: number | null;
          earnings_breakdown?: Record<string, unknown> | null;
          tip_amount?: number | null;
          service_fee?: number | null;
          status?: string;
          cleaner_claimed_at?: string | null;
          cleaner_accepted_at?: string | null;
          cleaner_on_my_way_at?: string | null;
          cleaner_started_at?: string | null;
          cleaner_completed_at?: string | null;
          accepted_at?: string | null;
          on_my_way_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          sla_status?: string | null;
          sla_delay_customer_notified_at?: string | null;
          sla_admin_notified_at?: string | null;
          sla_severity?: string | null;
          reassigned_at?: string | null;
          reassignment_count?: number | null;
          expected_end_time?: string | null;
          duration_minutes?: number | null;
          customer_rating_id?: string | null;
          user_id?: string | null;
          price?: number | null;
          paystack_ref?: string | null;
          zoho_invoice_id?: string | null;
          payment_status?: string | null;
          dispatch_review_required?: boolean;
          payout_status?: string | null;
          paid_amount_minor?: number | null;
          paid_currency?: string | null;
          paystack_verified_at?: string | null;
          tracking_status?: string | null;
          cleaner_locations?: Record<string, unknown> | null;
          location?: unknown;
          area?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cleaners: {
        Row: {
          id: string; // UUID
          name: string;
          phone: string;
          photo_url: string | null;
          areas: string[];
          /** Named suburbs; empty means fall back to `areas`. */
          working_areas: string[];
          coverage_radius_km: number;
          base_location?: unknown;
          base_latitude?: number | null;
          base_longitude?: number | null;
          bio: string | null;
          years_experience: number | null;
          specialties: string[] | null;
          email: string | null;
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
          completion_rate: number | null;
          payout_schedule?: string | null;
          payout_day?: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string; // UUID
          name: string;
          phone: string;
          photo_url?: string | null;
          areas: string[];
          working_areas?: string[];
          coverage_radius_km?: number;
          base_location?: unknown;
          base_latitude?: number | null;
          base_longitude?: number | null;
          bio?: string | null;
          years_experience?: number | null;
          specialties?: string[] | null;
          email?: string | null;
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
          completion_rate?: number | null;
          payout_schedule?: string | null;
          payout_day?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string; // UUID
          name?: string;
          phone?: string;
          photo_url?: string | null;
          areas?: string[];
          working_areas?: string[];
          coverage_radius_km?: number;
          base_location?: unknown;
          base_latitude?: number | null;
          base_longitude?: number | null;
          bio?: string | null;
          years_experience?: number | null;
          specialties?: string[] | null;
          email?: string | null;
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
          completion_rate?: number | null;
          payout_schedule?: string | null;
          payout_day?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      cleaner_wallets: {
        Row: {
          id: string;
          cleaner_id: string;
          balance: number;
          pending_balance: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cleaner_id: string;
          balance?: number;
          pending_balance?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cleaner_id?: string;
          balance?: number;
          pending_balance?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      wallet_transactions: {
        Row: {
          id: string;
          cleaner_id: string;
          booking_id: string | null;
          amount: number;
          type: string;
          status: string;
          paystack_reference: string | null;
          meta: Record<string, unknown> | null;
          available_for_payout_at: string | null;
          idempotency_key: string | null;
          payout_batch_id: string | null;
          retry_count: number;
          next_retry_at: string | null;
          processing_started_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cleaner_id: string;
          booking_id?: string | null;
          amount: number;
          type: string;
          status: string;
          paystack_reference?: string | null;
          meta?: Record<string, unknown> | null;
          available_for_payout_at?: string | null;
          idempotency_key?: string | null;
          payout_batch_id?: string | null;
          retry_count?: number;
          next_retry_at?: string | null;
          processing_started_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cleaner_id?: string;
          booking_id?: string | null;
          amount?: number;
          type?: string;
          status?: string;
          paystack_reference?: string | null;
          meta?: Record<string, unknown> | null;
          available_for_payout_at?: string | null;
          idempotency_key?: string | null;
          payout_batch_id?: string | null;
          retry_count?: number;
          next_retry_at?: string | null;
          processing_started_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payout_event_logs: {
        Row: {
          id: string;
          event_type: string;
          cleaner_id: string | null;
          wallet_transaction_id: string | null;
          idempotency_key: string | null;
          payload: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          cleaner_id?: string | null;
          wallet_transaction_id?: string | null;
          idempotency_key?: string | null;
          payload?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          cleaner_id?: string | null;
          wallet_transaction_id?: string | null;
          idempotency_key?: string | null;
          payload?: Record<string, unknown> | null;
          created_at?: string;
        };
        Relationships: [];
      };
      payout_recipients: {
        Row: {
          id: string;
          cleaner_id: string;
          recipient_code: string;
          bank_name: string | null;
          account_number: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          cleaner_id: string;
          recipient_code: string;
          bank_name?: string | null;
          account_number?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          cleaner_id?: string;
          recipient_code?: string;
          bank_name?: string | null;
          account_number?: string | null;
          created_at?: string;
        };
        Relationships: [];
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
        Relationships: [];
      };
      payment_validation_failure_counters: {
        Row: {
          payment_reference: string;
          failure_count: number;
          last_failure_type: string | null;
          updated_at: string;
        };
        Insert: {
          payment_reference: string;
          failure_count?: number;
          last_failure_type?: string | null;
          updated_at?: string;
        };
        Update: {
          payment_reference?: string;
          failure_count?: number;
          last_failure_type?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      growth_events: {
        Row: {
          id: string;
          event_type: string;
          properties: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: string;
          properties?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: string;
          properties?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      v_cleaner_liability_outstanding: {
        Row: {
          total_cents: number;
          wallet_row_count: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      initiate_payout_processing: {
        Args: {
          p_cleaner_id: string;
          p_amount: number;
          p_idempotency_key: string;
          p_payout_batch_id?: string | null;
        };
        Returns: Array<{ wallet_tx_id: string; is_duplicate: boolean }>;
      };
      complete_payout_from_webhook: {
        Args: { p_idempotency_key: string; p_paystack_reference: string | null };
        Returns: string | null;
      };
      fail_payout_from_webhook: {
        Args: {
          p_idempotency_key: string;
          p_error_message: string;
          p_max_retries: number;
          p_retry_delay_seconds: number;
        };
        Returns: boolean | null;
      };
      fail_payout_processing: {
        Args: {
          p_wallet_tx_id: string;
          p_error_message: string;
          p_max_retries: number;
          p_retry_delay_seconds: number;
        };
        Returns: boolean | null;
      };
      recover_stale_processing_payouts: {
        Args: { p_max_age_hours: number };
        Returns: number;
      };
      get_eligible_payout_cents: {
        Args: { p_cleaner_id: string };
        Returns: number;
      };
      cleaner_has_refunded_booking_with_earning: {
        Args: { p_cleaner_id: string };
        Returns: boolean;
      };
      apply_wallet_earning: {
        Args: {
          cleaner_id_input: string;
          booking_id_input: string;
          amount_input: number;
          credit_pending?: boolean;
          available_for_payout_at_input?: string | null;
        };
        Returns: string | null;
      };
      release_pending_wallet_earnings_for_booking: {
        Args: { p_booking_id: string };
        Returns: number;
      };
      increment_wallet_balance: {
        Args: { cleaner_id_input: string; amount_input: number };
        Returns: undefined;
      };
      log_payout_event: {
        Args: {
          p_event_type: string;
          p_cleaner_id: string | null;
          p_wallet_transaction_id: string | null;
          p_idempotency_key: string | null;
          p_payload: Record<string, unknown> | null;
        };
        Returns: string | null;
      };
      record_payment_validation_failure: {
        Args: { p_reference: string; p_failure_type: string };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
