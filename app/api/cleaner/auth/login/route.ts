import { NextRequest, NextResponse } from 'next/server';
import { 
  verifyCleanerPassword, 
  setCleanerSession, 
  validatePhoneNumber, 
  normalizePhoneNumber 
} from '@/lib/cleaner-auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    // Validate input
    if (!phone || !password) {
      return NextResponse.json(
        { ok: false, error: 'Phone and password are required' },
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

    // Verify credentials
    const cleanerSession = await verifyCleanerPassword(normalizedPhone, password);

    if (!cleanerSession) {
      return NextResponse.json(
        { ok: false, error: 'Invalid phone or password' },
        { status: 401 }
      );
    }

    // Set session
    await setCleanerSession(cleanerSession);

    console.log('✅ Cleaner logged in:', cleanerSession.name, normalizedPhone);

    return NextResponse.json({
      ok: true,
      cleaner: cleanerSession,
    });
  } catch (error) {
    console.error('Error in cleaner login:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}

