import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, createCleanerSupabaseClient, cleanerIdToUuid } from '@/lib/cleaner-auth';
import { createServiceClient } from '@/lib/supabase-server';
import { checkBookingAvailability } from '@/lib/availability-check';

/**
 * Calculate distance between two coordinates (Haversine formula)
 * Returns distance in kilometers
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateFilter = searchParams.get('date');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const maxDistance = parseInt(searchParams.get('maxDistance') || '50'); // km

    const supabase = await createCleanerSupabaseClient();
    const serviceSupabase = createServiceClient();
    const cleanerId = cleanerIdToUuid(session.id);

    // Get cleaner details for area matching
    const { data: cleaner } = await supabase
      .from('cleaners')
      .select('areas, last_location_lat, last_location_lng')
      .eq('id', session.id)
      .single();

    // Get availability preferences
    const { data: preferences } = await serviceSupabase
      .from('cleaner_availability_preferences')
      .select('*')
      .eq('cleaner_id', cleanerId)
      .maybeSingle();

    if (!cleaner) {
      return NextResponse.json(
        { ok: false, error: 'Cleaner not found' },
        { status: 404 }
      );
    }

    // Build query for available bookings with recurring schedule information
    // Exclude team bookings (requires_team = true) since they're assigned by admin
    let query = supabase
      .from('bookings')
      .select(`
        *,
        recurring_schedule:recurring_schedules(
          id,
          frequency,
          day_of_week,
          day_of_month,
          preferred_time,
          is_active,
          start_date,
          end_date
        )
      `)
      .is('cleaner_id', null)
      .eq('status', 'pending')
      .eq('requires_team', false) // Exclude team bookings - they're admin assigned
      .order('booking_date', { ascending: true })
      .order('booking_time', { ascending: true });

    // Apply date filter
    if (dateFilter) {
      query = query.gte('booking_date', dateFilter);
    } else {
      // Default: only future bookings
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('booking_date', today);
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching available bookings:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    // Filter by areas and calculate distances
    let filteredBookings = (bookings || []).filter((booking) => {
      // Check if booking is in cleaner's service areas
      const bookingCity = booking.address_city || '';
      const bookingSuburb = booking.address_suburb || '';
      
      return cleaner.areas.some((area: string) => {
        const areaLower = area.toLowerCase();
        return (
          bookingCity.toLowerCase().includes(areaLower) ||
          bookingSuburb.toLowerCase().includes(areaLower)
        );
      });
    });

    // Calculate distances if location provided
    const cleanerLat = lat ? parseFloat(lat) : cleaner.last_location_lat;
    const cleanerLng = lng ? parseFloat(lng) : cleaner.last_location_lng;

    if (cleanerLat && cleanerLng) {
      filteredBookings = filteredBookings.map((booking) => {
        // For now, we don't have exact booking coordinates
        // In a real app, you'd geocode the address or store coordinates
        // For now, just mark all as within range
        return {
          ...booking,
          distance: null, // Would be calculated with real coordinates
        };
      });

      // If we had real coordinates, we'd filter by distance:
      // filteredBookings = filteredBookings.filter(b => b.distance <= maxDistance);
    }

    // Filter by availability preferences if enabled
    if (preferences && (preferences.auto_decline_outside_availability || preferences.auto_decline_below_min_value)) {
      filteredBookings = filteredBookings.filter((booking: any) => {
        const result = checkBookingAvailability(preferences, {
          booking_date: booking.booking_date,
          booking_time: booking.booking_time,
          service_type: booking.service_type,
          total_amount: booking.total_amount || 0,
          distance_km: booking.distance || null,
        });
        return result.allowed;
      });
    }

    return NextResponse.json({
      ok: true,
      bookings: filteredBookings,
    });
  } catch (error) {
    console.error('Error in available bookings route:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

