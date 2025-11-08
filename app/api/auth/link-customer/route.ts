import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * API endpoint to link existing customer profiles to auth users
 * Called after signup to connect any existing guest profiles
 */
export async function POST(req: Request) {
  console.log('=== LINK CUSTOMER API CALLED ===');
  console.log('Timestamp:', new Date().toISOString());
  
  try {
    const body = await req.json();
    const { email, auth_user_id, profile } = body;

    console.log('Link request:', { email, auth_user_id });

    // Create server client
    const supabase = await createClient();

    // Validate required fields
    if (!email || !auth_user_id) {
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Email and auth_user_id are required',
        },
        { status: 400 }
      );
    }

    const fallbackName = (profile?.fullName as string | undefined)?.trim() || email.split('@')[0] || 'Customer';
    const fallbackParts = fallbackName.split(/\s+/);
    const resolvedFirstName = (profile?.firstName as string | undefined)?.trim() || fallbackParts[0] || 'Customer';
    const resolvedLastName =
      (profile?.lastName as string | undefined)?.trim() ||
      (fallbackParts.length > 1 ? fallbackParts.slice(1).join(' ') : 'Account');

    const profileDetails = {
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      fullName: profile?.fullName ?? `${resolvedFirstName} ${resolvedLastName}`.trim(),
    };

    // Search for existing customer with matching email (case insensitive)
    console.log('Searching for existing customer profile...');
    const { data: existingCustomer, error: searchError } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name, auth_user_id')
      .ilike('email', email)
      .maybeSingle();

    if (searchError) {
      console.error('Database search error:', searchError);
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Database error',
          details: searchError.message,
        },
        { status: 500 }
      );
    }

    if (existingCustomer) {
      console.log('✅ Found existing customer profile:', existingCustomer.id);
      console.log('🔗 Linking to auth user...');

      const updatePayload: Record<string, any> = {};

      if (existingCustomer.auth_user_id !== auth_user_id) {
        updatePayload.auth_user_id = auth_user_id;
      }
      if (profileDetails.firstName && !existingCustomer.first_name) {
        updatePayload.first_name = profileDetails.firstName;
      }
      if (profileDetails.lastName && !existingCustomer.last_name) {
        updatePayload.last_name = profileDetails.lastName;
      }

      if (Object.keys(updatePayload).length === 0) {
        console.log('ℹ️ Customer profile already linked and up to date.');
        return NextResponse.json({
          ok: true,
          linked: true,
          created: false,
          customer_id: existingCustomer.id,
          message: 'Customer profile already linked',
        });
      }

      const { data: updatedCustomer, error: updateError } = await supabase
        .from('customers')
        .update(updatePayload)
        .eq('id', existingCustomer.id)
        .select('id')
        .single();

      if (updateError) {
        console.error('Failed to link customer:', updateError);
        return NextResponse.json(
          { 
            ok: false, 
            error: 'Failed to link customer profile',
            details: updateError.message,
          },
          { status: 500 }
        );
      }

      console.log('✅ Customer profile linked successfully!');
      return NextResponse.json({
        ok: true,
        linked: true,
        created: false,
        customer_id: updatedCustomer.id,
        message: 'Existing customer profile linked to your account',
      });
    }

    console.log('ℹ️ No existing customer profile found - creating one now');

    const { data: createdCustomer, error: createError } = await supabase
      .from('customers')
      .insert({
        email,
        auth_user_id,
        first_name: profileDetails.firstName,
        last_name: profileDetails.lastName,
      })
      .select('id')
      .single();

    if (createError) {
      console.error('Failed to create customer profile:', createError);
      return NextResponse.json(
        {
          ok: false,
          error: 'Failed to create customer profile',
          details: createError.message,
        },
        { status: 500 }
      );
    }

    console.log('✅ Customer profile created successfully!');
    return NextResponse.json({
      ok: true,
      linked: false,
      created: true,
      customer_id: createdCustomer.id,
      message: 'Customer profile created for new account',
    });

  } catch (error) {
    console.error('=== LINK CUSTOMER ERROR ===');
    console.error(error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

