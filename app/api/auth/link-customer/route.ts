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
    const { email, auth_user_id } = body;

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

    // Search for existing customer with matching email but no auth link
    console.log('Searching for existing customer profile...');
    const { data: existingCustomer, error: searchError } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name, auth_user_id')
      .ilike('email', email)
      .is('auth_user_id', null)
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

      // Link the customer profile to the auth user
      const { data: updatedCustomer, error: updateError } = await supabase
        .from('customers')
        .update({ auth_user_id })
        .eq('id', existingCustomer.id)
        .select()
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
        customer_id: updatedCustomer.id,
        message: 'Existing customer profile linked to your account',
      });
    } else {
      console.log('ℹ️ No existing customer profile found - will be created on first booking');
      return NextResponse.json({
        ok: true,
        linked: false,
        message: 'No existing customer profile found',
      });
    }

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

