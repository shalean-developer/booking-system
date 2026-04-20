import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, createCleanerSupabaseClient } from '@/lib/cleaner-auth';

export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { is_available, available_hours, service_areas } = body as {
      is_available?: boolean;
      available_hours?: Record<string, unknown>;
      service_areas?: string[];
    };

    if (
      is_available === undefined &&
      available_hours === undefined &&
      !Array.isArray(service_areas)
    ) {
      return NextResponse.json(
        { ok: false, error: 'Provide is_available, available_hours, and/or service_areas' },
        { status: 400 }
      );
    }

    // Validate input
    if (is_available !== undefined && typeof is_available !== 'boolean') {
      return NextResponse.json(
        { ok: false, error: 'is_available must be a boolean when provided' },
        { status: 400 }
      );
    }

    const supabase = await createCleanerSupabaseClient();

    const updates: Record<string, unknown> = {};
    if (typeof is_available === 'boolean') {
      updates.is_available = is_available;
    }
    if (Array.isArray(service_areas)) {
      updates.areas = service_areas;
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase.from('cleaners').update(updates).eq('id', session.id);

      if (error) {
        console.error('Error updating availability:', error);
        return NextResponse.json(
          { ok: false, error: 'Failed to update availability' },
          { status: 500 }
        );
      }
    }

    if (
      typeof is_available === 'boolean' ||
      available_hours !== undefined ||
      Array.isArray(service_areas)
    ) {
      const { data: extRow } = await supabase
        .from('cleaner_availability')
        .select('is_online, available_hours, service_areas')
        .eq('cleaner_id', session.id)
        .maybeSingle();
      const { data: cRow } = await supabase
        .from('cleaners')
        .select('is_available, areas')
        .eq('id', session.id)
        .single();

      const ext = extRow as {
        is_online?: boolean;
        available_hours?: unknown;
        service_areas?: string[];
      } | null;

      const payload = {
        cleaner_id: session.id,
        is_online:
          typeof is_available === 'boolean'
            ? is_available
            : (ext?.is_online ?? cRow?.is_available ?? true),
        available_hours:
          available_hours !== undefined && typeof available_hours === 'object'
            ? available_hours
            : (ext?.available_hours ?? {}),
        service_areas: Array.isArray(service_areas)
          ? service_areas
          : (ext?.service_areas?.length ? ext.service_areas : cRow?.areas ?? []),
        updated_at: new Date().toISOString(),
      };

      const up = await supabase.from('cleaner_availability').upsert(payload, {
        onConflict: 'cleaner_id',
      });
      if (up.error) {
        console.warn('[availability] cleaner_availability upsert:', up.error.message);
      }
    }

    const nextAvailable =
      typeof is_available === 'boolean' ? is_available : session.is_available;

    console.log(
      nextAvailable ? '✅' : '⏸️',
      session.name,
      'availability patch',
      typeof is_available === 'boolean' ? (is_available ? 'online' : 'offline') : ''
    );

    return NextResponse.json({
      ok: true,
      is_available: nextAvailable,
      message:
        typeof is_available === 'boolean'
          ? `You are now ${is_available ? 'available' : 'unavailable'} for jobs`
          : 'Saved',
    });
  } catch (error) {
    console.error('Error in availability update route:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check authentication
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = await createCleanerSupabaseClient();

    // Get cleaner's current availability
    const { data: cleaner, error } = await supabase
      .from('cleaners')
      .select('is_available, areas')
      .eq('id', session.id)
      .single();

    if (error || !cleaner) {
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch availability' },
        { status: 500 }
      );
    }

    const { data: ext } = await supabase
      .from('cleaner_availability')
      .select('is_online, available_hours, service_areas, updated_at')
      .eq('cleaner_id', session.id)
      .maybeSingle();

    const extRow = ext as {
      is_online?: boolean;
      available_hours?: unknown;
      service_areas?: string[];
      updated_at?: string;
    } | null;

    return NextResponse.json({
      ok: true,
      is_available: cleaner.is_available,
      is_online: extRow?.is_online ?? cleaner.is_available,
      available_hours: extRow?.available_hours ?? {},
      service_areas:
        extRow?.service_areas?.length ? extRow.service_areas : cleaner.areas ?? [],
    });
  } catch (error) {
    console.error('Error in get availability route:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

