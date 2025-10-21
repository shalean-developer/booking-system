import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, createCleanerSupabaseClient } from '@/lib/cleaner-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('📞 Claim booking API called');
    
    // Check authentication
    const session = await getCleanerSession();
    if (!session) {
      console.log('❌ No cleaner session found');
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ Cleaner authenticated:', session.name, session.id);

    const { id: bookingId } = await params;
    console.log('🎯 Booking ID:', bookingId);
    
    const supabase = await createCleanerSupabaseClient();
    console.log('🔌 Supabase client created');

    // Check if booking exists and is available
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle() as any;

    if (fetchError) {
      console.error('❌ Error fetching booking:', fetchError);
      return NextResponse.json(
        { ok: false, error: 'Database error fetching booking', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!booking) {
      console.log('❌ Booking not found:', bookingId);
      return NextResponse.json(
        { ok: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    console.log('📋 Booking found:', {
      id: booking.id,
      status: booking.status,
      cleaner_id: booking.cleaner_id,
      customer_name: booking.customer_name,
    });

    // Check if booking is still available
    if (booking.cleaner_id) {
      console.log('⚠️ Booking already claimed by:', booking.cleaner_id);
      return NextResponse.json(
        { ok: false, error: 'Booking already claimed' },
        { status: 409 }
      );
    }

    if (booking.status !== 'pending') {
      console.log('⚠️ Booking status is not pending:', booking.status);
      return NextResponse.json(
        { ok: false, error: 'Booking is not available' },
        { status: 409 }
      );
    }

    // Claim the booking
    console.log('🔄 Attempting to claim booking:', bookingId, 'for cleaner:', session.name, session.id);
    console.log('📝 RPC Parameters:', {
      booking_id_param: bookingId,
      cleaner_id_param: session.id,
      claimed_at_param: new Date().toISOString()
    });
    
    // Use the database function with explicit UUID casting
    console.log('📞 Calling claim_booking_safe RPC function...');
    const { data: updatedBooking, error: updateError } = await supabase
      .rpc('claim_booking_safe', {
        booking_id_param: bookingId,
        cleaner_id_param: session.id,
        claimed_at_param: new Date().toISOString()
      })
      .single();
    
    console.log('📨 RPC Response:', { data: updatedBooking, error: updateError });

    if (updateError) {
      console.error('❌ Database error claiming booking:', {
        bookingId,
        cleanerId: session.id,
        error: updateError,
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
      });
      
      // Check if it's an RLS policy error
      if (updateError.code === '42501' || updateError.message?.includes('policy')) {
        return NextResponse.json(
          { 
            ok: false, 
            error: 'Database permission error. Please run the SQL fix: CLEANER_CLAIM_JOB_QUICK_FIX.sql',
            details: updateError.message 
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Failed to claim booking. It may have been claimed by another cleaner.',
          details: updateError.message 
        },
        { status: 500 }
      );
    }

    if (!updatedBooking) {
      return NextResponse.json(
        { ok: false, error: 'Booking was claimed by another cleaner' },
        { status: 409 }
      );
    }

    console.log('✅ Booking claimed:', bookingId, 'by', session.name);

    return NextResponse.json({
      ok: true,
      booking: updatedBooking,
      message: 'Booking claimed successfully',
    });
  } catch (error) {
    console.error('Error in claim booking route:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

