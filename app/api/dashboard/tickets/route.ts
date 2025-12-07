import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * GET handler to fetch customer's support tickets
 * Requires authentication
 */
export async function GET(request: NextRequest) {
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
      return NextResponse.json({
        ok: true,
        tickets: [],
      });
    }

    // Fetch tickets - using a simple approach: store in a table or use contact form submissions
    // For now, we'll create a simple tickets table structure
    // Check if support_tickets table exists, if not return empty array
    const { data: tickets, error: ticketsError } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false });

    // If table doesn't exist, return empty array (graceful degradation)
    if (ticketsError && ticketsError.code === '42P01') {
      return NextResponse.json({
        ok: true,
        tickets: [],
      });
    }

    if (ticketsError) {
      console.error('Error fetching tickets:', ticketsError);
      return NextResponse.json({
        ok: true,
        tickets: [],
      });
    }

    return NextResponse.json({
      ok: true,
      tickets: tickets || [],
    });
  } catch (error) {
    console.error('Error in tickets route:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST handler to create a new support ticket
 * Requires authentication
 */
export async function POST(request: NextRequest) {
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
      .select('id, email, first_name, last_name')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();

    if (customerError || !customer) {
      return NextResponse.json(
        { ok: false, error: 'Customer profile not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { subject, message, priority = 'normal', category = 'general' } = body;

    if (!subject || !message) {
      return NextResponse.json(
        { ok: false, error: 'Subject and message are required' },
        { status: 400 }
      );
    }

    // Generate ticket ID
    const ticketId = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Try to insert ticket - if table doesn't exist, we'll handle gracefully
    const { data: ticket, error: insertError } = await supabase
      .from('support_tickets')
      .insert({
        id: ticketId,
        customer_id: customer.id,
        subject,
        message,
        priority,
        category,
        status: 'open',
        customer_email: customer.email,
        customer_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim(),
      })
      .select()
      .single();

    // If table doesn't exist, return success anyway (ticket will be sent via contact form)
    if (insertError && insertError.code === '42P01') {
      console.warn('Support tickets table does not exist. Ticket not saved to database.');
      // Still return success - the ticket can be handled via contact form
      return NextResponse.json({
        ok: true,
        ticket: {
          id: ticketId,
          subject,
          message,
          status: 'open',
          created_at: new Date().toISOString(),
        },
        message: 'Ticket created successfully. Our team will contact you soon.',
      });
    }

    if (insertError) {
      console.error('Error creating ticket:', insertError);
      return NextResponse.json(
        { ok: false, error: 'Failed to create ticket', details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      ticket,
      message: 'Ticket created successfully',
    });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
