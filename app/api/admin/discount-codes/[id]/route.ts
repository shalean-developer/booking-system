import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// GET: Fetch a single discount code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { ok: false, error: 'Discount code not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      code: data,
    });
  } catch (error: any) {
    console.error('Error in discount code GET API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT: Update a discount code
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    // Validate discount type if provided
    if (body.discount_type && !['percentage', 'fixed'].includes(body.discount_type)) {
      return NextResponse.json(
        { ok: false, error: 'Discount type must be "percentage" or "fixed"' },
        { status: 400 }
      );
    }

    // Validate discount value if provided
    if (body.discount_value !== undefined) {
      const discountValue = parseFloat(body.discount_value);
      if (isNaN(discountValue) || discountValue < 0) {
        return NextResponse.json(
          { ok: false, error: 'Discount value must be a positive number' },
          { status: 400 }
        );
      }

      if (body.discount_type === 'percentage' && discountValue > 100) {
        return NextResponse.json(
          { ok: false, error: 'Percentage discount cannot exceed 100%' },
          { status: 400 }
        );
      }
    }

    // Check if code is being changed and if it already exists
    if (body.code) {
      const { data: existingCode } = await supabase
        .from('discount_codes')
        .select('id')
        .eq('code', body.code.toUpperCase().trim())
        .neq('id', id)
        .single();

      if (existingCode) {
        return NextResponse.json(
          { ok: false, error: 'Discount code already exists' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.code) updateData.code = body.code.toUpperCase().trim();
    if (body.description !== undefined) updateData.description = body.description;
    if (body.discount_type) updateData.discount_type = body.discount_type;
    if (body.discount_value !== undefined) updateData.discount_value = parseFloat(body.discount_value);
    if (body.min_purchase_amount !== undefined) updateData.min_purchase_amount = parseFloat(body.min_purchase_amount) || 0;
    if (body.max_discount_amount !== undefined) updateData.max_discount_amount = body.max_discount_amount ? parseFloat(body.max_discount_amount) : null;
    if (body.valid_from) updateData.valid_from = body.valid_from;
    if (body.valid_until !== undefined) updateData.valid_until = body.valid_until || null;
    if (body.usage_limit !== undefined) updateData.usage_limit = body.usage_limit ? parseInt(body.usage_limit) : null;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;
    if (body.applicable_services !== undefined) updateData.applicable_services = body.applicable_services || null;
    if (body.notes !== undefined) updateData.notes = body.notes;

    const { data, error } = await supabase
      .from('discount_codes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating discount code:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to update discount code' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      code: data,
      message: 'Discount code updated successfully',
    });
  } catch (error: any) {
    console.error('Error in discount code PUT API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a discount code
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const supabase = await createClient();

    // Check if discount code has been used (has related records in discount_code_usage)
    const { data: usageData, error: usageError } = await supabase
      .from('discount_code_usage')
      .select('id')
      .eq('discount_code_id', id)
      .limit(1);

    if (usageError && usageError.code !== 'PGRST116') {
      console.error('Error checking discount code usage:', usageError);
    }

    if (usageData && usageData.length > 0) {
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Cannot delete discount code that has been used. Deactivate it instead.' 
        },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('discount_codes')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting discount code:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to delete discount code' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      message: 'Discount code deleted successfully',
    });
  } catch (error: any) {
    console.error('Error in discount code DELETE API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

