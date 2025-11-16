import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, createCleanerSupabaseClient, cleanerIdToUuid } from '@/lib/cleaner-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id: bookingId } = await params;
    const body = await request.json();
    const notes: string = (body?.notes || '').toString().trim();

    if (!bookingId) {
      return NextResponse.json({ ok: false, error: 'Booking ID is required' }, { status: 400 });
    }
    if (!notes) {
      return NextResponse.json({ ok: false, error: 'Notes are required' }, { status: 400 });
    }

    const supabase = await createCleanerSupabaseClient();
    const cleanerUuid = cleanerIdToUuid(session.id);

    // Insert a booking note as an issue/dispute
    const { error: noteError } = await supabase.from('booking_notes').insert({
      booking_id: bookingId,
      author_type: 'cleaner',
      author_id: cleanerUuid,
      note_type: 'issue',
      content: notes,
    });

    if (noteError) {
      console.error('Failed to insert issue note:', noteError);
      return NextResponse.json({ ok: false, error: 'Failed to submit issue' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, message: 'Issue submitted' });
  } catch (error) {
    console.error('Error in issue route:', error);
    return NextResponse.json({ ok: false, error: 'An error occurred' }, { status: 500 });
  }
}


