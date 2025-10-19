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
    const { is_available } = body;

    // Validate input
    if (typeof is_available !== 'boolean') {
      return NextResponse.json(
        { ok: false, error: 'is_available must be a boolean' },
        { status: 400 }
      );
    }

    const supabase = await createCleanerSupabaseClient();

    // Update availability
    const { error } = await supabase
      .from('cleaners')
      .update({ is_available })
      .eq('id', session.id);

    if (error) {
      console.error('Error updating availability:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to update availability' },
        { status: 500 }
      );
    }

    console.log(
      is_available ? '✅' : '⏸️',
      session.name,
      'is now',
      is_available ? 'available' : 'unavailable'
    );

    return NextResponse.json({
      ok: true,
      is_available,
      message: `You are now ${is_available ? 'available' : 'unavailable'} for jobs`,
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
      .select('is_available')
      .eq('id', session.id)
      .single();

    if (error || !cleaner) {
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch availability' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      is_available: cleaner.is_available,
    });
  } catch (error) {
    console.error('Error in get availability route:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

