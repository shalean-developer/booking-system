import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Admin Cleaners API
 * GET: Fetch all cleaners (including inactive)
 * POST: Create new cleaner
 * PUT: Update cleaner
 * DELETE: Delete cleaner
 */
export async function GET(req: Request) {
  console.log('=== ADMIN CLEANERS GET ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const supabase = await createClient();
    const url = new URL(req.url);
    
    // Get query parameters
    const includeInactive = url.searchParams.get('includeInactive') === 'true';
    
    // Build query
    let query = supabase
      .from('cleaners')
      .select('*');
    
    // Filter by active status if needed
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    
    const { data: cleaners, error } = await query.order('name');
    
    if (error) throw error;
    
    console.log(`✅ Fetched ${cleaners?.length || 0} cleaners`);
    
    return NextResponse.json({
      ok: true,
      cleaners: cleaners || [],
    });
    
  } catch (error) {
    console.error('=== ADMIN CLEANERS GET ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch cleaners' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  console.log('=== ADMIN CLEANERS POST ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    console.log('📥 Received body:', body);
    
    const supabase = await createClient();
    
    const { data: cleaner, error } = await supabase
      .from('cleaners')
      .insert([body])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Database error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      throw error;
    }
    
    console.log('✅ Cleaner created:', cleaner.id);
    
    return NextResponse.json({
      ok: true,
      cleaner,
    });
    
  } catch (error: any) {
    console.error('=== ADMIN CLEANERS POST ERROR ===', error);
    const errorMessage = error?.message || 'Failed to create cleaner';
    const errorDetails = error?.details || '';
    const fullError = errorDetails ? `${errorMessage}: ${errorDetails}` : errorMessage;
    
    return NextResponse.json(
      { ok: false, error: fullError },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  console.log('=== ADMIN CLEANERS PUT ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { id, ...updates } = body;
    
    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Cleaner ID required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    const { data: cleaner, error } = await supabase
      .from('cleaners')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Cleaner updated:', id);
    
    return NextResponse.json({
      ok: true,
      cleaner,
    });
    
  } catch (error) {
    console.error('=== ADMIN CLEANERS PUT ERROR ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update cleaner';
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  console.log('=== ADMIN CLEANERS DELETE ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Cleaner ID required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('cleaners')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    
    console.log('✅ Cleaner deleted:', id);
    
    return NextResponse.json({
      ok: true,
      message: 'Cleaner deleted successfully',
    });
    
  } catch (error) {
    console.error('=== ADMIN CLEANERS DELETE ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to delete cleaner' },
      { status: 500 }
    );
  }
}

