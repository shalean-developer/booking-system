import { NextResponse } from 'next/server';

/**
 * Debug endpoint to check environment variable loading
 * This helps verify if .env.local is being loaded properly
 */
export async function GET() {
  console.log('=== ENVIRONMENT DEBUG CHECK ===');
  
  const envCheck = {
    timestamp: new Date().toISOString(),
    environment: {
      nodeEnv: process.env.NODE_ENV,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasResendKey: !!process.env.RESEND_API_KEY,
      hasPaystackSecret: !!process.env.PAYSTACK_SECRET_KEY,
      hasPaystackPublic: !!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
    },
    // Show first/last 4 characters for security
    keys: {
      resendKey: process.env.RESEND_API_KEY ? 
        `${process.env.RESEND_API_KEY.substring(0, 4)}...${process.env.RESEND_API_KEY.substring(-4)}` : 
        'NOT_SET',
      paystackSecret: process.env.PAYSTACK_SECRET_KEY ? 
        `${process.env.PAYSTACK_SECRET_KEY.substring(0, 4)}...${process.env.PAYSTACK_SECRET_KEY.substring(-4)}` : 
        'NOT_SET',
      paystackPublic: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ? 
        `${process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.substring(0, 4)}...${process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY.substring(-4)}` : 
        'NOT_SET',
    }
  };
  
  console.log('Environment check result:', JSON.stringify(envCheck, null, 2));
  console.log('===============================');
  
  return NextResponse.json(envCheck);
}
