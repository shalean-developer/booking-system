import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Admin Global Search API
 * GET: Search across bookings, customers, cleaners, and applications
 */
export async function GET(request: Request) {
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const supabase = await createClient();
    const url = new URL(request.url);
    const query = url.searchParams.get('q') || '';
    
    if (!query.trim()) {
      return NextResponse.json({ ok: true, results: [] });
    }
    
    const searchTerm = `%${query}%`;
    const results: Array<{
      type: 'booking' | 'customer' | 'cleaner' | 'application';
      id: string;
      title: string;
      subtitle: string;
      metadata?: string;
    }> = [];
    
    // Search bookings
    const { data: bookings } = await supabase
      .from('bookings')
      .select('id, customer_name, customer_email, booking_date, service_type, status')
      .or(`customer_name.ilike.${searchTerm},customer_email.ilike.${searchTerm},id.ilike.${searchTerm}`)
      .limit(5);
    
    if (bookings) {
      bookings.forEach((booking) => {
        results.push({
          type: 'booking',
          id: booking.id,
          title: booking.customer_name || 'Unknown Customer',
          subtitle: `${booking.service_type} • ${booking.booking_date}`,
          metadata: `Status: ${booking.status}`,
        });
      });
    }
    
    // Search customers
    const { data: customers } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name')
      .or(`email.ilike.${searchTerm},first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
      .limit(5);
    
    if (customers) {
      customers.forEach((customer) => {
        results.push({
          type: 'customer',
          id: customer.id,
          title: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.email,
          subtitle: customer.email,
          metadata: 'Customer',
        });
      });
    }
    
    // Search cleaners
    const { data: cleaners } = await supabase
      .from('cleaners')
      .select('id, name, email, phone')
      .or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .limit(5);
    
    if (cleaners) {
      cleaners.forEach((cleaner) => {
        results.push({
          type: 'cleaner',
          id: cleaner.id,
          title: cleaner.name || 'Unknown Cleaner',
          subtitle: cleaner.email || cleaner.phone || 'No contact info',
          metadata: 'Cleaner',
        });
      });
    }
    
    // Search applications
    const { data: applications } = await supabase
      .from('applications')
      .select('id, name, email, phone, status')
      .or(`name.ilike.${searchTerm},email.ilike.${searchTerm}`)
      .limit(5);
    
    if (applications) {
      applications.forEach((app) => {
        results.push({
          type: 'application',
          id: app.id,
          title: app.name || 'Unknown Applicant',
          subtitle: app.email || app.phone || 'No contact info',
          metadata: `Status: ${app.status}`,
        });
      });
    }
    
    // Limit total results to 20
    return NextResponse.json({
      ok: true,
      results: results.slice(0, 20),
    });
    
  } catch (error: any) {
    console.error('=== SEARCH ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to search' },
      { status: 500 }
    );
  }
}





