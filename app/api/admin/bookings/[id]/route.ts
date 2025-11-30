import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';
import { calcTotalAsync } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

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

    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { ok: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Fetch cleaner name if cleaner_id exists
    let cleanerName = null;
    if (booking.cleaner_id && booking.cleaner_id !== 'manual') {
      const { data: cleaner } = await supabase
        .from('cleaners')
        .select('name')
        .eq('id', booking.cleaner_id)
        .maybeSingle();
      cleanerName = cleaner?.name || null;
    }

    // Extract extras and quantities from price_snapshot
    const priceSnapshot = booking.price_snapshot as any;
    const extras = priceSnapshot?.extras || booking.extras || [];
    const extrasQuantities = priceSnapshot?.extrasQuantities || priceSnapshot?.extras_quantities || {};
    const tipAmount = priceSnapshot?.tip_amount || booking.tip_amount || 0;

    const formattedBooking = {
      ...booking,
      cleaner_name: cleanerName,
      extras,
      extrasQuantities,
      tip_amount: tipAmount, // Include tip amount for display
    };

    return NextResponse.json({
      ok: true,
      booking: formattedBooking,
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    // Fetch existing booking to preserve price_snapshot structure
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('price_snapshot, bedrooms, bathrooms, service_type')
      .eq('id', id)
      .single();

    if (fetchError || !existingBooking) {
      console.error('Error fetching existing booking:', fetchError);
      return NextResponse.json(
        { ok: false, error: `Booking not found: ${fetchError?.message || 'Unknown error'}` },
        { status: 404 }
      );
    }

    const existingPriceSnapshot = (existingBooking?.price_snapshot as any) || {};

    // Calculate new pricing if service details changed
    let totalAmount = body.total_amount;
    if (body.service_type || body.bedrooms !== undefined || body.bathrooms !== undefined || body.extras) {
      try {
        const pricing = await calcTotalAsync(
          {
            service: body.service_type || existingBooking?.service_type || null,
            bedrooms: body.bedrooms !== undefined ? body.bedrooms : (existingBooking?.bedrooms || 1),
            bathrooms: body.bathrooms !== undefined ? body.bathrooms : (existingBooking?.bathrooms || 1),
            extras: body.extras || existingPriceSnapshot.extras || [],
            extrasQuantities: body.extrasQuantities || existingPriceSnapshot.extrasQuantities || {},
          },
          'one-time'
        );
        totalAmount = pricing.total * 100; // Convert to cents
      } catch (error) {
        console.error('Error calculating pricing:', error);
        // Continue with existing total_amount if calculation fails
      }
    }

    // Update price_snapshot
    const updatedPriceSnapshot = {
      ...existingPriceSnapshot,
      extras: body.extras || existingPriceSnapshot.extras || [],
      extrasQuantities: body.extrasQuantities || existingPriceSnapshot.extrasQuantities || {},
      snapshot_date: new Date().toISOString(),
    };

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
      price_snapshot: updatedPriceSnapshot,
    };

    if (body.service_type) updateData.service_type = body.service_type;
    if (body.bedrooms !== undefined) updateData.bedrooms = body.bedrooms;
    if (body.bathrooms !== undefined) updateData.bathrooms = body.bathrooms;
    if (body.booking_date) updateData.booking_date = body.booking_date;
    if (body.booking_time) updateData.booking_time = body.booking_time;
    if (body.status) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.customer_first_name && body.customer_last_name) {
      updateData.customer_name = `${body.customer_first_name} ${body.customer_last_name}`;
    }
    if (body.customer_email) updateData.customer_email = body.customer_email;
    if (body.customer_phone) updateData.customer_phone = body.customer_phone;
    if (body.address_line1) updateData.address_line1 = body.address_line1;
    if (body.address_suburb) updateData.address_suburb = body.address_suburb;
    if (body.address_city) updateData.address_city = body.address_city;
    if (totalAmount !== undefined) updateData.total_amount = totalAmount;

    console.log('Updating booking with data:', JSON.stringify(updateData, null, 2));

    const { data, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating booking:', error);
      return NextResponse.json(
        { ok: false, error: `Failed to update booking: ${error.message || error.details || 'Unknown error'}` },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: false, error: 'Booking was not updated (no data returned)' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      booking: data,
    });
  } catch (error: any) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { ok: false, error: `Internal server error: ${error?.message || 'Unknown error'}` },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting booking:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to delete booking' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Booking deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting booking:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

