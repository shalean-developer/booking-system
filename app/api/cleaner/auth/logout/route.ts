import { NextResponse } from 'next/server';
import { clearCleanerSession } from '@/lib/cleaner-auth';

export async function POST() {
  try {
    // Clear session
    await clearCleanerSession();

    console.log('✅ Cleaner logged out');

    return NextResponse.json({
      ok: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Error logging out:', error);
    return NextResponse.json(
      { ok: false, error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}

