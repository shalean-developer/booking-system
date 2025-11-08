import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

const splitFullName = (fullName: string) => {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { firstName: 'Customer', lastName: 'Account' };
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: 'Account' };
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
};

export async function PUT(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();
    const { fullName, phone, addressLine1, addressSuburb, addressCity } = payload;

    const derivedName = splitFullName(typeof fullName === 'string' ? fullName : '');

    const { data: existingCustomer, error: customerError } = await supabase
      .from('customers')
      .select('id, email')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (customerError) {
      return NextResponse.json(
        { ok: false, error: 'Failed to load profile', details: customerError.message },
        { status: 500 }
      );
    }

    let customerId = existingCustomer?.id;

    if (!existingCustomer) {
      const fallbackEmail = user.email ?? payload.email;
      if (!fallbackEmail) {
        return NextResponse.json(
          { ok: false, error: 'Email is required to create a profile' },
          { status: 400 }
        );
      }

      const { data: created, error: createError } = await supabase
        .from('customers')
        .insert({
          email: fallbackEmail,
          auth_user_id: user.id,
          first_name: derivedName.firstName,
          last_name: derivedName.lastName,
          phone,
          address_line1: addressLine1,
          address_suburb: addressSuburb,
          address_city: addressCity,
        })
        .select('id')
        .single();

      if (createError) {
        return NextResponse.json(
          { ok: false, error: 'Failed to create profile', details: createError.message },
          { status: 500 }
        );
      }

      customerId = created.id;
    } else {
      const { error: updateError } = await supabase
        .from('customers')
        .update({
          first_name: derivedName.firstName,
          last_name: derivedName.lastName,
          phone,
          address_line1: addressLine1,
          address_suburb: addressSuburb,
          address_city: addressCity,
        })
        .eq('id', existingCustomer.id);

      if (updateError) {
        return NextResponse.json(
          { ok: false, error: 'Failed to update profile', details: updateError.message },
          { status: 500 }
        );
      }
    }

    const { data: refreshedCustomer, error: refreshedError } = await supabase
      .from('customers')
      .select('id, email, first_name, last_name, phone, address_line1, address_suburb, address_city')
      .eq('id', customerId!)
      .single();

    if (refreshedError || !refreshedCustomer) {
      return NextResponse.json(
        { ok: false, error: 'Failed to load updated profile', details: refreshedError?.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      customer: {
        id: refreshedCustomer.id,
        email: refreshedCustomer.email,
        firstName: refreshedCustomer.first_name,
        lastName: refreshedCustomer.last_name,
        phone: refreshedCustomer.phone,
        addressLine1: refreshedCustomer.address_line1,
        addressSuburb: refreshedCustomer.address_suburb,
        addressCity: refreshedCustomer.address_city,
      },
    });
  } catch (error) {
    console.error('Profile update error', error);
    return NextResponse.json(
      {
        ok: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}


