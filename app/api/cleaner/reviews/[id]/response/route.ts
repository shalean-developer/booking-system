import { NextRequest, NextResponse } from 'next/server';
import { getCleanerSession, createCleanerSupabaseClient, cleanerIdToUuid } from '@/lib/cleaner-auth';

/**
 * POST /api/cleaner/reviews/[id]/response
 * Add a response to a customer review
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await getCleanerSession();
    if (!session) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: reviewId } = await params;
    const supabase = await createCleanerSupabaseClient();
    const cleanerId = cleanerIdToUuid(session.id);

    // Verify cleaner owns this review
    const { data: review, error: reviewError } = await supabase
      .from('cleaner_reviews')
      .select('id, cleaner_id')
      .eq('id', reviewId)
      .eq('cleaner_id', cleanerId)
      .maybeSingle();

    if (reviewError || !review) {
      return NextResponse.json(
        { ok: false, error: 'Review not found or access denied' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { response_text } = body;

    if (!response_text || response_text.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Response text is required' },
        { status: 400 }
      );
    }

    // Update review with response
    const { data: updatedReview, error: updateError } = await supabase
      .from('cleaner_reviews')
      .update({
        cleaner_response: response_text.trim(),
        cleaner_response_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating review response:', updateError);
      return NextResponse.json(
        { ok: false, error: 'Failed to add response' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      review: updatedReview,
    });
  } catch (error) {
    console.error('Error in POST /api/cleaner/reviews/[id]/response:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

