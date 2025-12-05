import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const supabase = await createClient();

    const { data: customer, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !customer) {
      return NextResponse.json(
        { ok: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      customer,
    });
  } catch (error: any) {
    console.error('Error fetching customer:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const supabase = await createClient();

    // Check if customer exists
    const { data: existingCustomer, error: fetchError } = await supabase
      .from('customers')
      .select('id, email')
      .eq('id', id)
      .single();

    if (fetchError || !existingCustomer) {
      return NextResponse.json(
        { ok: false, error: 'Customer not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    // Validate and add fields
    if (body.first_name !== undefined) {
      if (!body.first_name || !body.first_name.trim()) {
        return NextResponse.json(
          { ok: false, error: 'First name is required' },
          { status: 400 }
        );
      }
      updateData.first_name = body.first_name.trim();
    }

    if (body.last_name !== undefined) {
      if (!body.last_name || !body.last_name.trim()) {
        return NextResponse.json(
          { ok: false, error: 'Last name is required' },
          { status: 400 }
        );
      }
      updateData.last_name = body.last_name.trim();
    }

    if (body.email !== undefined) {
      const email = body.email.trim().toLowerCase();
      if (!email || !email.includes('@')) {
        return NextResponse.json(
          { ok: false, error: 'Valid email is required' },
          { status: 400 }
        );
      }

      // Check if email is already taken by another customer
      if (email !== existingCustomer.email) {
        const { data: emailCheck } = await supabase
          .from('customers')
          .select('id')
          .eq('email', email)
          .neq('id', id)
          .maybeSingle();

        if (emailCheck) {
          return NextResponse.json(
            { ok: false, error: 'Email is already in use by another customer' },
            { status: 409 }
          );
        }
      }

      updateData.email = email;
    }

    if (body.phone !== undefined) {
      updateData.phone = body.phone ? body.phone.trim() : null;
    }

    if (body.address_line1 !== undefined) {
      updateData.address_line1 = body.address_line1 ? body.address_line1.trim() : null;
    }

    if (body.address_suburb !== undefined) {
      updateData.address_suburb = body.address_suburb ? body.address_suburb.trim() : null;
    }

    if (body.address_city !== undefined) {
      updateData.address_city = body.address_city ? body.address_city.trim() : null;
    }

    // Update the customer
    const { data: updatedCustomer, error: updateError } = await supabase
      .from('customers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating customer:', updateError);
      return NextResponse.json(
        { ok: false, error: 'Failed to update customer' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      customer: updatedCustomer,
    });
  } catch (error: any) {
    console.error('Error updating customer:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}


