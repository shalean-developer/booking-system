import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Debug endpoint to check what's wrong with services API
export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    checks: {},
    errors: []
  };

  try {
    // Check 1: Environment Variables
    diagnostics.checks.envVars = {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 
        process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...' : 'MISSING',
      supabaseKeyPrefix: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20) + '...' : 'MISSING'
    };

    if (!diagnostics.checks.envVars.hasSupabaseUrl || !diagnostics.checks.envVars.hasSupabaseKey) {
      diagnostics.errors.push('Missing Supabase environment variables');
      return NextResponse.json(diagnostics, { status: 500 });
    }

    // Check 2: Database Connection
    try {
      const { data, error } = await supabase
        .from('services')
        .select('count')
        .limit(1);

      diagnostics.checks.dbConnection = {
        success: !error,
        error: error?.message || null,
        hasData: !!data
      };

      if (error) {
        diagnostics.errors.push(`Database connection error: ${error.message}`);
        
        // Check for specific error types
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
          diagnostics.errors.push('The "services" table does not exist. Please run the database migration.');
        } else if (error.message.includes('permission denied') || error.message.includes('RLS')) {
          diagnostics.errors.push('Row Level Security (RLS) is blocking access. Check RLS policies for the services table.');
        }
      }
    } catch (dbError: any) {
      diagnostics.checks.dbConnection = {
        success: false,
        error: dbError?.message || 'Unknown database error'
      };
      diagnostics.errors.push(`Database query failed: ${dbError?.message}`);
    }

    // Check 3: Services Table Data
    try {
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('id, service_type, display_name, is_active')
        .eq('is_active', true);

      diagnostics.checks.servicesTable = {
        success: !servicesError,
        error: servicesError?.message || null,
        count: servicesData?.length || 0,
        services: servicesData || []
      };

      if (servicesError) {
        diagnostics.errors.push(`Services query error: ${servicesError.message}`);
      } else if (!servicesData || servicesData.length === 0) {
        diagnostics.errors.push('No active services found in the database. The services table is empty or has no active services.');
      }
    } catch (servicesError: any) {
      diagnostics.checks.servicesTable = {
        success: false,
        error: servicesError?.message || 'Unknown error'
      };
      diagnostics.errors.push(`Services query failed: ${servicesError?.message}`);
    }

    // Check 4: Pricing Config Table
    try {
      const { data: pricingData, error: pricingError } = await supabase
        .from('pricing_config')
        .select('service_type, price_type, price, is_active')
        .eq('is_active', true)
        .eq('price_type', 'base')
        .limit(5);

      diagnostics.checks.pricingTable = {
        success: !pricingError,
        error: pricingError?.message || null,
        count: pricingData?.length || 0,
        samplePricing: pricingData || []
      };

      if (pricingError) {
        diagnostics.errors.push(`Pricing query error: ${pricingError.message}`);
      }
    } catch (pricingError: any) {
      diagnostics.checks.pricingTable = {
        success: false,
        error: pricingError?.message || 'Unknown error'
      };
    }

    // Overall status
    diagnostics.status = diagnostics.errors.length === 0 ? 'OK' : 'ERROR';
    diagnostics.summary = diagnostics.errors.length === 0 
      ? 'All checks passed. Services API should work.'
      : `${diagnostics.errors.length} error(s) found. See errors array for details.`;

    return NextResponse.json(diagnostics, { 
      status: diagnostics.errors.length === 0 ? 200 : 500 
    });

  } catch (error: any) {
    diagnostics.errors.push(`Diagnostic check failed: ${error?.message || 'Unknown error'}`);
    diagnostics.status = 'ERROR';
    return NextResponse.json(diagnostics, { status: 500 });
  }
}

