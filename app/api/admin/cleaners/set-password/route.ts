import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';
import { hashPassword, normalizePhoneNumber, validatePhoneNumber } from '@/lib/cleaner-auth';

export const dynamic = 'force-dynamic';

/**
 * Admin Set Password API
 * POST: Set/update cleaner password and auth settings
 */
export async function POST(req: Request) {
  console.log('=== ADMIN SET PASSWORD ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { id, phone, password, auth_provider } = body;
    
    // Validate inputs
    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'Cleaner ID is required' },
        { status: 400 }
      );
    }
    
    // Validate auth_provider
    if (auth_provider && !['password', 'otp', 'both'].includes(auth_provider)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid auth_provider. Must be "password", "otp", or "both"' },
        { status: 400 }
      );
    }
    
    // Build update object
    const updates: Record<string, any> = {};
    
    // Handle phone number if provided
    if (phone) {
      const normalizedPhone = normalizePhoneNumber(phone);
      if (!validatePhoneNumber(normalizedPhone)) {
        return NextResponse.json(
          { ok: false, error: 'Invalid phone number format' },
          { status: 400 }
        );
      }
      updates.phone = normalizedPhone;
    }
    
    // Handle password if provided
    if (password) {
      // Validate password strength
      if (password.length < 6) {
        return NextResponse.json(
          { ok: false, error: 'Password must be at least 6 characters' },
          { status: 400 }
        );
      }
      
      // Hash password
      const passwordHash = await hashPassword(password);
      updates.password_hash = passwordHash;
      
      // If setting password but no auth_provider specified, default to 'both'
      if (!auth_provider) {
        updates.auth_provider = 'both';
      }
    }
    
    // Handle auth_provider
    if (auth_provider) {
      updates.auth_provider = auth_provider;
      
      // Validate that password exists if auth_provider requires it
      if ((auth_provider === 'password' || auth_provider === 'both') && !password) {
        // Check if cleaner already has a password
        const supabase = await createClient();
        const { data: cleaner } = await supabase
          .from('cleaners')
          .select('password_hash')
          .eq('id', id)
          .single();
        
        if (!cleaner?.password_hash) {
          return NextResponse.json(
            { ok: false, error: 'Password is required for password-based authentication' },
            { status: 400 }
          );
        }
      }
    }
    
    // Check if there are any updates to make
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { ok: false, error: 'No updates provided' },
        { status: 400 }
      );
    }
    
    // Update cleaner in database
    const supabase = await createClient();
    const { data: cleaner, error } = await supabase
      .from('cleaners')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Database error:', error);
      throw error;
    }
    
    console.log('✅ Cleaner credentials updated:', id);
    
    return NextResponse.json({
      ok: true,
      cleaner,
      message: 'Credentials updated successfully',
    });
    
  } catch (error) {
    console.error('=== ADMIN SET PASSWORD ERROR ===', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update credentials';
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 }
    );
  }
}

