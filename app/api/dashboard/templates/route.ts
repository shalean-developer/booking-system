import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * API endpoint for managing booking templates
 * GET: Fetch user's booking templates
 * POST: Create a new booking template
 * PUT: Update an existing booking template
 * DELETE: Delete a booking template
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

    // Get templates ordered by default first, then created date
    const { data: templates, error: templatesError } = await supabase
      .from('booking_templates')
      .select('*')
      .eq('customer_id', customer.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (templatesError) {
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch templates' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      templates: templates || [],
    });
  } catch (error) {
    console.error('Error fetching booking templates:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
      name,
      service_type,
      bedrooms,
      bathrooms,
      extras,
      extras_quantities,
      notes,
      frequency,
      address_line1,
      address_suburb,
      address_city,
      cleaner_id,
      selected_team,
      requires_team,
      tip_amount,
      is_default,
    } = body;

    // Validate required fields
    if (!name || !service_type) {
      return NextResponse.json(
        { ok: false, error: 'Name and service_type are required' },
        { status: 400 }
      );
    }

    // Validate service_type
    const validServiceTypes = ['Standard', 'Deep', 'Move In/Out', 'Airbnb'];
    if (!validServiceTypes.includes(service_type)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid service_type' },
        { status: 400 }
      );
    }

    // If setting as default, ensure no other default exists (trigger will handle this, but we can check)
    if (is_default) {
      const { data: existingDefault } = await supabase
        .from('booking_templates')
        .select('id')
        .eq('customer_id', customer.id)
        .eq('is_default', true)
        .maybeSingle();

      if (existingDefault) {
        // Update existing default to false (trigger will handle this automatically)
        await supabase
          .from('booking_templates')
          .update({ is_default: false })
          .eq('id', existingDefault.id);
      }
    }

    // Create template
    const { data: template, error: insertError } = await supabase
      .from('booking_templates')
      .insert({
        customer_id: customer.id,
        name: name.trim(),
        service_type,
        bedrooms: bedrooms ?? 2,
        bathrooms: bathrooms ?? 1,
        extras: extras || [],
        extras_quantities: extras_quantities || {},
        notes: notes || '',
        frequency: frequency || 'one-time',
        address_line1: address_line1 || null,
        address_suburb: address_suburb || null,
        address_city: address_city || null,
        cleaner_id: cleaner_id || null,
        selected_team: selected_team || null,
        requires_team: requires_team ?? false,
        tip_amount: tip_amount ?? 0,
        is_default: is_default ?? false,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { ok: false, error: 'Failed to create template' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      template,
    });
  } catch (error) {
    console.error('Error creating booking template:', error);
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Template id is required' },
        { status: 400 }
      );
    }

    // Verify template belongs to customer
    const { data: existingTemplate, error: fetchError } = await supabase
      .from('booking_templates')
      .select('customer_id')
      .eq('id', id)
      .eq('customer_id', customer.id)
      .maybeSingle();

    if (fetchError || !existingTemplate) {
      return NextResponse.json(
        { ok: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults
    if (updates.is_default === true) {
      await supabase
        .from('booking_templates')
        .update({ is_default: false })
        .eq('customer_id', customer.id)
        .neq('id', id)
        .eq('is_default', true);
    }

    // Update template
    const { data: template, error: updateError } = await supabase
      .from('booking_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { ok: false, error: 'Failed to update template' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      template,
    });
  } catch (error) {
    console.error('Error updating booking template:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
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

    const url = new URL(request.url);
    const templateId = url.searchParams.get('id');

    if (!templateId) {
      return NextResponse.json(
        { ok: false, error: 'Template id query parameter is required' },
        { status: 400 }
      );
    }

    // Verify template belongs to customer
    const { data: existingTemplate } = await supabase
      .from('booking_templates')
      .select('customer_id')
      .eq('id', templateId)
      .eq('customer_id', customer.id)
      .maybeSingle();

    if (!existingTemplate) {
      return NextResponse.json(
        { ok: false, error: 'Template not found' },
        { status: 404 }
      );
    }

    // Delete template
    const { error: deleteError } = await supabase
      .from('booking_templates')
      .delete()
      .eq('id', templateId)
      .eq('customer_id', customer.id);

    if (deleteError) {
      return NextResponse.json(
        { ok: false, error: 'Failed to delete template' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Template deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting booking template:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
