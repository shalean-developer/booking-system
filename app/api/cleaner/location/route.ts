import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, createCleanerSupabaseClient } from '@/lib/cleaner-auth';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { latitude, longitude } = body;

    // Validate coordinates
    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number' ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { ok: false, error: 'Invalid coordinates' },
        { status: 400 }
      );
    }

    const supabase = await createCleanerSupabaseClient();

    // Update cleaner location
    const { error } = await supabase
      .from('cleaners')
      .update({
        last_location_lat: latitude,
        last_location_lng: longitude,
        last_location_updated: new Date().toISOString(),
      })
      .eq('id', session.id);

    if (error) {
      console.error('Error updating location:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to update location' },
        { status: 500 }
      );
    }

    console.log('📍 Location updated for', session.name, ':', latitude, longitude);

    return NextResponse.json({
      ok: true,
      message: 'Location updated successfully',
    });
  } catch (error) {
    console.error('Error in location update route:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check authentication
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createCleanerSupabaseClient();

    // Get cleaner's current location
    const { data: cleaner, error } = await supabase
      .from('cleaners')
      .select('last_location_lat, last_location_lng, last_location_updated')
      .eq('id', session.id)
      .single();

    if (error || !cleaner) {
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch location' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      location: {
        latitude: cleaner.last_location_lat,
        longitude: cleaner.last_location_lng,
        updated_at: cleaner.last_location_updated,
      },
    });
  } catch (error) {
    console.error('Error in get location route:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

