import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * API endpoint for managing favorite cleaners
 * GET: Fetch user's favorite cleaners
 * POST: Add a cleaner to favorites
 * DELETE: Remove a cleaner from favorites
 */

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = await createClient();
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find customer profile
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (customerError || !customer) {
      return NextResponse.json(
        { ok: false, error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    // Get favorites with cleaner details using the view
    const { data: favorites, error: favoritesError } = await supabase
      .from('favorite_cleaners_view')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });

    if (favoritesError) {
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch favorites' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      favorites: favorites || [],
    });
  } catch (error) {
    console.error('Error fetching favorite cleaners:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = await createClient();
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find customer profile
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (customerError || !customer) {
      return NextResponse.json(
        { ok: false, error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { cleaner_id } = body;

    if (!cleaner_id || typeof cleaner_id !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'cleaner_id is required' },
        { status: 400 }
      );
    }

    // Verify cleaner exists and is active
    const { data: cleaner, error: cleanerError } = await supabase
      .from('cleaners')
      .select('id, name, is_active')
      .eq('id', cleaner_id)
      .maybeSingle();

    if (cleanerError || !cleaner) {
      return NextResponse.json(
        { ok: false, error: 'Cleaner not found' },
        { status: 404 }
      );
    }

    if (!cleaner.is_active) {
      return NextResponse.json(
        { ok: false, error: 'Cannot favorite inactive cleaner' },
        { status: 400 }
      );
    }

    // Check if already favorited
    const { data: existing } = await supabase
      .from('favorite_cleaners')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('cleaner_id', cleaner_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { ok: false, error: 'Cleaner is already in favorites' },
        { status: 400 }
      );
    }

    // Add to favorites
    const { data: favorite, error: insertError } = await supabase
      .from('favorite_cleaners')
      .insert({
        customer_id: customer.id,
        cleaner_id: cleaner_id,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: 'Failed to add favorite' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      favorite,
    });
  } catch (error) {
    console.error('Error adding favorite cleaner:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = await createClient();
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find customer profile
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (customerError || !customer) {
      return NextResponse.json(
        { ok: false, error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    const url = new URL(request.url);
    const cleaner_id = url.searchParams.get('cleaner_id');

    if (!cleaner_id) {
      return NextResponse.json(
        { ok: false, error: 'cleaner_id query parameter is required' },
        { status: 400 }
      );
    }

    // Remove from favorites
    const { error: deleteError } = await supabase
      .from('favorite_cleaners')
      .delete()
      .eq('customer_id', customer.id)
      .eq('cleaner_id', cleaner_id);

    if (deleteError) {
      return NextResponse.json(
        { ok: false, error: 'Failed to remove favorite' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Favorite removed successfully',
    });
  } catch (error) {
    console.error('Error removing favorite cleaner:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
