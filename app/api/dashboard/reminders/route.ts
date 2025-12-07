import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * API endpoint for managing booking reminder preferences
 * GET: Fetch user's reminder preferences
 * PUT: Update user's reminder preferences
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = await createClient();
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find customer profile
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (customerError || !customer) {
      return NextResponse.json(
        { ok: false, error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    // Get or create reminder preferences
    let { data: preferences, error: prefError } = await supabase
      .from('reminder_preferences')
      .select('*')
      .eq('customer_id', customer.id)
      .maybeSingle();

    if (prefError && prefError.code !== 'PGRST116') { // PGRST116 = not found
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch preferences' },
        { status: 500 }
      );
    }

    // If no preferences exist, return defaults
    if (!preferences) {
      preferences = {
        id: null,
        customer_id: customer.id,
        email_enabled: true,
        sms_enabled: false,
        email_24h: true,
        email_2h: true,
        sms_24h: false,
        sms_2h: false,
        phone_number: null,
        created_at: null,
        updated_at: null,
      };
    }

    return NextResponse.json({
      ok: true,
      preferences,
    });
  } catch (error) {
    console.error('Error fetching reminder preferences:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = await createClient();
    
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Find customer profile
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (customerError || !customer) {
      return NextResponse.json(
        { ok: false, error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      email_enabled,
      sms_enabled,
      email_24h,
      email_2h,
      sms_24h,
      sms_2h,
      phone_number,
    } = body;

    // Validate phone number if SMS is enabled
    if (sms_enabled && (sms_24h || sms_2h)) {
      if (!phone_number || phone_number.trim() === '') {
        return NextResponse.json(
          { ok: false, error: 'Phone number is required when SMS reminders are enabled' },
          { status: 400 }
        );
      }
    }

    // Check if preferences exist
    const { data: existing } = await supabase
      .from('reminder_preferences')
      .select('id')
      .eq('customer_id', customer.id)
      .maybeSingle();

    let preferences;
    if (existing) {
      // Update existing preferences
      const { data, error } = await supabase
        .from('reminder_preferences')
        .update({
          email_enabled: email_enabled ?? true,
          sms_enabled: sms_enabled ?? false,
          email_24h: email_24h ?? true,
          email_2h: email_2h ?? true,
          sms_24h: sms_24h ?? false,
          sms_2h: sms_2h ?? false,
          phone_number: phone_number || null,
          updated_at: new Date().toISOString(),
        })
        .eq('customer_id', customer.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { ok: false, error: 'Failed to update preferences' },
          { status: 500 }
        );
      }
      preferences = data;
    } else {
      // Create new preferences
      const { data, error } = await supabase
        .from('reminder_preferences')
        .insert({
          customer_id: customer.id,
          email_enabled: email_enabled ?? true,
          sms_enabled: sms_enabled ?? false,
          email_24h: email_24h ?? true,
          email_2h: email_2h ?? true,
          sms_24h: sms_24h ?? false,
          sms_2h: sms_2h ?? false,
          phone_number: phone_number || null,
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { ok: false, error: 'Failed to create preferences' },
          { status: 500 }
        );
      }
      preferences = data;
    }

    return NextResponse.json({
      ok: true,
      preferences,
    });
  } catch (error) {
    console.error('Error updating reminder preferences:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
