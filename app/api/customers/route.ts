import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getServerAuthUser } from '@/lib/supabase-server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET /api/customers?email={email}
// Check if customer profile exists by email or auth user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    console.log('=== CHECKING CUSTOMER PROFILE ===');
    console.log('Email:', email);

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if user is authenticated
    const authUser = await getServerAuthUser();
    
    if (authUser) {
      console.log('🔐 Authenticated user detected:', authUser.email, '(ID:', authUser.id + ')');
      
      // First, try to find profile by auth_user_id
      const { data: authProfile } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();

      if (authProfile) {
        console.log('✅ Customer profile found by auth_user_id:', authProfile.id);
        return NextResponse.json({
          ok: true,
          exists: true,
          customer: authProfile,
          isAuthenticated: true,
        });
      }
    }

    // Fallback to email check (for guest users or auth users without profile yet)
    if (email) {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .ilike('email', email)
        .maybeSingle();

      if (error) {
        console.error('Error checking customer:', error);
        return NextResponse.json(
          { ok: false, error: 'Database error', details: error.message },
          { status: 500 }
        );
      }

      if (data) {
        console.log('✅ Customer profile found by email:', data.id);
        
        // If auth user exists and profile has no auth link, link it now
        if (authUser && !data.auth_user_id) {
          console.log('🔗 Linking guest profile to authenticated user...');
          const { error: linkError } = await supabase
            .from('customers')
            .update({ auth_user_id: authUser.id })
            .eq('id', data.id);
          
          if (linkError) {
            console.error('⚠️ Failed to link profile to auth user:', linkError);
          } else {
            console.log('✅ Profile linked to auth user');
            data.auth_user_id = authUser.id;
          }
        }
        
        return NextResponse.json({
          ok: true,
          exists: true,
          customer: data,
          isAuthenticated: !!authUser,
        });
      }
    }

    console.log('ℹ️ No customer profile found');
    return NextResponse.json({
      ok: true,
      exists: false,
      customer: null,
      isAuthenticated: !!authUser,
    });

  } catch (error) {
    console.error('=== CUSTOMER CHECK ERROR ===');
    console.error(error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/customers
// Create new customer profile (with optional auth linking)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, phone, first_name, last_name, address_line1, address_suburb, address_city } = body;

    console.log('=== CREATING CUSTOMER PROFILE ===');
    console.log('Email:', email);

    // Validation
    if (!email || !first_name || !last_name) {
      return NextResponse.json(
        { ok: false, error: 'Email, first name, and last name are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check if user is authenticated
    const authUser = await getServerAuthUser();
    
    if (authUser) {
      console.log('🔐 Authenticated user detected:', authUser.email, '(ID:', authUser.id + ')');
      
      // Check if auth user already has a profile
      const { data: existingAuthProfile } = await supabase
        .from('customers')
        .select('*')
        .eq('auth_user_id', authUser.id)
        .maybeSingle();
      
      if (existingAuthProfile) {
        console.log('✅ Auth user already has profile:', existingAuthProfile.id);
        return NextResponse.json({
          ok: true,
          customer: existingAuthProfile,
          message: 'Customer profile already exists',
          isNew: false,
        });
      }
    }

    // Check if customer already exists by email (case-insensitive)
    const { data: existing } = await supabase
      .from('customers')
      .select('*')
      .ilike('email', email)
      .maybeSingle();

    if (existing) {
      console.log('ℹ️ Customer already exists by email:', existing.id);
      
      // If auth user and existing profile has no auth link, link it
      if (authUser && !existing.auth_user_id) {
        console.log('🔗 Linking existing guest profile to auth user...');
        const { data: updated, error: linkError } = await supabase
          .from('customers')
          .update({ auth_user_id: authUser.id })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (linkError) {
          console.error('⚠️ Failed to link profile:', linkError);
        } else {
          console.log('✅ Guest profile linked to auth user');
          return NextResponse.json({
            ok: true,
            customer: updated,
            message: 'Existing profile linked to your account',
            isNew: false,
          });
        }
      }
      
      return NextResponse.json({
        ok: true,
        customer: existing,
        message: 'Customer profile already exists',
        isNew: false,
      });
    }

    // Create new customer profile (with auth link if authenticated)
    const { data: newCustomer, error } = await supabase
      .from('customers')
      .insert({
        email: email.toLowerCase().trim(),
        phone,
        first_name,
        last_name,
        address_line1,
        address_suburb,
        address_city,
        auth_user_id: authUser?.id || null,  // Link to auth if authenticated
        total_bookings: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating customer:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to create customer profile', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Customer profile created:', newCustomer.id);
    if (authUser) {
      console.log('🔗 Profile linked to auth user:', authUser.id);
    }
    
    return NextResponse.json({
      ok: true,
      customer: newCustomer,
      message: 'Customer profile created successfully',
      isNew: true,
    });

  } catch (error) {
    console.error('=== CUSTOMER CREATE ERROR ===');
    console.error(error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/customers?id={id}
// Update existing customer profile
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('id');
    const body = await request.json();
    const { phone, first_name, last_name, address_line1, address_suburb, address_city } = body;

    if (!customerId) {
      return NextResponse.json(
        { ok: false, error: 'Customer ID is required' },
        { status: 400 }
      );
    }

    console.log('=== UPDATING CUSTOMER PROFILE ===');
    console.log('Customer ID:', customerId);

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('customers')
      .update({
        phone,
        first_name,
        last_name,
        address_line1,
        address_suburb,
        address_city,
      })
      .eq('id', customerId)
      .select()
      .single();

    if (error) {
      console.error('Error updating customer:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to update customer profile', details: error.message },
        { status: 500 }
      );
    }

    console.log('✅ Customer profile updated:', data.id);
    return NextResponse.json({
      ok: true,
      customer: data,
      message: 'Customer profile updated successfully',
    });

  } catch (error) {
    console.error('=== CUSTOMER UPDATE ERROR ===');
    console.error(error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}


