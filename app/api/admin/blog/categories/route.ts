import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const jsonHeaders = {
    'Content-Type': 'application/json',
  };

  try {
    const adminCheck = await isAdmin();
    if (!adminCheck) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized - Admin access required' },
        { 
          status: 403,
          headers: jsonHeaders
        }
      );
    }

    const supabase = await createClient();
    
    // Check if table exists first
    const { error: tableCheckError } = await supabase
      .from('blog_categories')
      .select('id')
      .limit(1);
    
    if (tableCheckError) {
      console.error('Blog categories table check failed:', tableCheckError);
      if (tableCheckError.code === '42P01') {
        // Table doesn't exist - return empty array
        return NextResponse.json(
          { 
            ok: true, 
            categories: [],
            message: 'Blog categories table does not exist. Categories are optional.'
          },
          { 
            status: 200,
            headers: jsonHeaders
          }
        );
      }
    }

    const { data, error } = await supabase
      .from('blog_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching categories:', error);
      // Return empty array instead of error - categories are optional
      return NextResponse.json(
        { 
          ok: true, 
          categories: [],
          message: 'Could not load categories, but you can still create a post without one.'
        },
        { 
          status: 200,
          headers: jsonHeaders
        }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        categories: data || [],
      },
      {
        headers: jsonHeaders
      }
    );
  } catch (error: any) {
    console.error('Error in categories API:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error.message || 'Internal server error',
      },
      { 
        status: 500,
        headers: jsonHeaders
      }
    );
  }
}

