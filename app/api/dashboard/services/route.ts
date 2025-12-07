import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { fetchActivePricing } from '@/lib/pricing-db';

/**
 * API endpoint to fetch popular services/extras for quick booking
 * Returns services that can be displayed as quick action buttons
 * Public endpoint - no authentication required
 */
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // Fetch active services from database
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('service_type, display_name, icon, display_order')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch services' },
        { status: 500 }
      );
    }

    // Fetch pricing to get available extras from database
    let pricing;
    try {
      pricing = await fetchActivePricing();
    } catch (error) {
      console.warn('Failed to fetch pricing, using fallback');
      pricing = null;
    }

    // Popular extras mapping (database name -> display name)
    const extrasDisplayMap: Record<string, { displayName: string; icon: string }> = {
      'Interior Windows': { displayName: 'Windows', icon: '✨' },
      'Laundry & Ironing': { displayName: 'Laundry', icon: '✨' },
      'Carpet Cleaning': { displayName: 'Carpet', icon: '✨' },
      'Deep': { displayName: 'Deep Clean', icon: '✨' },
    };

    // Get available extras from pricing (prioritize popular ones)
    const popularExtraKeys = ['Interior Windows', 'Laundry & Ironing', 'Carpet Cleaning'];
    
    // URL slug mapping for extras
    const extrasUrlMap: Record<string, string> = {
      'Interior Windows': 'interior-windows',
      'Laundry & Ironing': 'laundry-ironing',
      'Carpet Cleaning': 'carpet-cleaning',
    };
    
    const availableExtras = popularExtraKeys
      .filter(key => {
        if (!pricing) return true; // Show all if pricing unavailable
        return pricing.extras && pricing.extras[key] !== undefined;
      })
      .map(key => {
        const mapping = extrasDisplayMap[key] || { displayName: key, icon: '✨' };
        const urlSlug = extrasUrlMap[key] || key.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '').trim();
        return {
          id: key,
          name: mapping.displayName,
          fullName: key,
          icon: mapping.icon,
          type: 'extra' as const,
          href: `/booking/service/select?extras=${urlSlug}`,
        };
      });

    // Map main services to quick action format
    // Include: Standard, Deep, Move In/Out, Airbnb, and Carpet
    const allowedServiceTypes = ['Standard', 'Deep', 'Move In/Out', 'Airbnb', 'Carpet'];
    const quickServices = (services || [])
      .filter(s => allowedServiceTypes.includes(s.service_type))
      .map(service => {
        // Format display name (remove "Cleaning" suffix if present)
        let displayName = service.display_name;
        if (displayName.endsWith(' Cleaning')) {
          displayName = displayName.replace(' Cleaning', '');
        }
        // Special handling for specific services
        if (service.service_type === 'Move In/Out') {
          displayName = 'Move In/Out';
        } else if (service.service_type === 'Deep') {
          displayName = 'Deep'; // Show just "Deep" instead of "Deep Clean"
        }
        
        // Generate URL slug from service type
        const urlSlug = service.service_type.toLowerCase().replace(/\s+/g, '-').replace(/\//g, '-');
        
        return {
          id: service.service_type,
          name: displayName,
          fullName: service.display_name,
          icon: service.icon || '✨',
          type: 'service' as const,
          href: `/booking/service/${urlSlug}/details`,
        };
      })
      .sort((a, b) => {
        // Sort by display order: Standard, Deep, Move In/Out, Airbnb, Carpet
        const order = ['Standard', 'Deep', 'Move In/Out', 'Airbnb', 'Carpet'];
        return order.indexOf(a.id) - order.indexOf(b.id);
      });

    // Return all services (not just first 3)
    // The component will display Standard and Deep as buttons, and the rest in a dropdown
    return NextResponse.json({
      ok: true,
      services: quickServices,
    });

  } catch (error) {
    console.error('Error in services route:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

