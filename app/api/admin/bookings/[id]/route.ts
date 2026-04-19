import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';
import { calcTotalSafe } from '@/lib/pricing/calcTotalSafe';
import { mergeExtrasQuantitiesFromRaw } from '@/lib/pricing/normalizePricingInput';

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

    // Fetch existing booking to preserve price_snapshot structure and enforce paid-booking rules
    const { data: existingBooking, error: fetchError } = await supabase
      .from('bookings')
      .select('price_snapshot, service_type, status, payment_status, total_amount, price')
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
    const isPaidBooking =
      String(existingBooking?.payment_status || '').toLowerCase() === 'success' ||
      String(existingBooking?.status || '').toLowerCase() === 'paid';

    // Get bedrooms and bathrooms from price_snapshot or use defaults
    const existingBedrooms = existingPriceSnapshot.bedrooms || existingPriceSnapshot.service?.bedroom || 1;
    const existingBathrooms = existingPriceSnapshot.bathrooms || existingPriceSnapshot.service?.bathroom || 1;
    const mergedExtrasQuantities = mergeExtrasQuantitiesFromRaw({
      price_snapshot: existingPriceSnapshot,
      extrasQuantities: body.extrasQuantities,
      extras_quantities: (body as { extras_quantities?: Record<string, number> }).extras_quantities,
    });

    // Calculate new pricing if service details changed AND no manual total_amount provided
    // If total_amount is provided in body, use it (manual override)
    // Otherwise, always recalculate to ensure price matches current service details
    let totalAmount: number | undefined = isPaidBooking ? undefined : body.total_amount;

    if (isPaidBooking && body.total_amount !== undefined) {
      console.warn('[admin/bookings PATCH] ignoring body.total_amount — booking already paid', {
        bookingId: id,
        attemptedCents: body.total_amount,
      });
    }

    // If total_amount is not provided (not a manual override), always recalculate
    // This ensures that when admin edits service details, price is automatically updated
    // Never recalculate monetary totals for paid bookings (would desync from Paystack charge).
    if (!isPaidBooking && totalAmount === undefined) {
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
          const pricing = await calcTotalSafe(
            {
              service: body.service_type || existingBooking?.service_type,
              bedrooms: body.bedrooms !== undefined ? body.bedrooms : existingBedrooms,
              bathrooms: body.bathrooms !== undefined ? body.bathrooms : existingBathrooms,
              extras: body.extras || existingPriceSnapshot.extras || [],
              extrasQuantities: body.extrasQuantities,
              extras_quantities: (body as { extras_quantities?: Record<string, number> }).extras_quantities,
              numberOfCleaners: (body as { numberOfCleaners?: number }).numberOfCleaners,
              price_snapshot: existingPriceSnapshot,
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
    } else if (!isPaidBooking && totalAmount !== undefined) {
      console.log('💰 Using manual/override price:', totalAmount, 'cents (R' + (totalAmount / 100).toFixed(2) + ')');
    }

    // Update price_snapshot with bedrooms and bathrooms
    const updatedPriceSnapshot = {
      ...existingPriceSnapshot,
      bedrooms: body.bedrooms !== undefined ? body.bedrooms : existingBedrooms,
      bathrooms: body.bathrooms !== undefined ? body.bathrooms : existingBathrooms,
      extras: body.extras || existingPriceSnapshot.extras || [],
      extrasQuantities: mergedExtrasQuantities,
      extras_quantities: mergedExtrasQuantities,
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
    let finalTotalAmount = body.total_amount !== undefined ? body.total_amount : totalAmount;
    if (isPaidBooking) {
      finalTotalAmount = undefined;
      console.log('[admin/bookings PATCH] skipping total_amount/price update — booking already paid', {
        bookingId: id,
        stored_total_amount_cents: existingBooking?.total_amount,
      });
    }
    if (finalTotalAmount !== undefined && finalTotalAmount !== null) {
      updateData.total_amount = finalTotalAmount;
      // Keep `price` (ZAR) in sync: admin recalc / override only touched total_amount before,
      // leaving stale `price` (e.g. R940) while total_amount was 68000 cents (R680).
      updateData.price = finalTotalAmount / 100;
      console.log('[admin/bookings PATCH] pricing sync', {
        bookingId: id,
        total_amount_cents: finalTotalAmount,
        price_zar: finalTotalAmount / 100,
      });
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

