import { NextResponse } from 'next/server';
import { fetchActivePricing } from '@/lib/pricing-db';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch active pricing from database
    const pricing = await fetchActivePricing();
    
    // Also get raw data from pricing_config table for more details
    const { data: rawData, error } = await supabase
      .from('pricing_config')
      .select('*')
      .eq('is_active', true)
      .lte('effective_date', new Date().toISOString().split('T')[0])
      .or('end_date.is.null,end_date.gt.' + new Date().toISOString().split('T')[0])
      .order('service_type', { ascending: true })
      .order('price_type', { ascending: true });

    if (error) {
      console.error('Error fetching raw pricing data:', error);
    }

    // Group services by service_type
    const servicesMap = new Map<string, {
      service_type: string;
      base: number;
      bedroom: number;
      bathroom: number;
      raw_records: any[];
    }>();

    // Process pricing data
    Object.entries(pricing.services).forEach(([serviceType, servicePricing]) => {
      servicesMap.set(serviceType, {
        service_type: serviceType,
        base: servicePricing.base,
        bedroom: servicePricing.bedroom,
        bathroom: servicePricing.bathroom,
        raw_records: [],
      });
    });

    // Add raw records to services
    if (rawData) {
      rawData.forEach((record) => {
        if (record.service_type) {
          const service = servicesMap.get(record.service_type);
          if (service) {
            service.raw_records.push({
              id: record.id,
              price_type: record.price_type,
              price: record.price,
              effective_date: record.effective_date,
              end_date: record.end_date,
              notes: record.notes,
            });
          }
        }
      });
    }

    const services = Array.from(servicesMap.values());

    return NextResponse.json({
      success: true,
      services: services,
      total_services: services.length,
      pricing_summary: {
        services_count: Object.keys(pricing.services).length,
        extras_count: Object.keys(pricing.extras).length,
        service_fee: pricing.serviceFee,
        frequency_discounts_count: Object.keys(pricing.frequencyDiscounts).length,
      },
      raw_data_count: rawData?.length || 0,
    });
  } catch (error: any) {
    console.error('Error checking services:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to check services',
      },
      { status: 500 }
    );
  }
}

