import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyOTP, 
  setCleanerSession, 
  validatePhoneNumber, 
  normalizePhoneNumber 
} from '@/lib/cleaner-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, otp } = body;

    // Validate input
    if (!phone || !otp) {
      return NextResponse.json(
        { ok: false, error: 'Phone and OTP are required' },
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

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid OTP format' },
        { status: 400 }
      );
    }

    // Verify OTP
    const cleanerSession = await verifyOTP(normalizedPhone, otp);

    if (!cleanerSession) {
      return NextResponse.json(
        { ok: false, error: 'Invalid or expired OTP' },
        { status: 401 }
      );
    }

    // Set session
    await setCleanerSession(cleanerSession);

    console.log('✅ Cleaner verified via OTP:', cleanerSession.name, normalizedPhone);

    return NextResponse.json({
      ok: true,
      cleaner: cleanerSession,
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred during verification' },
      { status: 500 }
    );
  }
}

