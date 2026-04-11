import { NextRequest, NextResponse } from 'next/server';
import { getAvailableCleaners } from '@/lib/supabase';
import type { AvailableCleanersResponse } from '@/types/booking';

export async function GET(req: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.warn('Supabase not configured, returning empty cleaners list');
      return NextResponse.json({
        ok: true,
        cleaners: [],
        message: 'Supabase not configured'
      });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date')?.trim();
    const city = searchParams.get('city')?.trim() ?? '';
    const suburb = searchParams.get('suburb')?.trim() ?? '';
    const time = searchParams.get('time')?.trim() ?? '';

    if (!date || (!city && !suburb)) {
      return NextResponse.json(
        { ok: false, error: 'Date and city or suburb are required' },
        { status: 400 }
      );
    }

    const areas = [...new Set([suburb, city].filter(Boolean))];

    console.log('=== FETCHING AVAILABLE CLEANERS ===');
    console.log('Date:', date);
    console.log('Areas (union):', areas);
    console.log('Time (slot filter):', time || '(none)');

    const cleaners = await getAvailableCleaners(date, {
      areas,
      bookingTime: time || null,
    });

    console.log(`Found ${cleaners.length} available cleaners`);

    const response: AvailableCleanersResponse = {
      ok: true,
      cleaners,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching available cleaners:', error);
    
    const response: AvailableCleanersResponse = {
      ok: false,
      cleaners: [],
      error: 'Failed to fetch available cleaners',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
