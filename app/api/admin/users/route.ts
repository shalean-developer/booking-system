import { NextResponse } from 'next/server';
import { createServiceClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Admin Users API
 * GET: Fetch all authenticated users from Supabase Auth
 */
export async function GET(req: Request) {
  console.log('=== ADMIN USERS GET ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const supabase = createServiceClient();
    const url = new URL(req.url);
    
    // Get query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const search = url.searchParams.get('search') || '';
    
    // Fetch users from Supabase Auth
    const { data, error } = await supabase.auth.admin.listUsers({
      page: page,
      perPage: limit,
    });
    
    if (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
    
    let users = data.users || [];
    
    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      users = users.filter(user => 
        user.email?.toLowerCase().includes(searchLower)
      );
    }
    
    console.log(`✅ Fetched ${users.length} users`);
    
    return NextResponse.json({
      ok: true,
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at,
        email_confirmed_at: user.email_confirmed_at,
        phone: user.phone,
        provider: user.app_metadata?.provider || 'email',
        role: user.role,
      })),
      pagination: {
        page,
        limit,
        total: users.length,
        totalPages: Math.ceil(users.length / limit),
      },
    });
    
  } catch (error) {
    console.error('=== ADMIN USERS GET ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

