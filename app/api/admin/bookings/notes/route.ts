import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Admin Booking Notes API
 * GET: Fetch notes for a booking
 * POST: Add note to booking
 */
export async function GET(req: Request) {
  console.log('=== ADMIN BOOKING NOTES GET ===');
  
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
    const bookingId = url.searchParams.get('bookingId');
    
    if (!bookingId) {
      return NextResponse.json(
        { ok: false, error: 'Booking ID required' },
        { status: 400 }
      );
    }
    
    // Fetch notes for this booking
    const { data: notes, error } = await supabase
      .from('booking_notes')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    console.log(`✅ Fetched ${notes?.length || 0} notes for booking ${bookingId}`);
    
    return NextResponse.json({
      ok: true,
      notes: notes || [],
    });
    
  } catch (error) {
    console.error('=== ADMIN BOOKING NOTES GET ERROR ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notes';
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  console.log('=== ADMIN BOOKING NOTES POST ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { bookingId, note, adminId } = body;
    
    if (!bookingId || !note) {
      return NextResponse.json(
        { ok: false, error: 'Booking ID and note required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Insert note
    const { data: newNote, error } = await supabase
      .from('booking_notes')
      .insert([{
        booking_id: bookingId,
        note,
        admin_id: adminId || 'admin',
      }])
      .select()
      .single();
    
    if (error) throw error;
    
    console.log(`✅ Added note to booking ${bookingId}`);
    
    return NextResponse.json({
      ok: true,
      note: newNote,
    });
    
  } catch (error) {
    console.error('=== ADMIN BOOKING NOTES POST ERROR ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to add note';
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}

