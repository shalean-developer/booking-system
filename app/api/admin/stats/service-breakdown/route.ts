import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';
import {
  matchBookingServiceToCatalog,
  type ServiceCatalogRow,
} from '@/lib/admin-service-type-match';

export const dynamic = 'force-dynamic';

const FALLBACK_CATALOG: ServiceCatalogRow[] = [
  { service_type: 'Standard', display_name: 'Standard', display_order: 1 },
  { service_type: 'Deep', display_name: 'Deep', display_order: 2 },
  { service_type: 'Move In/Out', display_name: 'Move In/Out', display_order: 3 },
  { service_type: 'Airbnb', display_name: 'Airbnb', display_order: 4 },
  { service_type: 'Carpet', display_name: 'Carpet', display_order: 5 },
];

export async function GET(request: NextRequest) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    const { data: catalogRows, error: catalogError } = await supabase
      .from('services')
      .select('service_type, display_name, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    const catalog: ServiceCatalogRow[] =
      !catalogError && catalogRows && catalogRows.length > 0
        ? (catalogRows as ServiceCatalogRow[])
        : FALLBACK_CATALOG;

    const catalogKeys = catalog.map((c) => c.service_type);

    // Get date range from query params
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    
    // Helper function to get local date string (YYYY-MM-DD) to avoid timezone issues
    const getLocalDateString = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // PostgREST returns at most 1000 rows per request. Aggregate counts require every row
    // in range, so we page in stable order by id.
    const PAGE = 1000;
    const MAX_PAGES = 500;
    const bookings: { service_type: string | null }[] = [];

    for (let page = 0; page < MAX_PAGES; page++) {
      const from = page * PAGE;
      const to = from + PAGE - 1;

      let q = supabase
        .from('bookings')
        .select('service_type')
        .order('id', { ascending: true })
        .range(from, to);

      if (dateFrom && dateTo) {
        const dateFromStr = getLocalDateString(new Date(dateFrom));
        const dateToStr = getLocalDateString(new Date(dateTo));
        q = q
          .not('booking_date', 'is', null)
          .gte('booking_date', dateFromStr)
          .lte('booking_date', dateToStr);
      }

      const { data: batch, error } = await q;

      if (error) {
        console.error('Error fetching bookings for service breakdown:', error);
        return NextResponse.json({
          ok: true,
          data: [],
        });
      }

      if (!batch?.length) break;
      bookings.push(...batch);
      if (batch.length < PAGE) break;
    }

    const counts: Record<string, number> = Object.fromEntries(catalogKeys.map((k) => [k, 0]));
    let otherCount = 0;

    for (const booking of bookings) {
      const key = matchBookingServiceToCatalog(booking.service_type, catalogKeys);
      if (key && key in counts) {
        counts[key] += 1;
      } else {
        otherCount += 1;
      }
    }

    const data: { name: string; value: number }[] = catalog.map((row) => ({
      name: row.display_name?.trim() || row.service_type,
      value: counts[row.service_type] ?? 0,
    }));

    if (otherCount > 0) {
      data.push({ name: 'Other', value: otherCount });
    }

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
