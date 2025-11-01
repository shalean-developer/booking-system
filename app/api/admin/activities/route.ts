import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

/**
 * Admin Activities API
 * GET: Fetch recent booking activities for admin dashboard
 */
export async function GET(req: Request) {
  console.log('=== ADMIN ACTIVITIES GET ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const supabase = await createClient();
    const url = new URL(req.url);
    
    // Get query parameters
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const actionType = url.searchParams.get('actionType') || 'status_change';
    
    try {
      // Fetch recent booking activities
      const { data: activities, error } = await supabase
        .from('booking_activities')
        .select('*')
        .eq('action_type', actionType)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      // Handle error gracefully - if table doesn't exist yet, return empty array
      if (error) {
        const errorMessage = error.message || '';
        const errorCode = error.code || '';
        
        // Check if it's a "relation does not exist" error (table not created yet)
        if (errorCode === '42P01' || 
            errorMessage.includes('does not exist') || 
            (errorMessage.includes('relation') && errorMessage.includes('not found')) ||
            errorMessage.includes('relation "booking_activities"') ||
            errorMessage.includes('schema cache')) {
          console.log('⚠️ booking_activities table does not exist yet. Run the migration first.');
          return NextResponse.json({
            ok: true,
            activities: [],
            message: 'Activity table not initialized. Run migration: supabase/migrations/create-booking-activities-table.sql',
            code: errorCode,
          });
        }
        
        // For other errors, log and throw
        console.error('Error fetching activities:', error);
        throw error;
      }
      
      console.log(`✅ Fetched ${activities?.length || 0} activities`);
      
      return NextResponse.json({
        ok: true,
        activities: activities || [],
      });
      
    } catch (queryError: any) {
      // Catch errors that occur during query construction (like schema cache errors)
      const errorMessage = queryError?.message || '';
      
      // Check for schema cache error (table not in client schema cache)
      if (errorMessage.includes('schema cache') || 
          errorMessage.includes('Could not find the table') ||
          errorMessage.includes('booking_activities')) {
        console.log('⚠️ booking_activities table not found in schema cache. Run the migration first.');
        return NextResponse.json({
          ok: true,
          activities: [],
          message: 'Activity table not initialized. Run migration: supabase/migrations/create-booking-activities-table.sql',
          code: 'TABLE_NOT_FOUND',
        });
      }
      
      // Re-throw if it's not a table-not-found error
      throw queryError;
    }
    
  } catch (error: any) {
    console.error('=== ADMIN ACTIVITIES GET ERROR ===', error);
    const errorMessage = error?.message || 'Failed to fetch activities';
    const errorCode = error?.code || 'UNKNOWN';
    
    return NextResponse.json(
      { 
        ok: false, 
        error: errorMessage,
        code: errorCode,
        details: 'Make sure the booking_activities table exists. Run: supabase/migrations/create-booking-activities-table.sql'
      },
      { status: 500 }
    );
  }
}

