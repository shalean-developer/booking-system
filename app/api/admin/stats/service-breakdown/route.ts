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

    // Fetch all bookings with service types
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('service_type');

    if (error) {
      console.error('Error fetching bookings for service breakdown:', error);
      return NextResponse.json({
        ok: true,
        data: [],
      });
    }

    // Group by service type
    const serviceCounts: Record<string, number> = {};
    
    (bookings || []).forEach((booking) => {
      const serviceType = booking.service_type || 'Unknown';
      serviceCounts[serviceType] = (serviceCounts[serviceType] || 0) + 1;
    });

    // Convert to array format expected by component
    const data = Object.entries(serviceCounts).map(([name, value]) => ({
      name,
      value,
    }));

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
