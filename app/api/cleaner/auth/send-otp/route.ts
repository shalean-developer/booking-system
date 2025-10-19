import { NextRequest, NextResponse } from 'next/server';
import { 
  generateOTP, 
  storeOTP, 
  checkOTPRateLimit, 
  validatePhoneNumber, 
  normalizePhoneNumber,
  createCleanerSupabaseClient
} from '@/lib/cleaner-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone } = body;

    // Validate input
    if (!phone) {
      return NextResponse.json(
        { ok: false, error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Normalize and validate phone number
    const normalizedPhone = normalizePhoneNumber(phone);
    if (!validatePhoneNumber(normalizedPhone)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Check if cleaner exists and is active
    const supabase = await createCleanerSupabaseClient();
    const { data: cleaner, error: cleanerError } = await supabase
      .from('cleaners')
      .select('id, name, auth_provider')
      .eq('phone', normalizedPhone)
      .eq('is_active', true)
      .maybeSingle();

    if (cleanerError || !cleaner) {
      return NextResponse.json(
        { ok: false, error: 'Cleaner not found or inactive' },
        { status: 404 }
      );
    }

    // Check if OTP auth is enabled for this cleaner
    if (cleaner.auth_provider !== 'otp' && cleaner.auth_provider !== 'both') {
      return NextResponse.json(
        { ok: false, error: 'OTP authentication not enabled for this account' },
        { status: 403 }
      );
    }

    // Check rate limiting
    const rateLimitCheck = await checkOTPRateLimit(normalizedPhone);
    if (!rateLimitCheck.allowed) {
      return NextResponse.json(
        { ok: false, error: rateLimitCheck.message || 'Too many requests' },
        { status: 429 }
      );
    }

    // Generate OTP
    const otp = generateOTP();

    // Store OTP in database
    const stored = await storeOTP(normalizedPhone, otp);

    if (!stored) {
      return NextResponse.json(
        { ok: false, error: 'Failed to send OTP' },
        { status: 500 }
      );
    }

    // TODO: Send OTP via SMS (Twilio, etc.)
    // For now, log it to console for development
    console.log('📱 OTP for', normalizedPhone, ':', otp);
    console.log('🔐 OTP Code:', otp, '- Expires in 5 minutes');

    return NextResponse.json({
      ok: true,
      message: 'OTP sent successfully',
      // In development, return the OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp }),
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred while sending OTP' },
      { status: 500 }
    );
  }
}

