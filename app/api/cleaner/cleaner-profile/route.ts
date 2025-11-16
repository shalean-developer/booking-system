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

    // Get cleaner's profile info
    const { data: cleaner, error } = await supabase
      .from('cleaners')
      .select('id, bio, years_experience, specialties, areas, photo_url, name, phone, is_available, rating, available_monday, available_tuesday, available_wednesday, available_thursday, available_friday, available_saturday, available_sunday')
      .eq('id', session.id)
      .single();

    if (error || !cleaner) {
      console.error('Error fetching cleaner profile:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch cleaner profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      profile: {
        bio: cleaner.bio || '',
        years_experience: cleaner.years_experience || 0,
        specialties: cleaner.specialties || [],
        areas: cleaner.areas || [],
        photo_url: cleaner.photo_url || '',
      },
    });
  } catch (error) {
    console.error('Error in get cleaner profile route:', error);
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
    const { bio, years_experience, specialties, areas } = body;

    // Validate input
    if (years_experience !== undefined && (typeof years_experience !== 'number' || years_experience < 0)) {
      return NextResponse.json(
        { ok: false, error: 'Years of experience must be a non-negative number' },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: {
      bio?: string | null;
      years_experience?: number | null;
      specialties?: string[] | null;
      areas?: string[];
      updated_at?: string;
    } = {
      updated_at: new Date().toISOString(),
    };

    if (bio !== undefined) updateData.bio = bio?.trim() || null;
    if (years_experience !== undefined) updateData.years_experience = years_experience || null;
    if (specialties !== undefined) {
      if (Array.isArray(specialties)) {
        updateData.specialties = specialties.filter(s => s.trim()).length > 0 ? specialties.filter(s => s.trim()) : null;
      } else if (typeof specialties === 'string') {
        const specialtiesArray = specialties.split(',').map(s => s.trim()).filter(s => s.length > 0);
        updateData.specialties = specialtiesArray.length > 0 ? specialtiesArray : null;
      } else {
        updateData.specialties = null;
      }
    }
    if (areas !== undefined) {
      if (Array.isArray(areas)) {
        updateData.areas = areas.filter(a => a.trim()).length > 0 ? areas.filter(a => a.trim()) : [];
      } else if (typeof areas === 'string') {
        const areasArray = areas.split(',').map(a => a.trim()).filter(a => a.length > 0);
        updateData.areas = areasArray.length > 0 ? areasArray : [];
      } else {
        updateData.areas = [];
      }
    }

    const supabase = await createCleanerSupabaseClient();

    // Update cleaner profile
    const { data: updatedCleaner, error } = await supabase
      .from('cleaners')
      .update(updateData)
      .eq('id', session.id)
      .select('id, name, phone, email, photo_url, areas, is_available, rating, bio, years_experience, specialties, available_monday, available_tuesday, available_wednesday, available_thursday, available_friday, available_saturday, available_sunday')
      .single();

    if (error || !updatedCleaner) {
      console.error('Error updating cleaner profile:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to update cleaner profile' },
        { status: 500 }
      );
    }

    // Update session with new info
    await setCleanerSession({
      id: updatedCleaner.id,
      name: updatedCleaner.name,
      phone: updatedCleaner.phone || '',
      photo_url: updatedCleaner.photo_url,
      areas: updatedCleaner.areas || [],
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

    console.log('✅ Cleaner profile updated for:', updatedCleaner.name);

    return NextResponse.json({
      ok: true,
      profile: {
        bio: updatedCleaner.bio || '',
        years_experience: updatedCleaner.years_experience || 0,
        specialties: updatedCleaner.specialties || [],
        areas: updatedCleaner.areas || [],
        photo_url: updatedCleaner.photo_url || '',
      },
      message: 'Cleaner profile updated successfully',
    });
  } catch (error) {
    console.error('Error in update cleaner profile route:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

