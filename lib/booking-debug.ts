/**
 * Booking Debug Utilities
 * Centralized debugging tools for tracking booking flow issues
 */

export interface DebugContext {
  timestamp: string;
  step: string;
  paymentReference?: string;
  bookingId?: string;
  userId?: string;
  error?: any;
  data?: any;
  duration?: number;
  [key: string]: any; // Allow additional properties for flexibility
}

export interface ServiceHealthCheck {
  service: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime?: number;
  error?: string;
  details?: any;
}

/**
 * Captures comprehensive error context for debugging
 */
export function captureErrorContext(
  step: string,
  error: any,
  context: Partial<DebugContext> = {}
): DebugContext {
  const fullContext: DebugContext = {
    timestamp: new Date().toISOString(),
    step,
    error: error instanceof Error ? {
      message: error.message,
      stack: error.stack,
      name: error.name
    } : error,
    ...context
  };

  console.error('=== BOOKING DEBUG ERROR ===');
  console.error('Step:', step);
  console.error('Timestamp:', fullContext.timestamp);
  console.error('Payment Reference:', fullContext.paymentReference);
  console.error('Booking ID:', fullContext.bookingId);
  console.error('Error:', fullContext.error);
  console.error('Context Data:', fullContext.data);
  console.error('===========================');

  return fullContext;
}

/**
 * Tracks timing for performance debugging
 */
export function trackTiming<T>(
  operation: string,
  fn: () => Promise<T> | T
): Promise<{ result: T; duration: number }> {
  const start = Date.now();
  
  return Promise.resolve(fn()).then(result => {
    const duration = Date.now() - start;
    console.log(`⏱️ ${operation}: ${duration}ms`);
    return { result, duration };
  });
}

/**
 * Tests email service connectivity
 */
export async function testEmailServiceConnectivity(): Promise<ServiceHealthCheck> {
  const start = Date.now();
  
  try {
    if (!process.env.RESEND_API_KEY) {
      return {
        service: 'email',
        status: 'unhealthy',
        error: 'RESEND_API_KEY not configured'
      };
    }

    // Test Resend API connectivity
    const response = await fetch('https://api.resend.com/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const duration = Date.now() - start;
    
    if (response.ok) {
      return {
        service: 'email',
        status: 'healthy',
        responseTime: duration,
        details: { status: response.status }
      };
    } else {
      return {
        service: 'email',
        status: 'unhealthy',
        responseTime: duration,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    const duration = Date.now() - start;
    return {
      service: 'email',
      status: 'unhealthy',
      responseTime: duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Tests database connectivity
 */
export async function testDatabaseConnectivity(): Promise<ServiceHealthCheck> {
  const start = Date.now();
  
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return {
        service: 'database',
        status: 'unhealthy',
        error: 'Supabase environment variables not configured'
      };
    }

    // Test Supabase connectivity with a simple query
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      },
    });

    const duration = Date.now() - start;
    
    if (response.ok) {
      return {
        service: 'database',
        status: 'healthy',
        responseTime: duration,
        details: { status: response.status }
      };
    } else {
      return {
        service: 'database',
        status: 'unhealthy',
        responseTime: duration,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    const duration = Date.now() - start;
    return {
      service: 'database',
      status: 'unhealthy',
      responseTime: duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Tests Paystack connectivity
 */
export async function testPaystackConnectivity(): Promise<ServiceHealthCheck> {
  const start = Date.now();
  
  try {
    if (!process.env.PAYSTACK_SECRET_KEY) {
      return {
        service: 'paystack',
        status: 'unhealthy',
        error: 'PAYSTACK_SECRET_KEY not configured'
      };
    }

    // Test Paystack API connectivity with a simple request
    const response = await fetch('https://api.paystack.co/bank', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const duration = Date.now() - start;
    
    if (response.ok) {
      return {
        service: 'paystack',
        status: 'healthy',
        responseTime: duration,
        details: { status: response.status }
      };
    } else {
      return {
        service: 'paystack',
        status: 'unhealthy',
        responseTime: duration,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
  } catch (error) {
    const duration = Date.now() - start;
    return {
      service: 'paystack',
      status: 'unhealthy',
      responseTime: duration,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Runs all service health checks
 */
export async function runAllServiceHealthChecks(): Promise<ServiceHealthCheck[]> {
  console.log('🔍 Running service health checks...');
  
  const checks = await Promise.all([
    testEmailServiceConnectivity(),
    testDatabaseConnectivity(),
    testPaystackConnectivity()
  ]);

  console.log('📊 Service Health Check Results:');
  checks.forEach(check => {
    const status = check.status === 'healthy' ? '✅' : '❌';
    const time = check.responseTime ? ` (${check.responseTime}ms)` : '';
    console.log(`${status} ${check.service}: ${check.status}${time}`);
    if (check.error) {
      console.log(`   Error: ${check.error}`);
    }
  });

  return checks;
}

/**
 * Formats debug logs for consistent output
 */
export function formatDebugLog(context: DebugContext): string {
  return JSON.stringify({
    timestamp: context.timestamp,
    step: context.step,
    paymentReference: context.paymentReference,
    bookingId: context.bookingId,
    userId: context.userId,
    duration: context.duration,
    error: context.error,
    data: context.data
  }, null, 2);
}

/**
 * Logs booking flow step with timing
 */
export function logBookingStep(
  step: string,
  data?: any,
  paymentReference?: string,
  bookingId?: string
): void {
  console.log(`📋 BOOKING STEP: ${step}`);
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  if (paymentReference) console.log(`💳 Payment Ref: ${paymentReference}`);
  if (bookingId) console.log(`📝 Booking ID: ${bookingId}`);
  if (data) console.log(`📊 Data:`, data);
  console.log('---');
}

/**
 * Creates a debug summary for error reporting
 * Note: Only NEXT_PUBLIC_* variables are available in browser context
 */
export function createDebugSummary(
  error: any,
  context: Partial<DebugContext> = {}
): string {
  const summary = {
    timestamp: new Date().toISOString(),
    error: error instanceof Error ? {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 5) // First 5 lines of stack
    } : error,
    context,
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasPaystackPublic: !!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
      // Note: Server-side variables (RESEND_API_KEY, PAYSTACK_SECRET_KEY) 
      // are not available in browser context for security reasons
      note: "Server-side env vars (RESEND_API_KEY, PAYSTACK_SECRET_KEY) not visible in browser"
    }
  };

  return JSON.stringify(summary, null, 2);
}
