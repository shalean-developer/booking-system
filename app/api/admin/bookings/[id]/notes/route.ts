import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin, getServerAuthUser } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();
    const authUser = await getServerAuthUser();

    // Check if booking_notes table exists, if not use notes field on booking
    const { data: booking } = await supabase
      .from('bookings')
      .select('notes')
      .eq('id', id)
      .single();

    if (!booking) {
      return NextResponse.json(
        { ok: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Try to insert into booking_notes table, fallback to updating booking.notes
    const noteContent = body.note || body.content || '';
    const adminName = authUser?.email || 'Admin';

    // Try booking_notes table first
    const { error: notesError } = await supabase
      .from('booking_notes')
      .insert({
        booking_id: id,
        admin_id: authUser?.id || null,
        admin_name: adminName,
        note: noteContent,
        created_at: new Date().toISOString(),
      });

    if (notesError) {
      // Fallback: append to booking notes field
      const existingNotes = booking.notes || '';
      const newNotes = existingNotes
        ? `${existingNotes}\n\n[${new Date().toLocaleString('en-ZA')}] ${adminName}: ${noteContent}`
        : `[${new Date().toLocaleString('en-ZA')}] ${adminName}: ${noteContent}`;

      await supabase
        .from('bookings')
        .update({ notes: newNotes })
        .eq('id', id);
    }

    return NextResponse.json({
      ok: true,
      message: 'Note added successfully',
    });
  } catch (error) {
    console.error('Error adding note:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to add note' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const supabase = await createClient();

    // Try to fetch from booking_notes table
    const { data: notes, error } = await supabase
      .from('booking_notes')
      .select('*')
      .eq('booking_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback: return booking notes field
      const { data: booking } = await supabase
        .from('bookings')
        .select('notes')
        .eq('id', id)
        .single();

      return NextResponse.json({
        ok: true,
        notes: booking?.notes ? [{ note: booking.notes, created_at: new Date().toISOString() }] : [],
      });
    }

    return NextResponse.json({
      ok: true,
      notes: notes || [],
    });
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch notes' },
      { status: 500 }
    );
  }
}

