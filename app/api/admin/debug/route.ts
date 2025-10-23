import { NextResponse } from 'next/server';
import { createClient, getServerAuthUser } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Admin Debug API - Diagnostic endpoint
 * GET: Debug admin authentication and database access
 */
export async function GET(req: Request) {
  console.log('=== ADMIN DEBUG GET ===');
  
  try {
    // Step 1: Check if user is authenticated
    const authUser = await getServerAuthUser();
    console.log('🔍 Auth user:', authUser ? { id: authUser.id, email: authUser.email } : 'null');
    
    if (!authUser) {
      return NextResponse.json({
        ok: false,
        error: 'Not authenticated',
        step: 'auth_check',
        details: 'No authenticated user found'
      });
    }
    
    const supabase = await createClient();
    
    // Step 2: Check customer profile
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, first_name, last_name, email, role, auth_user_id')
      .eq('auth_user_id', authUser.id)
      .maybeSingle();
    
    console.log('🔍 Customer profile:', customer);
    console.log('🔍 Customer error:', customerError);
    
    if (customerError) {
      return NextResponse.json({
        ok: false,
        error: 'Database error',
        step: 'customer_lookup',
        details: customerError.message
      });
    }
    
    if (!customer) {
      return NextResponse.json({
        ok: false,
        error: 'No customer profile',
        step: 'customer_lookup',
        details: 'User authenticated but no customer profile found'
      });
    }
    
    // Step 3: Check admin role
    const isAdmin = customer.role === 'admin';
    console.log('🔍 Is admin:', isAdmin, 'Role:', customer.role);
    
    if (!isAdmin) {
      return NextResponse.json({
        ok: false,
        error: 'Not admin',
        step: 'role_check',
        details: `User role is '${customer.role}', expected 'admin'`,
        user: {
          id: customer.id,
          name: `${customer.first_name} ${customer.last_name}`,
          email: customer.email,
          role: customer.role
        }
      });
    }
    
    // Step 4: Test database access
    const { data: reviews, error: reviewsError } = await supabase
      .from('cleaner_reviews')
      .select('id, created_at')
      .limit(1);
    
    console.log('🔍 Reviews access test:', { count: reviews?.length, error: reviewsError });
    
    const { data: ratings, error: ratingsError } = await supabase
      .from('customer_ratings')
      .select('id, created_at')
      .limit(1);
    
    console.log('🔍 Ratings access test:', { count: ratings?.length, error: ratingsError });
    
    // Step 5: Return success with debug info
    return NextResponse.json({
      ok: true,
      message: 'Admin access confirmed',
      user: {
        id: customer.id,
        name: `${customer.first_name} ${customer.last_name}`,
        email: customer.email,
        role: customer.role
      },
      database_access: {
        cleaner_reviews: {
          accessible: !reviewsError,
          error: reviewsError?.message,
          count: reviews?.length || 0
        },
        customer_ratings: {
          accessible: !ratingsError,
          error: ratingsError?.message,
          count: ratings?.length || 0
        }
      }
    });
    
  } catch (error) {
    console.error('=== ADMIN DEBUG ERROR ===', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Debug failed',
        step: 'exception',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
