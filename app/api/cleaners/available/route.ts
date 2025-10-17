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
    const date = searchParams.get('date');
    const city = searchParams.get('city');

    if (!date || !city) {
      return NextResponse.json(
        { ok: false, error: 'Date and city are required' },
        { status: 400 }
      );
    }

    console.log('=== FETCHING AVAILABLE CLEANERS ===');
    console.log('Date:', date);
    console.log('City:', city);

    const cleaners = await getAvailableCleaners(date, city);

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
