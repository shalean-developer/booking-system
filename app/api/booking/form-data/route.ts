import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { fetchActivePricing } from '@/lib/pricing-db';
import { fetchServicesMetadata } from '@/lib/pricing-db';

/**
 * API endpoint to fetch all booking form data (services, extras, pricing)
 * Public endpoint - no authentication required
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Run all independent database queries in parallel for better performance
    const [
      servicesMetadata,
      pricingData,
      extrasResult,
      equipmentResult,
      equipmentChargeResult,
    ] = await Promise.all([
      // Fetch services metadata
      fetchServicesMetadata(),
      // Fetch pricing data
      fetchActivePricing(),
      // Fetch extras metadata from pricing_config
      supabase
        .from('pricing_config')
        .select('item_name, price, effective_date, notes')
        .eq('price_type', 'extra')
        .eq('is_active', true)
        .is('service_type', null)
        .not('item_name', 'is', null)
        .order('item_name', { ascending: true })
        .order('effective_date', { ascending: false }),
      // Fetch equipment items
      supabase
        .from('equipment_items')
        .select('id, name, display_order')
        .eq('is_active', true)
        .order('display_order', { ascending: true }),
      // Fetch equipment charge price
      supabase
        .from('pricing_config')
        .select('price')
        .eq('price_type', 'equipment_charge')
        .eq('is_active', true)
        .is('service_type', null)
        .order('effective_date', { ascending: false })
        .limit(1)
        .single(),
    ]);

    // Handle errors from parallel queries
    const { data: extrasData, error: extrasError } = extrasResult;
    if (extrasError) {
      console.error('Error fetching extras metadata:', extrasError);
    }

    const { data: equipmentItems, error: equipmentError } = equipmentResult;
    if (equipmentError) {
      console.error('Error fetching equipment items:', equipmentError);
    }

    const { data: equipmentChargeData, error: equipmentChargeError } = equipmentChargeResult;
    if (equipmentChargeError) {
      console.error('Error fetching equipment charge:', equipmentChargeError);
    }

    const equipmentCharge = equipmentChargeData?.price ? Number(equipmentChargeData.price) : 500; // Default to R500

    // Transform services data with icons from lucide-react mapping
    const iconMap: Record<string, string> = {
      '🏠': 'Home',
      '✨': 'Star',
      '🏢': 'Building',
      '📅': 'Calendar',
      '🧹': 'Home',
      'Home': 'Home',
      'Star': 'Star',
      'Building': 'Building',
      'Calendar': 'Calendar',
    };

    const transformedServices = servicesMetadata.map((service) => {
      // Map icon emoji/text to lucide-react icon name
      const iconName = service.icon ? iconMap[service.icon] || 'Home' : 'Home';
      
      return {
        type: service.service_type as 'Standard' | 'Deep' | 'Move In/Out' | 'Airbnb' | 'Carpet',
        label: service.display_name,
        subLabel: service.description || '',
        description: service.description || '',
        checklist: [], // Can be added to services table later
        badge: service.service_type === 'Standard' ? ('Popular' as const) : undefined,
        icon: iconName,
        image: service.image_url || `/images/service-${service.service_type.toLowerCase().replace(/\s+/g, '-')}-cleaning.jpg`,
        displayOrder: service.display_order,
      };
    });

    // Transform extras - deduplicate and get most recent price
    const seenExtras = new Map<string, { name: string; price: number; blurb: string }>();
    const normalizedNames = new Map<string, string>();
    
    (extrasData || []).forEach((extra) => {
      if (!extra.item_name) return;
      
      const name = extra.item_name.trim();
      const normalizedName = name.toLowerCase().replace(/\s+/g, ' ').trim();
      
      if (normalizedNames.has(normalizedName)) {
        return; // Skip duplicates
      }
      
      normalizedNames.set(normalizedName, name);
      seenExtras.set(name, {
        name,
        price: Number(extra.price) || 0,
        blurb: extra.notes || '',
      });
    });

    // Build extras metadata object
    const extrasMeta: Record<string, { blurb: string }> = {};
    seenExtras.forEach((extra) => {
      extrasMeta[extra.name] = { blurb: extra.blurb };
    });

    // Determine which extras are allowed for which services
    const allExtrasList = Array.from(seenExtras.keys());
    // Standard/Airbnb extras: include Laundry and Ironing (as separate items if they exist, or combined)
    const standardAndAirbnbExtrasList = ['Inside Fridge', 'Inside Oven', 'Interior Walls', 'Interior Windows', 'Inside Cabinets', 'Laundry & Ironing', 'Laundry', 'Ironing'];
    const standardAndAirbnbExtras = allExtrasList.filter((extra) => {
      return standardAndAirbnbExtrasList.includes(extra);
    });
    // Deep and Move In/Out extras: exclude Standard/Airbnb extras (including Laundry, Ironing, and Laundry & Ironing)
    const deepAndMoveExtras = allExtrasList.filter((extra) => 
      !standardAndAirbnbExtras.includes(extra) && 
      extra !== 'Laundry & Ironing' && 
      extra !== 'Laundry' && 
      extra !== 'Ironing'
    );

    // Determine quantity extras (extras that can have quantities > 1)
    const quantityExtras = new Set(
      allExtrasList.filter((extra) => 
        ['Carpet Cleaning', 'Couch Cleaning', 'Ceiling Cleaning', 'Mattress Cleaning'].includes(extra)
      )
    );

    return NextResponse.json({
      ok: true,
      services: transformedServices,
      pricing: pricingData,
      extras: {
        all: allExtrasList,
        standardAndAirbnb: standardAndAirbnbExtras,
        deepAndMove: deepAndMoveExtras,
        quantityExtras: Array.from(quantityExtras),
        meta: extrasMeta,
        prices: Object.fromEntries(
          Array.from(seenExtras.entries()).map(([name, data]) => [name, data.price])
        ),
      },
      equipment: {
        items: (equipmentItems || []).map(item => item.name),
        charge: equipmentCharge,
      },
    });
  } catch (error: any) {
    console.error('Error in booking form data API:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error.message || 'Internal server error',
        // Return fallback data structure
        services: [],
        pricing: null,
        extras: {
          all: [],
          standardAndAirbnb: [],
          deepAndMove: [],
          quantityExtras: [],
          meta: {},
          prices: {},
        },
        equipment: {
          items: [],
          charge: 500,
        },
      },
      { status: 500 }
    );
  }
}

