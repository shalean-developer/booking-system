import { NextResponse } from 'next/server';
import { runAllServiceHealthChecks } from '@/lib/booking-debug';

/**
 * Debug endpoint to test booking API components
 * This helps verify each step of the booking process
 */
export async function POST() {
  console.log('=== BOOKING API DEBUG TEST ===');
  
  try {
    // Test 1: Environment validation
    console.log('Test 1: Environment validation...');
    const { validateBookingEnv } = await import('@/lib/env-validation');
    const envValidation = validateBookingEnv();
    console.log('Environment validation result:', envValidation);
    
    // Test 2: Service health checks
    console.log('Test 2: Service health checks...');
    const healthChecks = await runAllServiceHealthChecks();
    console.log('Health check results:', healthChecks);
    
    // Test 3: Supabase connection
    console.log('Test 3: Supabase connection...');
    const { supabase } = await import('@/lib/supabase');
    const { data, error } = await supabase
      .from('bookings')
      .select('id')
      .limit(1);
    
    console.log('Supabase test result:', { data, error });
    
    // Test 4: Email service (without sending)
    console.log('Test 4: Email service check...');
    const { sendEmail } = await import('@/lib/email');
    console.log('Email service imported successfully');
    
    const result = {
      timestamp: new Date().toISOString(),
      tests: {
        environmentValidation: envValidation,
        serviceHealthChecks: healthChecks,
        supabaseConnection: { 
          success: !error, 
          error: error?.message,
          dataCount: data?.length || 0
        },
        emailService: { 
          imported: true,
          resendKeyPresent: !!process.env.RESEND_API_KEY
        }
      }
    };
    
    console.log('=== BOOKING API DEBUG COMPLETE ===');
    console.log(JSON.stringify(result, null, 2));
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('=== BOOKING API DEBUG ERROR ===');
    console.error('Error:', error);
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
