import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

/**
 * Admin Customers API
 * GET: Fetch all customers with filters
 */
export async function GET(req: Request) {
  console.log('=== ADMIN CUSTOMERS GET ===');
  
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
    
    // Get query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase
      .from('customers')
      .select(`
        id,
        email,
        phone,
        first_name,
        last_name,
        address_line1,
        address_suburb,
        address_city,
        total_bookings,
        role,
        created_at,
        updated_at
      `, { count: 'exact' });
    
    // Apply search filter
    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%,phone.ilike.%${search}%`);
    }
    
    // Apply pagination and sorting
    const { data: customers, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    console.log(`✅ Fetched ${customers?.length || 0} customers`);
    
    return NextResponse.json({
      ok: true,
      customers: customers || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
    
  } catch (error) {
    console.error('=== ADMIN CUSTOMERS GET ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

