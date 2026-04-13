import { NextRequest, NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';
import { normalizePhoneNumber, validatePhoneNumber } from '@/lib/cleaner-auth';

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
      .select('id, phone')
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

    if (body.is_active !== undefined) {
      updateData.is_active = Boolean(body.is_active);
    }

    if (body.is_available !== undefined) {
      updateData.is_available = Boolean(body.is_available);
    }

    if (Object.keys(updateData).length === 0) {
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

    return NextResponse.json({ ok: true, cleaner: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    console.error('PATCH /api/admin/cleaners/[id]:', error);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
