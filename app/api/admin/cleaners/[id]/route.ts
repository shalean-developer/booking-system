import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient, isAdmin } from '@/lib/supabase-server';
import { hashPassword, normalizePhoneNumber, sanitizeCleanerForAdmin, validatePhoneNumber } from '@/lib/cleaner-auth';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    const { data: existing, error: fetchError } = await supabase
      .from('cleaners')
      .select('id, phone, auth_provider, password_hash')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !existing) {
      return NextResponse.json({ ok: false, error: 'Cleaner not found' }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return NextResponse.json({ ok: false, error: 'Name is required' }, { status: 400 });
      }
      updateData.name = name;
    }

    if (body.email !== undefined) {
      const email = String(body.email).trim();
      updateData.email = email || null;
    }

    if (body.phone !== undefined) {
      const normalizedPhone = normalizePhoneNumber(String(body.phone));
      if (!validatePhoneNumber(normalizedPhone)) {
        return NextResponse.json({ ok: false, error: 'Invalid phone number format' }, { status: 400 });
      }
      if (normalizedPhone !== existing.phone) {
        const { data: dup } = await supabase
          .from('cleaners')
          .select('id')
          .eq('phone', normalizedPhone)
          .neq('id', id)
          .maybeSingle();
        if (dup) {
          return NextResponse.json(
            { ok: false, error: `A cleaner with phone number ${normalizedPhone} already exists` },
            { status: 409 }
          );
        }
      }
      updateData.phone = normalizedPhone;
    }

    if (body.areas !== undefined) {
      if (!Array.isArray(body.areas) || body.areas.length === 0) {
        return NextResponse.json(
          { ok: false, error: 'At least one service area is required' },
          { status: 400 }
        );
      }
      updateData.areas = body.areas.map((a: string) => String(a).trim()).filter(Boolean);
      if ((updateData.areas as string[]).length === 0) {
        return NextResponse.json(
          { ok: false, error: 'At least one service area is required' },
          { status: 400 }
        );
      }
    }

    /** Named suburbs for V1 coverage (optional; falls back to `areas` when empty). */
    if (body.working_areas !== undefined) {
      const raw = body.working_areas;
      const arr = Array.isArray(raw)
        ? raw.map((a: string) => String(a).trim()).filter(Boolean)
        : String(raw)
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean);
      updateData.working_areas = arr;
    }

    if (body.coverage_radius_km !== undefined) {
      const n = parseInt(String(body.coverage_radius_km), 10);
      if (!Number.isFinite(n) || n < 1 || n > 200) {
        return NextResponse.json(
          { ok: false, error: 'coverage_radius_km must be between 1 and 200' },
          { status: 400 },
        );
      }
      updateData.coverage_radius_km = n;
    }

    if (body.is_active !== undefined) {
      updateData.is_active = Boolean(body.is_active);
    }

    if (body.is_available !== undefined) {
      updateData.is_available = Boolean(body.is_available);
    }

    /** New dashboard password (bcrypt hash stored server-side). */
    if (body.password !== undefined && body.password !== null && String(body.password).length > 0) {
      const password = String(body.password);
      if (password.length < 6) {
        return NextResponse.json(
          { ok: false, error: 'Password must be at least 6 characters long' },
          { status: 400 }
        );
      }
      updateData.password_hash = await hashPassword(password);
      const currentProvider = (existing.auth_provider as string) || 'both';
      if (currentProvider === 'otp' && body.auth_provider === undefined) {
        updateData.auth_provider = 'both';
      }
    }

    if (body.auth_provider !== undefined) {
      const ap = String(body.auth_provider);
      if (!['password', 'otp', 'both'].includes(ap)) {
        return NextResponse.json(
          { ok: false, error: 'Invalid auth_provider. Must be "password", "otp", or "both"' },
          { status: 400 }
        );
      }
      const willHaveHash =
        updateData.password_hash !== undefined
          ? true
          : Boolean(existing.password_hash);
      if ((ap === 'password' || ap === 'both') && !willHaveHash) {
        return NextResponse.json(
          {
            ok: false,
            error:
              'A password is required when password login is enabled. Send the new password in the same request.',
          },
          { status: 400 }
        );
      }
      updateData.auth_provider = ap;
    }

    let baseLocationRpcError: string | null = null;
    if (body.base_latitude !== undefined && body.base_longitude !== undefined) {
      const lat = Number(body.base_latitude);
      const lng = Number(body.base_longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        try {
          const svc = createServiceClient();
          const { error: rpcErr } = await svc.rpc('set_cleaner_base_location', {
            p_id: id,
            p_lat: lat,
            p_lng: lng,
          });
          if (rpcErr) {
            baseLocationRpcError = rpcErr.message;
          }
        } catch (e) {
          baseLocationRpcError = e instanceof Error ? e.message : 'RPC failed';
        }
      }
    }

    if (Object.keys(updateData).length === 0) {
      if (baseLocationRpcError) {
        return NextResponse.json({ ok: false, error: baseLocationRpcError }, { status: 500 });
      }
      if (body.base_latitude !== undefined && body.base_longitude !== undefined) {
        const { data: row, error: fetchErr } = await supabase
          .from('cleaners')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (fetchErr || !row) {
          return NextResponse.json({ ok: false, error: 'Cleaner not found' }, { status: 404 });
        }
        return NextResponse.json({
          ok: true,
          cleaner: sanitizeCleanerForAdmin(row as Record<string, unknown>),
        });
      }
      return NextResponse.json({ ok: false, error: 'No fields to update' }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabase
      .from('cleaners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating cleaner:', updateError);
      return NextResponse.json(
        { ok: false, error: updateError.message || 'Failed to update cleaner' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, cleaner: sanitizeCleanerForAdmin(updated as Record<string, unknown>) });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('PATCH /api/admin/cleaners/[id]:', error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
