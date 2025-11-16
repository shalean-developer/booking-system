import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, createCleanerSupabaseClient, setCleanerSession } from '@/lib/cleaner-auth';

export const dynamic = 'force-dynamic';

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

    // Get cleaner's personal info
    const { data: cleaner, error } = await supabase
      .from('cleaners')
      .select('id, name, phone, email, photo_url')
      .eq('id', session.id)
      .single();

    if (error || !cleaner) {
      console.error('Error fetching cleaner info:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch personal info' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      personal_info: {
        name: cleaner.name || '',
        phone: cleaner.phone || '',
        email: cleaner.email || '',
        photo_url: cleaner.photo_url || '',
      },
    });
  } catch (error) {
    console.error('Error in get personal info route:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

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
    const { name, phone, email, photo_url } = body;

    // Validate input
    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json(
        { ok: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    if (phone !== undefined && typeof phone !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'Phone must be a string' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: {
      name?: string;
      phone?: string;
      email?: string | null;
      photo_url?: string | null;
      updated_at?: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name.trim();
    if (phone !== undefined) updateData.phone = phone.trim() || null;
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (photo_url !== undefined) updateData.photo_url = photo_url?.trim() || null;

    const supabase = await createCleanerSupabaseClient();

    // Update personal info
    const { data: updatedCleaner, error } = await supabase
      .from('cleaners')
      .update(updateData)
      .eq('id', session.id)
      .select('id, name, phone, email, photo_url, areas, is_available, rating, available_monday, available_tuesday, available_wednesday, available_thursday, available_friday, available_saturday, available_sunday')
      .single();

    if (error || !updatedCleaner) {
      console.error('Error updating personal info:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to update personal info' },
        { status: 500 }
      );
    }

    // Update session with new info
    await setCleanerSession({
      id: updatedCleaner.id,
      name: updatedCleaner.name,
      phone: updatedCleaner.phone || '',
      photo_url: updatedCleaner.photo_url,
      areas: updatedCleaner.areas,
      is_available: updatedCleaner.is_available,
      rating: updatedCleaner.rating,
      available_monday: updatedCleaner.available_monday || undefined,
      available_tuesday: updatedCleaner.available_tuesday || undefined,
      available_wednesday: updatedCleaner.available_wednesday || undefined,
      available_thursday: updatedCleaner.available_thursday || undefined,
      available_friday: updatedCleaner.available_friday || undefined,
      available_saturday: updatedCleaner.available_saturday || undefined,
      available_sunday: updatedCleaner.available_sunday || undefined,
    });

    console.log('✅ Personal info updated for:', updatedCleaner.name);

    return NextResponse.json({
      ok: true,
      personal_info: {
        name: updatedCleaner.name || '',
        phone: updatedCleaner.phone || '',
        email: updatedCleaner.email || '',
        photo_url: updatedCleaner.photo_url || '',
      },
      message: 'Personal info updated successfully',
    });
  } catch (error) {
    console.error('Error in update personal info route:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

