import { NextRequest, NextResponse } from 'next/server';
import { fetchActivePricing, fetchServicesMetadata } from '@/lib/pricing-db';

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

// Ensure this route is accessible
export async function GET(request: NextRequest) {
  try {
    // Check environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ Missing Supabase environment variables');
      return NextResponse.json(
        { 
          error: 'Database not configured',
          message: 'Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.',
          services: []
        },
        { 
          status: 500,
          headers: CACHE_HEADERS 
        }
      );
    }

    // Fetch both pricing and service metadata from database
    const [pricing, servicesMetadata] = await Promise.all([
      fetchActivePricing(true),
      fetchServicesMetadata(),
    ]);
    
    // Validate that we have service metadata from database
    if (!servicesMetadata || servicesMetadata.length === 0) {
      console.error('No service metadata found in database. Please ensure the services table exists and has data.');
      return NextResponse.json(
        { 
          error: 'Services not configured',
          message: 'Service metadata not found in database. Please run the services table migration.',
          services: []
        },
        { 
          status: 503, // Service Unavailable
          headers: CACHE_HEADERS 
        }
      );
    }
    
    // Log what we received
    console.log('📊 Services metadata from database:', servicesMetadata.length, 'services');
    console.log('📊 Available pricing services:', Object.keys(pricing.services));
    
    // Get all active services from database (not hardcoded list)
    const services = servicesMetadata
      .map((serviceMeta) => {
        const servicePricing = pricing.services[serviceMeta.service_type];
        
        // Skip if no pricing data available
        if (!servicePricing) {
          console.warn(`⚠️ No pricing data found for service: ${serviceMeta.service_type}`);
          return null;
        }
        
        // Validate required fields from database
        if (!serviceMeta.display_name) {
          console.warn(`⚠️ Missing display_name for service: ${serviceMeta.service_type}`);
          return null;
        }
        
        console.log(`✅ Processing service: ${serviceMeta.service_type} - ${serviceMeta.display_name}`);
        console.log(`   📷 Image URL: ${serviceMeta.image_url || '(none)'}`);
        
        return {
          serviceType: serviceMeta.service_type,
          category: serviceMeta.display_name, // Use display_name from database
          avgPrice: `R${Math.round(servicePricing.base)}`,
          basePrice: servicePricing.base,
          icon: serviceMeta.icon || '🏠', // Use icon from database, fallback to default emoji
          image: serviceMeta.image_url || '', // Use image_url from database
          order: serviceMeta.display_order, // Use display_order from database
          description: serviceMeta.description || '', // Use description from database
        };
      })
      .filter((service): service is NonNullable<typeof service> => service !== null)
      .sort((a, b) => a.order - b.order);
    
    console.log(`✅ Returning ${services.length} services after processing`);
    
    // Return services from database
    if (services.length > 0) {
      return NextResponse.json(
        { services },
        { headers: CACHE_HEADERS }
      );
    }
    
    // If no services found after filtering
    console.error('No valid services found after processing database data');
    return NextResponse.json(
      { 
        error: 'No services available',
        message: 'Services found in database but missing required data (pricing or metadata)',
        services: []
      },
      { 
        status: 503,
        headers: CACHE_HEADERS 
      }
    );
  } catch (error: any) {
    console.error('❌ Error fetching popular services:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
    });
    
    // Provide more specific error messages
    let errorMessage = error?.message || 'Unknown error occurred';
    let statusCode = 500;

    // Check for specific error types
    if (errorMessage.includes('Failed to fetch')) {
      errorMessage = 'Unable to connect to database. Please check your Supabase configuration.';
    } else if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
      errorMessage = 'Services table does not exist. Please run the database migration.';
      statusCode = 503;
    } else if (errorMessage.includes('permission denied') || errorMessage.includes('RLS')) {
      errorMessage = 'Database access denied. Please check Row Level Security (RLS) policies.';
      statusCode = 503; // Service Unavailable - this is a configuration issue, not authorization
    }
    
    // Return error response with helpful message
    return NextResponse.json(
      { 
        error: 'Failed to fetch services',
        message: errorMessage,
        hint: 'Check your server console logs for detailed error information.',
        services: []
      },
      { 
        status: statusCode,
        headers: CACHE_HEADERS 
      }
    );
  }
}

