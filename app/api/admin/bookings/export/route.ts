import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

/**
 * Admin Bookings Export API
 * GET: Export bookings as CSV
 */
export async function GET(req: Request) {
  console.log('=== ADMIN BOOKINGS EXPORT GET ===');
  
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
    
    // Get query parameters for filtering
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const serviceType = url.searchParams.get('serviceType') || '';
    const ids = url.searchParams.get('ids'); // For bulk export
    
    // Build query
    let query = supabase
      .from('bookings')
      .select(`
        id,
        booking_date,
        booking_time,
        service_type,
        customer_name,
        customer_email,
        customer_phone,
        address_line1,
        address_suburb,
        address_city,
        status,
        total_amount,
        payment_reference,
        cleaner_id,
        created_at
      `);
    
    // Apply filters
    if (ids) {
      // Bulk export specific bookings
      const idArray = ids.split(',');
      query = query.in('id', idArray);
    } else {
      // Apply search and filters
      if (search) {
        query = query.or(`customer_name.ilike.%${search}%,customer_email.ilike.%${search}%,id.ilike.%${search}%`);
      }
      
      if (status) {
        query = query.eq('status', status);
      }
      
      if (serviceType) {
        query = query.eq('service_type', serviceType);
      }
    }
    
    const { data: bookings, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Fetch cleaner names
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
    
    // Generate CSV
    const csv = generateCSV(bookings || [], cleanerNames);
    
    console.log(`✅ Exported ${bookings?.length || 0} bookings`);
    
    // Return CSV with appropriate headers
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="bookings-export-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    });
    
  } catch (error) {
    console.error('=== ADMIN BOOKINGS EXPORT ERROR ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to export bookings';
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}

function generateCSV(bookings: any[], cleanerNames: Record<string, string>): string {
  // CSV headers
  const headers = [
    'Booking ID',
    'Customer Name',
    'Customer Email',
    'Customer Phone',
    'Service Type',
    'Booking Date',
    'Booking Time',
    'Address Line 1',
    'Suburb',
    'City',
    'Status',
    'Total Amount (R)',
    'Payment Reference',
    'Cleaner',
    'Created At',
  ];
  
  // CSV rows
  const rows = bookings.map(booking => {
    const cleanerName = booking.cleaner_id === 'manual' 
      ? 'Manual Assignment'
      : cleanerNames[booking.cleaner_id] || 'Unassigned';
    
    return [
      booking.id,
      booking.customer_name,
      booking.customer_email,
      booking.customer_phone,
      booking.service_type,
      booking.booking_date,
      booking.booking_time,
      booking.address_line1,
      booking.address_suburb,
      booking.address_city,
      booking.status,
      (booking.total_amount / 100).toFixed(2),
      booking.payment_reference || '',
      cleanerName,
      new Date(booking.created_at).toISOString(),
    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}

