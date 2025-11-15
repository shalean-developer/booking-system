import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * Cleaners API
 * GET: Fetch cleaner by ID
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Cleaner ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 [API] Fetching cleaner with ID:', id);
    
    const { data: cleaner, error } = await supabase
      .from('cleaners')
      .select('id, name, photo_url, rating')
      .eq('id', id)
      .maybeSingle();

    console.log('🔍 [API] Query result:', { 
      hasCleaner: !!cleaner, 
      error: error?.message,
      cleaner: cleaner ? { id: cleaner.id, name: cleaner.name } : null
    });

    if (error) {
      console.error('❌ [API] Error fetching cleaner:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch cleaner', details: error.message },
        { status: 500 }
      );
    }

    if (!cleaner) {
      console.log('⚠️ [API] Cleaner not found for ID:', id);
      return NextResponse.json(
        { ok: false, error: 'Cleaner not found' },
        { status: 404 }
      );
    }

    // Ensure rating is a number
    const cleanerWithRating = {
      ...cleaner,
      rating: cleaner.rating || 0,
    };

    console.log('✅ [API] Returning cleaner:', { 
      id: cleanerWithRating.id, 
      name: cleanerWithRating.name,
      hasPhoto: !!cleanerWithRating.photo_url,
      rating: cleanerWithRating.rating
    });

    return NextResponse.json({
      ok: true,
      cleaner: cleanerWithRating,
    });
  } catch (error) {
    console.error('Error in cleaners API:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
