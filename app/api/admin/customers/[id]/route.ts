import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

/**
 * Admin Customer Details API
 * GET: Fetch customer profile with full booking history
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('=== ADMIN CUSTOMER DETAILS GET ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const supabase = await createClient();
    const { id: customerId } = await params;
    
    // Fetch customer profile
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();
    
    if (customerError) {
      console.error('Customer fetch error:', customerError);
      throw new Error('Customer not found');
    }
    
    // Fetch all bookings for this customer
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        booking_time,
        service_type,
        status,
        total_amount,
        created_at,
        address_line1,
        address_suburb,
        address_city,
        cleaner_id,
        payment_reference
      `)
      .eq('customer_id', customerId)
      .order('booking_date', { ascending: false });
    
    if (bookingsError) {
      console.error('Bookings fetch error:', bookingsError);
      throw bookingsError;
    }
    
    // Fetch cleaner names for bookings
    const cleanerIds = bookings
      ?.filter(b => b.cleaner_id && b.cleaner_id !== 'manual')
      .map(b => b.cleaner_id) || [];
    
    let cleanerNames: Record<string, string> = {};
    
    if (cleanerIds.length > 0) {
      const { data: cleaners } = await supabase
        .from('cleaners')
        .select('id, name')
        .in('id', cleanerIds);
      
      cleanerNames = (cleaners || []).reduce((acc, c) => {
        acc[c.id] = c.name;
        return acc;
      }, {} as Record<string, string>);
    }
    
    // Add cleaner names to bookings
    const bookingsWithCleaners = bookings?.map(b => ({
      ...b,
      cleaner_name: b.cleaner_id === 'manual' 
        ? 'Manual Assignment' 
        : cleanerNames[b.cleaner_id || ''] || null
    }));
    
    console.log(`✅ Fetched customer ${customerId} with ${bookings?.length || 0} bookings`);
    
    return NextResponse.json({
      ok: true,
      customer,
      bookings: bookingsWithCleaners || [],
    });
    
  } catch (error) {
    console.error('=== ADMIN CUSTOMER DETAILS ERROR ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch customer details';
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}

