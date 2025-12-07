import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * API endpoint to fetch cleaner details by ID
 * Requires authentication
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = await createClient();
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Fetch cleaner details
    const { data: cleaner, error: cleanerError } = await supabase
      .from('cleaners')
      .select('id, name, photo_url, rating')
      .eq('id', id)
      .maybeSingle();

    if (cleanerError) {
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch cleaner details' },
        { status: 500 }
      );
    }

    if (!cleaner) {
      return NextResponse.json(
        { ok: false, error: 'Cleaner not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      cleaner: {
        id: cleaner.id,
        name: cleaner.name,
        photoUrl: cleaner.photo_url,
        rating: cleaner.rating,
      },
    });

  } catch (error) {
    console.error('Error in cleaners/[id] route:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
