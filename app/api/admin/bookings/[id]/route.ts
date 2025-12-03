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
    
    // Extract bedrooms and bathrooms from price_snapshot (they're not stored as separate columns)
    const bedrooms = priceSnapshot?.bedrooms || priceSnapshot?.service?.bedroom || 1;
    const bathrooms = priceSnapshot?.bathrooms || priceSnapshot?.service?.bathroom || 1;

    const formattedBooking = {
      ...booking,
      cleaner_name: cleanerName,
      bedrooms,
      bathrooms,
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
      .select('price_snapshot, service_type')
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
    
    // Get bedrooms and bathrooms from price_snapshot or use defaults
    const existingBedrooms = existingPriceSnapshot.bedrooms || existingPriceSnapshot.service?.bedroom || 1;
    const existingBathrooms = existingPriceSnapshot.bathrooms || existingPriceSnapshot.service?.bathroom || 1;

    // Calculate new pricing if service details changed AND no manual total_amount provided
    // If total_amount is provided in body, use it (manual override)
    // Otherwise, always recalculate to ensure price matches current service details
    let totalAmount = body.total_amount;
    
    // If total_amount is not provided (not a manual override), always recalculate
    // This ensures that when admin edits service details, price is automatically updated
    if (totalAmount === undefined) {
      // Check if any service details are being updated
      const serviceDetailsChanged = 
        body.service_type || 
        body.bedrooms !== undefined || 
        body.bathrooms !== undefined || 
        body.extras !== undefined ||
        body.extrasQuantities !== undefined;
      
      // Always recalculate if service details changed, or if we have service type to calculate from
      if (serviceDetailsChanged || body.service_type || existingBooking?.service_type) {
        try {
          const pricing = await calcTotalAsync(
            {
              service: body.service_type || existingBooking?.service_type || null,
              bedrooms: body.bedrooms !== undefined ? body.bedrooms : existingBedrooms,
              bathrooms: body.bathrooms !== undefined ? body.bathrooms : existingBathrooms,
              extras: body.extras || existingPriceSnapshot.extras || [],
              extrasQuantities: body.extrasQuantities || existingPriceSnapshot.extrasQuantities || {},
            },
            'one-time'
          );
          totalAmount = pricing.total * 100; // Convert to cents
          console.log('💰 Recalculated price based on service details:', totalAmount, 'cents (R' + (totalAmount / 100).toFixed(2) + ')');
        } catch (error) {
          console.error('Error calculating pricing:', error);
          // Continue with existing total_amount if calculation fails
        }
      }
    } else {
      console.log('💰 Using manual/override price:', totalAmount, 'cents (R' + (totalAmount / 100).toFixed(2) + ')');
    }

    // Update price_snapshot with bedrooms and bathrooms
    const updatedPriceSnapshot = {
      ...existingPriceSnapshot,
      bedrooms: body.bedrooms !== undefined ? body.bedrooms : existingBedrooms,
      bathrooms: body.bathrooms !== undefined ? body.bathrooms : existingBathrooms,
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
    // Note: bedrooms and bathrooms are stored in price_snapshot, not as separate columns
    // if (body.bedrooms !== undefined) updateData.bedrooms = body.bedrooms;
    // if (body.bathrooms !== undefined) updateData.bathrooms = body.bathrooms;
    // Always update booking_date if provided
    if (body.booking_date !== undefined) updateData.booking_date = body.booking_date;
    if (body.booking_time) updateData.booking_time = body.booking_time;
    if (body.status) updateData.status = body.status;
    // Only include notes if it's provided and not empty (handles schema cache issues)
    if (body.notes !== undefined && body.notes !== null) {
      updateData.notes = body.notes;
    }
    if (body.customer_first_name && body.customer_last_name) {
      updateData.customer_name = `${body.customer_first_name} ${body.customer_last_name}`;
    }
    if (body.customer_email) updateData.customer_email = body.customer_email;
    if (body.customer_phone) updateData.customer_phone = body.customer_phone;
    if (body.address_line1) updateData.address_line1 = body.address_line1;
    if (body.address_suburb) updateData.address_suburb = body.address_suburb;
    if (body.address_city) updateData.address_city = body.address_city;
    // Always update total_amount if provided (either manual or calculated)
    // Check both body.total_amount and calculated totalAmount
    const finalTotalAmount = body.total_amount !== undefined ? body.total_amount : totalAmount;
    if (finalTotalAmount !== undefined && finalTotalAmount !== null) {
      updateData.total_amount = finalTotalAmount;
      console.log('💰 Setting total_amount:', finalTotalAmount, 'cents (R' + (finalTotalAmount / 100).toFixed(2) + ')');
    }
    // Always update cleaner_earnings if provided
    if (body.cleaner_earnings !== undefined && body.cleaner_earnings !== null) {
      updateData.cleaner_earnings = body.cleaner_earnings;
      console.log('💰 Setting cleaner_earnings:', body.cleaner_earnings, 'cents (R' + (body.cleaner_earnings / 100).toFixed(2) + ')');
    }

    console.log('📝 Updating booking with data:', JSON.stringify(updateData, null, 2));
    console.log('📝 Booking ID:', id);
    console.log('📝 Fields being updated:', Object.keys(updateData));

    let { data, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    console.log('📝 Update result - Error:', error);
    console.log('📝 Update result - Data:', data ? 'Success' : 'No data returned');

    // Handle schema cache errors - if notes column doesn't exist, retry without it
    if (error && error.message && error.message.includes("'notes' column")) {
      console.warn('⚠️ Notes column not found in schema cache, retrying without notes field');
      // Remove notes from updateData and retry
      const { notes, ...updateDataWithoutNotes } = updateData;
      ({ data, error } = await supabase
        .from('bookings')
        .update(updateDataWithoutNotes)
        .eq('id', id)
        .select()
        .single());
      
      if (!error) {
        console.log('✅ Booking updated successfully (notes field skipped - column may not exist yet)');
      }
    }

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

    console.log('✅ Booking updated successfully');
    console.log('✅ Updated booking data:', {
      id: data.id,
      booking_date: data.booking_date,
      total_amount: data.total_amount,
      cleaner_earnings: data.cleaner_earnings,
    });

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

