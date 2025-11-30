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

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    
    // Fetch bookings with service types, with optional date filtering
    let query = supabase
      .from('bookings')
      .select('service_type');
    
    // Apply date filters if provided
    if (dateFrom && dateTo) {
      query = query
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo);
    }
    
    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching bookings for service breakdown:', error);
      return NextResponse.json({
        ok: true,
        data: [],
      });
    }

    // Normalize service type names to merge duplicates
    const normalizeServiceType = (serviceType: string | null): string => {
      if (!serviceType) return 'Unknown';
      const normalized = serviceType.trim();
      // Merge variations of Standard
      if (normalized.toLowerCase().includes('standard') && normalized.toLowerCase().includes('home')) {
        return 'Standard';
      }
      if (normalized.toLowerCase() === 'standard home cleaning') {
        return 'Standard';
      }
      // Keep other types as-is
      return normalized;
    };

    // Group by normalized service type
    const serviceCounts: Record<string, number> = {};
    
    (bookings || []).forEach((booking) => {
      const normalizedType = normalizeServiceType(booking.service_type);
      serviceCounts[normalizedType] = (serviceCounts[normalizedType] || 0) + 1;
    });

    // Convert to array and sort by value (descending)
    const data = Object.entries(serviceCounts)
      .map(([name, value]) => ({
      name,
      value,
      }))
      .sort((a, b) => b.value - a.value); // Sort by count descending

    return NextResponse.json({
      ok: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching service breakdown:', error);
    return NextResponse.json({
      ok: true,
      data: [],
    });
  }
}
