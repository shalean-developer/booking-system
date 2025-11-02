import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/financial/watchlist
 * Fetch account watchlist items (operational expenses)
 */
export async function GET(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    // Mock watchlist data - in production, this would come from an expenses/accounts table
    // These represent operational expense categories for a cleaning service
    const watchlist = [
      { name: 'Sponges', balance: 0 },
      { name: 'SMALL ITEMS EXPENSES', balance: 0 },
      { name: 'Green scrubbing pads', balance: 0 },
      { name: 'Fuel [uber work]', balance: 209.99 },
      { name: 'Borrowed funds', balance: -690.0 },
    ];

    return NextResponse.json({
      ok: true,
      watchlist,
    });
  } catch (error: any) {
    console.error('Error fetching watchlist:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

