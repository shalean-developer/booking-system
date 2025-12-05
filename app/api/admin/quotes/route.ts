import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';
import { calcTotalSync } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const jsonHeaders = {
    'Content-Type': 'application/json',
  };

  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { 
          status: 403,
          headers: jsonHeaders
        }
      );
    }

    // Use service role client to bypass RLS
    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build query with count for pagination
    let query = supabase
      .from('quotes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: quotes, error, count } = await query;

    if (error) {
      console.error('[Admin Quotes API] Error fetching quotes:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch quotes' },
        { 
          status: 500,
          headers: jsonHeaders
        }
      );
    }

    // Transform quotes to match frontend interface
    const transformedQuotes = (quotes || []).map((quote: any) => {
      // Calculate price if missing
      let amount = quote.estimated_price;
      if (!amount || amount === 0) {
        try {
          const pricingDetails = calcTotalSync({
            service: quote.service_type as any,
            bedrooms: quote.bedrooms || 0,
            bathrooms: quote.bathrooms || 1,
            extras: quote.extras || [],
            extrasQuantities: undefined
          }, 'one-time');
          // Convert Rands to cents for database storage
          amount = Math.round(pricingDetails.total * 100);
        } catch (error) {
          console.error(`[Admin Quotes API] Error calculating price for quote ${quote.id}:`, error);
          amount = 0;
        }
      } else {
        // If amount exists, check if it's in Rands (less than 1000) or cents (1000+)
        // If it's less than 100, it's likely in Rands and needs conversion
        // Standard/Airbnb: base prices are 200-300 Rands, so stored as 20000-30000 cents
        // Deep/Move In/Out: base prices are 900-1200 Rands, so stored as 90000-120000 cents
        // If we see values like 250, 230, 980, 1200, they're in Rands and need conversion
        if (amount < 10000) {
          // Likely stored in Rands, convert to cents
          console.log(`[Admin Quotes API] Converting quote ${quote.id} price from Rands to cents: ${amount} -> ${amount * 100}`);
          amount = Math.round(amount * 100);
        }
      }

      return {
        id: quote.id,
        customer_name: `${quote.first_name || ''} ${quote.last_name || ''}`.trim() || quote.email,
        customer_email: quote.email,
        service_type: quote.service_type,
        status: quote.status || 'pending',
        amount: amount, // amount is in cents
        created_at: quote.created_at,
      };
    });

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      ok: true,
      quotes: transformedQuotes,
      total,
      totalPages,
    }, {
      headers: jsonHeaders
    });
  } catch (error: any) {
    console.error('[Admin Quotes API] Error in quotes GET API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { 
        status: 500,
        headers: jsonHeaders
      }
    );
  }
}
































