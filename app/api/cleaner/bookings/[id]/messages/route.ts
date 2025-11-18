import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, createCleanerSupabaseClient, cleanerIdToUuid } from '@/lib/cleaner-auth';

/**
 * GET /api/cleaner/bookings/[id]/messages
 * Fetch all messages for a booking
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: bookingId } = await params;
    const supabase = await createCleanerSupabaseClient();
    const cleanerId = cleanerIdToUuid(session.id);

    // Verify cleaner owns this booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, cleaner_id')
      .eq('id', bookingId)
      .eq('cleaner_id', cleanerId)
      .maybeSingle();

    if (bookingError || !booking) {
      return NextResponse.json(
        { ok: false, error: 'Booking not found or access denied' },
        { status: 404 }
      );
    }

    // Fetch messages
    const { data: messages, error: messagesError } = await supabase
      .from('booking_messages')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }

    // Mark customer messages as read
    await supabase
      .from('booking_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('booking_id', bookingId)
      .eq('sender_type', 'customer')
      .is('read_at', null);

    return NextResponse.json({
      ok: true,
      messages: messages || [],
    });
  } catch (error) {
    console.error('Error in GET /api/cleaner/bookings/[id]/messages:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cleaner/bookings/[id]/messages
 * Send a message for a booking
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: bookingId } = await params;
    const supabase = await createCleanerSupabaseClient();
    const cleanerId = cleanerIdToUuid(session.id);

    // Verify cleaner owns this booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('id, cleaner_id')
      .eq('id', bookingId)
      .eq('cleaner_id', cleanerId)
      .maybeSingle();

    if (bookingError || !booking) {
      return NextResponse.json(
        { ok: false, error: 'Booking not found or access denied' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { message_text, attachments } = body;

    if (!message_text || message_text.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Message text is required' },
        { status: 400 }
      );
    }

    // Create message
    const { data: message, error: messageError } = await supabase
      .from('booking_messages')
      .insert({
        booking_id: bookingId,
        sender_type: 'cleaner',
        sender_id: cleanerId,
        message_text: message_text.trim(),
        attachments: attachments || [],
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json(
        { ok: false, error: 'Failed to send message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message,
    });
  } catch (error) {
    console.error('Error in POST /api/cleaner/bookings/[id]/messages:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

