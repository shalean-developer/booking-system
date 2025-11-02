import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/settings
 * Fetch company settings
 */
export async function GET(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Fetch settings from company_settings table
    const { data: settings, error } = await supabase
      .from('company_settings')
      .select('*')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is fine for first time
      console.error('Error fetching settings:', error);
      throw error;
    }

    // Return default settings if none exist
    const defaultSettings = {
      company_name: 'Shalean Cleaning Services',
      contact_email: 'info@shalean.com',
      contact_phone: '+27 21 123 4567',
      address: '',
      city: 'Cape Town',
      postal_code: '',
      business_hours: [
        { day: 'Monday', open: '08:00', close: '17:00', isOpen: true },
        { day: 'Tuesday', open: '08:00', close: '17:00', isOpen: true },
        { day: 'Wednesday', open: '08:00', close: '17:00', isOpen: true },
        { day: 'Thursday', open: '08:00', close: '17:00', isOpen: true },
        { day: 'Friday', open: '08:00', close: '17:00', isOpen: true },
        { day: 'Saturday', open: '09:00', close: '13:00', isOpen: true },
        { day: 'Sunday', open: '09:00', close: '13:00', isOpen: false },
      ],
    };

    return NextResponse.json({
      ok: true,
      settings: settings || defaultSettings,
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings
 * Update company settings
 */
export async function POST(req: Request) {
  try {
    if (!(await isAdmin())) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const supabase = await createClient();

    // Check if settings exist
    const { data: existing } = await supabase
      .from('company_settings')
      .select('id')
      .maybeSingle();

    if (existing) {
      // Update existing settings
      const { error } = await supabase
        .from('company_settings')
        .update({
          company_name: body.company_name,
          contact_email: body.contact_email,
          contact_phone: body.contact_phone,
          address: body.address,
          city: body.city,
          postal_code: body.postal_code,
          business_hours: body.business_hours,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Create new settings
      const { error } = await supabase.from('company_settings').insert({
        company_name: body.company_name,
        contact_email: body.contact_email,
        contact_phone: body.contact_phone,
        address: body.address,
        city: body.city,
        postal_code: body.postal_code,
        business_hours: body.business_hours,
      });

      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error saving settings:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to save settings' },
      { status: 500 }
    );
  }
}

