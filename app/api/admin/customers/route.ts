import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Admin Customers API
 * GET: Fetch all customers with filters
 * POST: Create new customer profile
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

/**
 * POST: Create new customer profile
 */
export async function POST(req: Request) {
  console.log('=== ADMIN CUSTOMERS POST ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { 
      email, 
      first_name, 
      last_name, 
      phone, 
      address_line1, 
      address_suburb, 
      address_city, 
      role = 'customer',
      auth_user_id 
    } = body;
    
    console.log('Creating customer:', { email, first_name, last_name, role });
    
    // Validate required fields
    if (!email || !first_name || !last_name || !phone || !address_line1 || !address_suburb || !address_city) {
      return NextResponse.json(
        { ok: false, error: 'All fields are required: email, first_name, last_name, phone, address_line1, address_suburb, address_city' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }
    
    // Validate role
    if (role !== 'customer' && role !== 'admin') {
      return NextResponse.json(
        { ok: false, error: 'Role must be either "customer" or "admin"' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Check for duplicate email (case-insensitive)
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id, email')
      .ilike('email', email)
      .maybeSingle();
    
    if (existingCustomer) {
      return NextResponse.json(
        { ok: false, error: `Customer with email ${email} already exists` },
        { status: 409 }
      );
    }
    
    // If auth_user_id provided, check if it's already linked to another customer
    if (auth_user_id) {
      const { data: linkedCustomer } = await supabase
        .from('customers')
        .select('id, email')
        .eq('auth_user_id', auth_user_id)
        .maybeSingle();
      
      if (linkedCustomer) {
        return NextResponse.json(
          { ok: false, error: `Auth user is already linked to customer ${linkedCustomer.email}` },
          { status: 409 }
        );
      }
    }
    
    // Create customer profile
    const customerData: any = {
      email: email.toLowerCase().trim(),
      first_name,
      last_name,
      phone,
      address_line1,
      address_suburb,
      address_city,
      role,
      total_bookings: 0,
    };
    
    // Add auth_user_id if provided
    if (auth_user_id) {
      customerData.auth_user_id = auth_user_id;
    }
    
    const { data: customer, error: createError } = await supabase
      .from('customers')
      .insert(customerData)
      .select()
      .single();
    
    if (createError) {
      console.error('Customer creation error:', createError);
      throw createError;
    }
    
    console.log('✅ Customer created:', customer.id);
    
    return NextResponse.json({
      ok: true,
      customer,
      message: 'Customer created successfully',
    });
    
  } catch (error) {
    console.error('=== ADMIN CUSTOMERS POST ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}

