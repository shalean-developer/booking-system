import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let query = supabase
      .from('bookings')
      .select(`
        id,
        customer_name,
        total_amount,
        payment_reference,
        payment_method,
        status,
        created_at
      `)
      .not('payment_reference', 'is', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      // Map payment status to booking status
      if (status === 'completed' || status === 'paid') {
        query = query.eq('status', 'completed');
      } else if (status === 'pending') {
        query = query.in('status', ['pending', 'confirmed', 'accepted']);
      } else if (status === 'processing') {
        query = query.eq('status', 'confirmed');
      } else if (status === 'failed') {
        query = query.eq('status', 'cancelled');
      } else {
        query = query.eq('status', status);
      }
    }

    if (search) {
      query = query.or(
        `customer_name.ilike.%${search}%,payment_reference.ilike.%${search}%`
      );
    }

    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch payments' },
        { status: 500 }
      );
    }

    // Get total count
    let countQuery = supabase
      .from('bookings')
      .select('*', { count: 'exact', head: true })
      .not('payment_reference', 'is', null);

    if (status && status !== 'all') {
      if (status === 'completed' || status === 'paid') {
        countQuery = countQuery.eq('status', 'completed');
      } else if (status === 'pending') {
        countQuery = countQuery.in('status', ['pending', 'confirmed', 'accepted']);
      } else if (status === 'processing') {
        countQuery = countQuery.eq('status', 'confirmed');
      } else if (status === 'failed') {
        countQuery = countQuery.eq('status', 'cancelled');
      } else {
        countQuery = countQuery.eq('status', status);
      }
    }

    if (search) {
      countQuery = countQuery.or(
        `customer_name.ilike.%${search}%,payment_reference.ilike.%${search}%`
      );
    }

    const { count } = await countQuery;

    // Transform to payment format
    const payments = (bookings || []).map((booking: any) => ({
      id: booking.id,
      booking_id: booking.id,
      customer_name: booking.customer_name || 'Unknown Customer',
      amount: booking.total_amount || 0,
      payment_method: booking.payment_method || 'unknown',
      status: booking.status === 'completed' ? 'completed' : 
             booking.status === 'cancelled' ? 'failed' :
             ['pending', 'confirmed', 'accepted'].includes(booking.status) ? 'pending' : 'processing',
      transaction_id: booking.payment_reference || null,
      created_at: booking.created_at,
    }));

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      ok: true,
      payments,
      total: count || 0,
      totalPages,
    });
  } catch (error: any) {
    console.error('Error in payments GET API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}


