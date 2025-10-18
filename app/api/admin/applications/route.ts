import { NextResponse } from 'next/server';
import { createClient, isAdmin } from '@/lib/supabase-server';

/**
 * Admin Applications API
 * GET: Fetch all applications with filters
 * PUT: Update application status (approve/reject)
 */
export async function GET(req: Request) {
  console.log('=== ADMIN APPLICATIONS GET ===');
  
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
    const status = url.searchParams.get('status') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase
      .from('applications')
      .select('*', { count: 'exact' });
    
    // Apply status filter
    if (status) {
      query = query.eq('status', status);
    }
    
    // Apply pagination and sorting
    const { data: applications, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) throw error;
    
    console.log(`✅ Fetched ${applications?.length || 0} applications`);
    
    return NextResponse.json({
      ok: true,
      applications: applications || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
    
  } catch (error) {
    console.error('=== ADMIN APPLICATIONS GET ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  console.log('=== ADMIN APPLICATIONS PUT ===');
  
  try {
    // Check admin access
    if (!await isAdmin()) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    const { id, status, createCleaner } = body;
    
    if (!id || !status) {
      return NextResponse.json(
        { ok: false, error: 'Application ID and status required' },
        { status: 400 }
      );
    }
    
    const supabase = await createClient();
    
    // Update application status
    const { data: application, error: updateError } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    console.log('✅ Application status updated:', id, status);
    
    // If approved and createCleaner flag is set, create cleaner profile
    let cleaner = null;
    if (status === 'accepted' && createCleaner) {
      console.log('Creating cleaner profile from application...');
      
      const cleanerData = {
        name: `${application.first_name} ${application.last_name}`,
        email: application.email,
        phone: application.phone,
        bio: application.cover_letter || '',
        years_experience: 0, // Can be parsed from work_experience if structured
        areas: [], // Need to be set manually or parsed
        specialties: [], // Need to be set manually
        is_active: true,
      };
      
      const { data: newCleaner, error: cleanerError } = await supabase
        .from('cleaners')
        .insert([cleanerData])
        .select()
        .single();
      
      if (cleanerError) {
        console.error('Failed to create cleaner:', cleanerError);
        // Don't fail the whole request, just log it
      } else {
        cleaner = newCleaner;
        console.log('✅ Cleaner profile created:', newCleaner.id);
      }
    }
    
    return NextResponse.json({
      ok: true,
      application,
      cleaner,
    });
    
  } catch (error) {
    console.error('=== ADMIN APPLICATIONS PUT ERROR ===', error);
    return NextResponse.json(
      { ok: false, error: 'Failed to update application' },
      { status: 500 }
    );
  }
}

