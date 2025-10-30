import { NextRequest, NextResponse } from 'next/server';

/**
 * Custom Email Verification Redirect Handler
 * 
 * This route allows verification links to use your custom domain (shalean.co.za)
 * instead of the Supabase domain (utfvbtcszzafuoyytlpf.supabase.co)
 * 
 * Flow:
 * 1. User clicks: https://shalean.co.za/api/auth/verify?token=...&type=signup
 * 2. This route redirects to: https://utfvbtcszzafuoyytlpf.supabase.co/auth/v1/verify?token=...
 * 3. Supabase processes verification
 * 4. User is redirected back to https://shalean.co.za/dashboard
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  const type = searchParams.get('type') || 'signup';
  
  // Validate token
  if (!token) {
    console.error('❌ Email verification: No token provided');
    return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
  }
  
  // Get redirect URL (default to dashboard)
  const redirectTo = searchParams.get('redirect_to') || '/dashboard';
  
  // Build full redirect URL on your domain
  const baseUrl = request.nextUrl.origin; // e.g., https://shalean.co.za
  const fullRedirectUrl = redirectTo.startsWith('http') 
    ? redirectTo 
    : `${baseUrl}${redirectTo}`;
  
  // Get Supabase URL from environment
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!supabaseUrl) {
    console.error('❌ Email verification: NEXT_PUBLIC_SUPABASE_URL not configured');
    return NextResponse.redirect(new URL('/login?error=configuration', request.url));
  }
  
  // Build Supabase verification URL
  // This will handle the actual verification and redirect back to your domain
  const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${encodeURIComponent(token)}&type=${type}&redirect_to=${encodeURIComponent(fullRedirectUrl)}`;
  
  console.log('✅ Email verification redirect:', {
    token: token.substring(0, 10) + '...',
    type,
    redirectTo: fullRedirectUrl,
    supabaseUrl,
  });
  
  // Redirect to Supabase verification endpoint
  // Supabase will process the verification and redirect user back to fullRedirectUrl
  return NextResponse.redirect(verifyUrl);
}

