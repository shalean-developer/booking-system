import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/financial/accounts
 * Fetch bank account and payment gateway summaries
 */
export async function GET(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Calculate balances from bookings
    // Income accounts (completed bookings)
    const { data: completedBookings } = await supabase
      .from('bookings')
      .select('total_amount, payment_reference')
      .eq('status', 'completed');

    const totalIncome = (completedBookings || []).reduce(
      (sum, b) => sum + ((b.total_amount || 0) / 100),
      0
    );

    // Expense accounts (cleaner earnings)
    const { data: allBookings } = await supabase
      .from('bookings')
      .select('cleaner_earnings')
      .eq('status', 'completed');

    const totalExpenses = (allBookings || []).reduce(
      (sum, b) => sum + ((b.cleaner_earnings || 0) / 100),
      0
    );

    // Mock account structure - in production, this would come from a dedicated accounts table
    const accounts = [
      {
        name: 'Shalean Cleaning Services',
        balance: totalIncome * 0.6, // Main income account
        accountType: 'income' as const,
        uncategorized: 0,
      },
      {
        name: 'Paystack',
        balance: totalIncome * 0.4, // Payment gateway
        accountType: 'payment' as const,
        uncategorized: 0,
      },
      {
        name: 'DAILY INCOME ACCOUNT',
        balance: totalIncome * 0.3,
        accountType: 'income' as const,
        uncategorized: 0,
      },
      {
        name: 'DAILY EXPENSES ACCOUNT',
        balance: -totalExpenses * 0.8,
        accountType: 'expense' as const,
        uncategorized: 0,
      },
      {
        name: 'DAILY SAVINGS ACCOUNT',
        balance: (totalIncome - totalExpenses) * 0.2,
        accountType: 'savings' as const,
        uncategorized: 0,
      },
    ];

    return NextResponse.json({
      ok: true,
      accounts,
    });
  } catch (error: any) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

