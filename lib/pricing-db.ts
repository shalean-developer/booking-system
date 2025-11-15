// Database access layer for dynamic pricing with caching
import { supabase } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

// Service metadata interface
export interface ServiceMetadata {
  id: string;
  service_type: string;
  display_name: string;
  icon: string | null;
  image_url: string | null;
  display_order: number;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Types for pricing data
export interface PricingRecord {
  id: string;
  service_type: string | null;
  price_type: 'base' | 'bedroom' | 'bathroom' | 'extra' | 'service_fee' | 'frequency_discount';
  item_name: string | null;
  price: number;
  effective_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  notes: string | null;
}

export interface PricingHistoryRecord {
  id: string;
  pricing_config_id: string;
  service_type: string | null;
  price_type: string;
  item_name: string | null;
  old_price: number | null;
  new_price: number;
  changed_by: string | null;
  changed_at: string;
  change_reason: string | null;
  effective_date: string | null;
  end_date: string | null;
}

export interface ServicePricing {
  base: number;
  bedroom: number;
  bathroom: number;
}

export interface PricingData {
  services: {
    [key: string]: ServicePricing;
  };
  extras: {
    [key: string]: number;
  };
  serviceFee: number;
  frequencyDiscounts: {
    [key: string]: number; // percentage
  };
}

// Cache configuration
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
let cachedPricing: PricingData | null = null;
let cacheTimestamp: number = 0;
let fetchingPromise: Promise<PricingData> | null = null; // Prevent duplicate parallel fetches

/**
 * Check if cache is still valid
 */
function isCacheValid(): boolean {
  return cachedPricing !== null && Date.now() - cacheTimestamp < CACHE_DURATION;
}

/**
 * Clear the pricing cache
 */
export function clearPricingCache(): void {
  cachedPricing = null;
  cacheTimestamp = 0;
  console.log('🔄 Pricing cache cleared');
}

/**
 * Fetch active pricing from database with caching
 */
export async function fetchActivePricing(forceRefresh = false): Promise<PricingData> {
  // Return cached data if valid and not forcing refresh
  if (!forceRefresh && isCacheValid() && cachedPricing) {
    console.log('✅ Returning cached pricing');
    return cachedPricing;
  }

  // If already fetching, return the existing promise (prevent duplicate parallel fetches)
  if (fetchingPromise) {
    console.log('⏳ Waiting for existing pricing fetch...');
    return fetchingPromise;
  }

  console.log('🔄 Fetching fresh pricing from database...');
  
  // Create and store the fetch promise to prevent duplicate parallel fetches
  fetchingPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_config')
        .select('*')
        .eq('is_active', true)
        .lte('effective_date', new Date().toISOString().split('T')[0])
        .or('end_date.is.null,end_date.gt.' + new Date().toISOString().split('T')[0]);

      if (error) {
        const errorMessage = error?.message || error?.toString() || 'Unknown error';
        throw new Error(`Failed to fetch pricing: ${errorMessage}`);
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ No active pricing found in database');
        throw new Error('No active pricing configuration found');
      }

      // Transform database records into structured pricing data
      const pricing: PricingData = {
        services: {},
        extras: {},
        serviceFee: 0,
        frequencyDiscounts: {},
      };

      // Track duplicates and validate prices
      const seenExtras = new Set<string>();
      const seenServiceFees: number[] = [];
      const servicePricingTracker: Record<string, { base: number[], bedroom: number[], bathroom: number[] }> = {};

      data.forEach((record: any) => {
        const { service_type, price_type, item_name, price } = record;
        const numericPrice = Number(price);

        switch (price_type) {
          case 'base':
          case 'bedroom':
          case 'bathroom':
            if (service_type) {
              if (!pricing.services[service_type]) {
                pricing.services[service_type] = { base: 0, bedroom: 0, bathroom: 0 };
                servicePricingTracker[service_type] = { base: [], bedroom: [], bathroom: [] };
              }
              
              // Track all values to detect duplicates
              servicePricingTracker[service_type][price_type as 'base' | 'bedroom' | 'bathroom'].push(numericPrice);
              
              // Use the last value (most recent effective date)
              pricing.services[service_type][price_type as keyof ServicePricing] = numericPrice;
            }
            break;

          case 'extra':
            if (item_name) {
              // Check for duplicates
              if (seenExtras.has(item_name)) {
                console.warn(`⚠️ Duplicate extra found in database: ${item_name}. Previous: ${pricing.extras[item_name]}, New: ${numericPrice}`);
              }
              seenExtras.add(item_name);
              pricing.extras[item_name] = numericPrice;
            }
            break;

          case 'service_fee':
            seenServiceFees.push(numericPrice);
            // Use the last value (most recent)
            pricing.serviceFee = numericPrice;
            break;

          case 'frequency_discount':
            if (item_name) {
              pricing.frequencyDiscounts[item_name] = numericPrice;
            }
            break;
        }
      });

      // Validate pricing data
      const validationErrors: string[] = [];
      const validationWarnings: string[] = [];
      
      // Validate Standard service pricing
      if (pricing.services['Standard']) {
        const standard = pricing.services['Standard'];
        if (standard.base > 500) {
          validationErrors.push(`Standard base price too high: R${standard.base} (expected ~R250) - fallback will be used`);
        }
        if (standard.bedroom > 50) {
          validationErrors.push(`Standard bedroom price too high: R${standard.bedroom} (expected R20) - fallback will be used`);
        }
        if (standard.bathroom > 50) {
          validationErrors.push(`Standard bathroom price too high: R${standard.bathroom} (expected R30) - fallback will be used`);
        }
      }

      // Validate service fee
      if (pricing.serviceFee > 0 && pricing.serviceFee !== 50 && pricing.serviceFee !== 40) {
        validationWarnings.push(`Service fee unusual: R${pricing.serviceFee} (expected R50) - fallback will be used if invalid`);
      }
      if (seenServiceFees.length > 1) {
        validationWarnings.push(`Multiple service fees found: ${seenServiceFees.join(', ')}. Using last: R${pricing.serviceFee}`);
      }

      // Log detailed pricing breakdown
      console.log('📊 Detailed Database Pricing Breakdown:', {
        services: Object.entries(pricing.services).map(([service, prices]) => ({
          service,
          base: prices.base,
          bedroom: prices.bedroom,
          bathroom: prices.bathroom,
          duplicates: {
            base: servicePricingTracker[service]?.base.length > 1 ? servicePricingTracker[service].base : undefined,
            bedroom: servicePricingTracker[service]?.bedroom.length > 1 ? servicePricingTracker[service].bedroom : undefined,
            bathroom: servicePricingTracker[service]?.bathroom.length > 1 ? servicePricingTracker[service].bathroom : undefined,
          }
        })),
        extras: Object.entries(pricing.extras).slice(0, 10), // First 10 extras
        extrasCount: Object.keys(pricing.extras).length,
        serviceFee: pricing.serviceFee,
        serviceFeeDuplicates: seenServiceFees.length > 1 ? seenServiceFees : undefined,
        frequencyDiscounts: pricing.frequencyDiscounts,
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined,
        validationWarnings: validationWarnings.length > 0 ? validationWarnings : undefined,
      });

      // Log validation errors (critical issues that will trigger fallback)
      if (validationErrors.length > 0) {
        console.warn('⚠️ Database Pricing Validation Issues (fallback pricing will be used automatically):', validationErrors);
        console.info('ℹ️ The application will automatically use fallback pricing values to ensure correct calculations.');
      }
      
      // Log validation warnings (non-critical issues)
      if (validationWarnings.length > 0) {
        console.warn('⚠️ Database Pricing Warnings:', validationWarnings);
      }

      // Update cache
      cachedPricing = pricing;
      cacheTimestamp = Date.now();

      console.log('✅ Pricing fetched and cached:', {
        services: Object.keys(pricing.services).length,
        extras: Object.keys(pricing.extras).length,
        serviceFee: pricing.serviceFee,
        frequencyDiscounts: Object.keys(pricing.frequencyDiscounts).length,
      });

      return pricing;
    } catch (error) {
      // Re-throw if it's already an Error with message, otherwise wrap it
      if (error instanceof Error) {
        throw error;
      }
      const errorMessage = error?.toString() || 'Unknown error occurred while fetching pricing';
      throw new Error(errorMessage);
    } finally {
      // Clear the fetching promise so future calls can fetch fresh data
      fetchingPromise = null;
    }
  })();

  return fetchingPromise;
}

/**
 * Fetch pricing history with optional filters
 */
export async function fetchPricingHistory(filters?: {
  priceType?: string;
  serviceType?: string;
  itemName?: string;
  limit?: number;
}): Promise<PricingHistoryRecord[]> {
  try {
    let query = supabase
      .from('pricing_history')
      .select('*')
      .order('changed_at', { ascending: false });

    if (filters?.priceType) {
      query = query.eq('price_type', filters.priceType);
    }
    if (filters?.serviceType) {
      query = query.eq('service_type', filters.serviceType);
    }
    if (filters?.itemName) {
      query = query.eq('item_name', filters.itemName);
    }
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to fetch pricing history: ${errorMessage}`);
    }

    return (data || []) as PricingHistoryRecord[];
  } catch (error) {
    console.error('❌ Failed to fetch pricing history:', error);
    throw error;
  }
}

/**
 * Save or update pricing configuration
 */
export async function savePricing(
  pricing: Partial<PricingRecord>,
  userId?: string,
  client?: SupabaseClient
): Promise<PricingRecord> {
  try {
    // Use provided client (authenticated) or fall back to default client
    const supabaseClient = client || supabase;
    
    const dataToSave = {
      ...pricing,
      created_by: userId,
      updated_at: new Date().toISOString(),
    };

    if (pricing.id) {
      // Update existing
      const { data, error } = await supabaseClient
        .from('pricing_config')
        .update(dataToSave)
        .eq('id', pricing.id)
        .select()
        .single();

      if (error) throw error;
      
      // Clear cache after update
      clearPricingCache();
      
      return data as PricingRecord;
    } else {
      // Insert new
      const { data, error } = await supabaseClient
        .from('pricing_config')
        .insert(dataToSave)
        .select()
        .single();

      if (error) throw error;
      
      // Clear cache after insert
      clearPricingCache();
      
      return data as PricingRecord;
    }
  } catch (error) {
    console.error('❌ Failed to save pricing:', error);
    throw error;
  }
}

/**
 * Schedule a future price change
 */
export async function scheduleFuturePrice(
  pricing: Partial<PricingRecord>,
  effectiveDate: string,
  userId?: string,
  client?: SupabaseClient
): Promise<PricingRecord> {
  try {
    // Use provided client (authenticated) or fall back to default client
    const supabaseClient = client || supabase;
    
    // Find current active pricing for the same type/service/item
    let query = supabaseClient
      .from('pricing_config')
      .select('*')
      .eq('price_type', pricing.price_type!)
      .eq('is_active', true)
      .is('end_date', null);

    // Apply additional filters based on what's provided
    if (pricing.service_type) {
      query = query.eq('service_type', pricing.service_type);
    } else {
      query = query.is('service_type', null);
    }
    
    if (pricing.item_name) {
      query = query.eq('item_name', pricing.item_name);
    } else {
      query = query.is('item_name', null);
    }

    const { data: current, error: currentError } = await query.single();

    // Set end_date on current pricing to the day before new pricing takes effect
    if (current && !currentError) {
      const endDate = new Date(effectiveDate);
      endDate.setDate(endDate.getDate() - 1);

      await supabaseClient
        .from('pricing_config')
        .update({ end_date: endDate.toISOString().split('T')[0] })
        .eq('id', current.id);
    }

    // Create new pricing with future effective date
    const newPricing = {
      ...pricing,
      effective_date: effectiveDate,
      is_active: true,
      created_by: userId,
    };

    const { data, error } = await supabaseClient
      .from('pricing_config')
      .insert(newPricing)
      .select()
      .single();

    if (error) throw error;

    console.log(`✅ Scheduled price change for ${effectiveDate}`);
    
    return data as PricingRecord;
  } catch (error) {
    console.error('❌ Failed to schedule future price:', error);
    throw error;
  }
}

/**
 * Deactivate a pricing record
 */
export async function deactivatePricing(pricingId: string, client?: SupabaseClient): Promise<void> {
  try {
    // Use provided client (authenticated) or fall back to default client
    const supabaseClient = client || supabase;
    
    const { error } = await supabaseClient
      .from('pricing_config')
      .update({ 
        is_active: false,
        end_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', pricingId);

    if (error) throw error;

    // Clear cache after deactivation
    clearPricingCache();

    console.log(`✅ Deactivated pricing: ${pricingId}`);
  } catch (error) {
    console.error('❌ Failed to deactivate pricing:', error);
    throw error;
  }
}

/**
 * Get all scheduled (future) pricing
 */
export async function getScheduledPricing(): Promise<PricingRecord[]> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('pricing_config')
      .select('*')
      .eq('is_active', true)
      .gt('effective_date', today)
      .order('effective_date', { ascending: true });

    if (error) throw error;

    return (data || []) as PricingRecord[];
  } catch (error) {
    console.error('❌ Failed to fetch scheduled pricing:', error);
    throw error;
  }
}

/**
 * Fetch service metadata from database
 */
export async function fetchServicesMetadata(): Promise<ServiceMetadata[]> {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      const errorMessage = error?.message || error?.toString() || 'Unknown error';
      throw new Error(`Failed to fetch services: ${errorMessage}`);
    }

    return (data || []) as ServiceMetadata[];
  } catch (error) {
    console.error('❌ Failed to fetch services metadata:', error);
    throw error;
  }
}

