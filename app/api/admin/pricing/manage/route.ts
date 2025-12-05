import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

interface ServicePricing {
  service_type: string;
  service_name: string;
  base: { id: string; price: number; effective_date: string; end_date: string | null } | null;
  bedroom: { id: string; price: number; effective_date: string; end_date: string | null } | null;
  bathroom: { id: string; price: number; effective_date: string; end_date: string | null } | null;
}

interface ExtraPricing {
  id: string;
  item_name: string;
  price: number;
  effective_date: string;
  end_date: string | null;
}

interface FrequencyDiscount {
  id: string;
  item_name: string;
  price: number;
  effective_date: string;
  end_date: string | null;
}

// GET: Fetch all pricing data organized by type
export async function GET(request: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabase = await createClient();

    // Fetch all active pricing config
    // Get the most recent active record for each price type
    const today = new Date().toISOString().split('T')[0];
    
    // Fetch all active pricing records
    const { data: pricingConfig, error } = await supabase
      .from('pricing_config')
      .select('*')
      .eq('is_active', true)
      .lte('effective_date', today)
      .or(`end_date.is.null,end_date.gte.${today}`)
      .order('service_type', { ascending: true })
      .order('price_type', { ascending: true })
      .order('item_name', { ascending: true })
      .order('effective_date', { ascending: false }); // Most recent first

    if (error) {
      console.error('Error fetching pricing config:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      return NextResponse.json(
        { ok: false, error: `Failed to fetch pricing data: ${error.message || 'Unknown error'}` },
        { status: 500 }
      );
    }

    // If no data, return empty structure
    if (!pricingConfig || pricingConfig.length === 0) {
      console.warn('No pricing config found in database');
      return NextResponse.json({
        ok: true,
        pricing: {
          services: [],
          extras: [],
          serviceFee: null,
          frequencyDiscounts: [],
        },
      });
    }

    // Fetch services for display names
    const { data: services } = await supabase
      .from('services')
      .select('service_type, display_name')
      .eq('is_active', true);

    const servicesMap = new Map(
      (services || []).map((s: any) => [s.service_type, s.display_name])
    );

    // Organize pricing by type
    const organizedPricing = {
      services: [] as ServicePricing[],
      extras: [] as ExtraPricing[],
      serviceFee: null as { id: string; price: number; effective_date: string; end_date: string | null } | null,
      frequencyDiscounts: [] as FrequencyDiscount[],
    };

    // Track seen combinations to get only the most recent
    const seenServices = new Map<string, boolean>();
    const seenExtras = new Map<string, boolean>();
    const seenDiscounts = new Map<string, boolean>();

    (pricingConfig || []).forEach((record: any) => {
      const price = parseFloat(record.price) || 0;
      const serviceName = record.service_type ? servicesMap.get(record.service_type) : null;

      switch (record.price_type) {
        case 'base':
        case 'bedroom':
        case 'bathroom':
          if (record.service_type) {
            const key = `${record.service_type}-${record.price_type}`;
            // Only use the first (most recent) record for each service-price_type combination
            if (!seenServices.has(key)) {
              seenServices.set(key, true);
              // Find or create service entry
              let serviceEntry = organizedPricing.services.find(
                (s) => s.service_type === record.service_type
              );
              if (!serviceEntry) {
                serviceEntry = {
                  service_type: record.service_type,
                  service_name: serviceName || record.service_type,
                  base: null as any,
                  bedroom: null as any,
                  bathroom: null as any,
                };
                organizedPricing.services.push(serviceEntry);
              }
              const priceType = record.price_type as 'base' | 'bedroom' | 'bathroom';
              if (priceType === 'base' || priceType === 'bedroom' || priceType === 'bathroom') {
                serviceEntry[priceType] = {
                  id: record.id,
                  price: price,
                  effective_date: record.effective_date,
                  end_date: record.end_date,
                };
              }
            }
          }
          break;

        case 'extra':
          if (record.item_name && !seenExtras.has(record.item_name)) {
            seenExtras.set(record.item_name, true);
            organizedPricing.extras.push({
              id: record.id,
              item_name: record.item_name,
              price: price,
              effective_date: record.effective_date,
              end_date: record.end_date,
            });
          }
          break;

        case 'service_fee':
          if (!organizedPricing.serviceFee) {
            organizedPricing.serviceFee = {
              id: record.id,
              price: price,
              effective_date: record.effective_date,
              end_date: record.end_date,
            };
          }
          break;

        case 'frequency_discount':
          if (record.item_name && !seenDiscounts.has(record.item_name)) {
            seenDiscounts.set(record.item_name, true);
            organizedPricing.frequencyDiscounts.push({
              id: record.id,
              item_name: record.item_name,
              price: price, // This is a percentage
              effective_date: record.effective_date,
              end_date: record.end_date,
            });
          }
          break;
      }
    });

    return NextResponse.json({
      ok: true,
      pricing: organizedPricing,
    });
  } catch (error: any) {
    console.error('Error in pricing manage GET API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Update pricing (create new record with new price)
export async function POST(request: NextRequest) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const supabase = await createClient();
    const body = await request.json();

    const {
      id, // Existing pricing config ID (optional - for updates)
      service_type,
      price_type,
      item_name,
      price,
      effective_date,
      end_date,
      notes,
    } = body;

    // Validate required fields
    if (!price_type || price === undefined || price === null) {
      return NextResponse.json(
        { ok: false, error: 'Price type and price are required' },
        { status: 400 }
      );
    }

    // Validate price
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice < 0) {
      return NextResponse.json(
        { ok: false, error: 'Price must be a valid positive number' },
        { status: 400 }
      );
    }

    // If updating existing record, deactivate old one and create new
    if (id) {
      // Deactivate old record
      await supabase
        .from('pricing_config')
        .update({
          is_active: false,
          end_date: effective_date || new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);
    }

    // Create new pricing record
    const { data, error } = await supabase
      .from('pricing_config')
      .insert({
        service_type: service_type || null,
        price_type,
        item_name: item_name || null,
        price: numericPrice,
        effective_date: effective_date || new Date().toISOString().split('T')[0],
        end_date: end_date || null,
        is_active: true,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating pricing record:', error);
      return NextResponse.json(
        { ok: false, error: 'Failed to save pricing' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      pricing: data,
      message: 'Pricing updated successfully',
    });
  } catch (error: any) {
    console.error('Error in pricing manage POST API:', error);
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

