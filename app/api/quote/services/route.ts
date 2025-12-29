import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * API endpoint to fetch services and extra services for quote form
 * Public endpoint - no authentication required
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Fetch active services from database
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('service_type, display_name, icon, display_order, description')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch services' },
        { status: 500 }
      );
    }

    // Fetch active extra services from pricing_config
    // Use distinct to prevent duplicates, and get the most recent price for each item
    const { data: extras, error: extrasError } = await supabase
      .from('pricing_config')
      .select('item_name, price, effective_date')
      .eq('price_type', 'extra')
      .eq('is_active', true)
      .is('service_type', null) // Extras have null service_type
      .not('item_name', 'is', null)
      .order('item_name', { ascending: true })
      .order('effective_date', { ascending: false }); // Most recent first

    if (extrasError) {
      console.error('Error fetching extras:', extrasError);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch extra services' },
        { status: 500 }
      );
    }

    // Transform services data
    const transformedServices = (services || []).map((service) => ({
      id: service.service_type,
      label: service.display_name?.split(' ')[0] || service.service_type,
      subLabel: service.display_name?.split(' ').slice(1).join(' ') || 'Cleaning',
      description: service.description || '',
      icon: service.icon || null,
      displayOrder: service.display_order || 0,
    }));

    // Transform extras data and remove duplicates (case-insensitive, whitespace-normalized)
    // Since we ordered by effective_date DESC, the first occurrence of each item_name is the most recent
    const seenExtras = new Map<string, { id: string; label: string; price: number }>();
    const normalizedNames = new Map<string, string>(); // Maps normalized name to original name
    
    (extras || []).forEach((extra) => {
      if (!extra.item_name) return;
      // Normalize: trim whitespace and convert to lowercase for comparison
      const name = extra.item_name.trim();
      const normalizedName = name.toLowerCase().replace(/\s+/g, ' ').trim();
      
      // Check if we've seen this normalized name before
      if (normalizedNames.has(normalizedName)) {
        const originalName = normalizedNames.get(normalizedName)!;
        console.warn(`Duplicate extra service found in database: "${name}" (normalized: "${normalizedName}"). Original: "${originalName}". Using most recent price.`);
        return; // Skip this duplicate
      }
      
      // Store the normalized mapping and the extra
      normalizedNames.set(normalizedName, name);
      seenExtras.set(name, {
        id: name,
        label: name,
        price: extra.price || 0,
      });
    });

    const transformedExtras = Array.from(seenExtras.values());
    
    // Log summary for debugging
    if (extras && extras.length > transformedExtras.length) {
      console.log(`Deduplication: ${extras.length} extras found, ${transformedExtras.length} unique after deduplication`);
    }

    return NextResponse.json({
      ok: true,
      services: transformedServices,
      extras: transformedExtras,
    });
  } catch (error: any) {
    console.error('Error in quote services API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

