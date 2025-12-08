import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Ensure we always return JSON, even if there's an early error
  const jsonHeaders = {
    'Content-Type': 'application/json',
  };

  // Log that the route was hit (for debugging)
  console.log('[Blog API] GET request received at:', new Date().toISOString());

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
    
    // First, verify the table exists by attempting a simple query
    // Wrap in try-catch to handle any unexpected errors
    try {
      const { error: tableCheckError } = await supabase
        .from('blog_posts')
        .select('id')
        .limit(1);
      
      if (tableCheckError) {
        console.error('Blog posts table check failed:', tableCheckError);
        if (tableCheckError.code === '42P01') {
          return NextResponse.json(
            { 
              ok: false, 
              error: 'Blog posts table does not exist. Please run the database migration from supabase/blog-schema.sql in your Supabase SQL Editor.',
              code: 'TABLE_NOT_FOUND',
              hint: 'The blog_posts table needs to be created before you can manage blog posts.'
            },
            { 
              status: 500,
              headers: jsonHeaders
            }
          );
        }
        // If it's an RLS error, continue - we'll handle it in the main query
        if (tableCheckError.code === '42501' || tableCheckError.message?.includes('permission denied')) {
          console.warn('RLS permission issue detected, will attempt query anyway');
        }
      }
    } catch (tableCheckException: any) {
      console.error('Exception during table check:', tableCheckException);
      // Don't fail completely, try to continue with the query
    }
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build the base query for counting
    let countQuery = supabase
      .from('blog_posts')
      .select('*', { count: 'exact', head: true });

    // Build the main query
    let query = supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status);
      countQuery = countQuery.eq('status', status);
    }

    // Apply search filter
    if (search) {
      const searchFilter = `title.ilike.%${search}%,excerpt.ilike.%${search}%`;
      query = query.or(searchFilter);
      countQuery = countQuery.or(searchFilter);
    }

    // Get total count for pagination
    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('Error counting blog posts:', countError);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching blog posts:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      
      // Check if it's a table doesn't exist error
      if (error.code === '42P01') {
        return NextResponse.json(
          { 
            ok: false, 
            error: 'Blog posts table does not exist. Please run the database migration from supabase/blog-schema.sql',
            code: 'TABLE_NOT_FOUND'
          },
          { 
            status: 500,
            headers: jsonHeaders
          }
        );
      }
      
      // Check if it's an RLS policy error
      if (error.code === '42501' || error.message?.includes('permission denied')) {
        return NextResponse.json(
          { 
            ok: false, 
            error: 'Permission denied. Please ensure RLS policies are configured correctly. Run supabase/fix-blog-admin-access.sql',
            code: 'RLS_PERMISSION_DENIED'
          },
          { 
            status: 403,
            headers: jsonHeaders
          }
        );
      }
      
      return NextResponse.json(
        { ok: false, error: `Failed to fetch blog posts: ${error.message}` },
        { 
          status: 500,
          headers: jsonHeaders
        }
      );
    }

    // Transform the data to match the expected format
    // For now, we'll use "Admin" as the author name since fetching user details
    // from auth.users requires special permissions. This can be enhanced later
    // by creating a users profile table or using a service role key.
    const posts = (data || []).map((post: any) => {
      // Default to "Admin" for author name
      // TODO: Enhance this to fetch actual user names from a users table or profile
      const authorName = post.author_id ? 'Admin' : 'Unknown';

      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        author: authorName,
        status: post.status,
        published_at: post.published_at,
        views: 0, // Views field doesn't exist in schema yet, defaulting to 0
        created_at: post.created_at,
      };
    });

    const total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json(
      {
        ok: true,
        posts,
        total,
        totalPages,
      },
      {
        headers: jsonHeaders
      }
    );
  } catch (error: any) {
    console.error('Error in admin blog API:', error);
    console.error('Error stack:', error.stack);
    
    // Ensure we always return JSON, never HTML
    return NextResponse.json(
      { 
        ok: false, 
        error: error.message || 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { 
        status: 500,
        headers: jsonHeaders
      }
    );
  }
}

// POST: Create a new blog post
export async function POST(request: NextRequest) {
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
    const body = await request.json();

    // Get current user for author_id
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { ok: false, error: 'User not authenticated' },
        { 
          status: 401,
          headers: jsonHeaders
        }
      );
    }

    // Validate required fields
    if (!body.title || !body.slug || !body.content) {
      return NextResponse.json(
        { ok: false, error: 'Title, slug, and content are required' },
        { 
          status: 400,
          headers: jsonHeaders
        }
      );
    }

    // Check if slug already exists
    const { data: existingPost } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', body.slug)
      .maybeSingle();

    if (existingPost) {
      return NextResponse.json(
        { ok: false, error: 'A post with this slug already exists' },
        { 
          status: 400,
          headers: jsonHeaders
        }
      );
    }

    // Calculate read time (rough estimate: 200 words per minute)
    const wordCount = body.content.split(/\s+/).length;
    const readTime = Math.max(1, Math.ceil(wordCount / 200));

    // Prepare post data
    const postData: any = {
      title: body.title,
      slug: body.slug,
      content: body.content,
      excerpt: body.excerpt || null,
      featured_image: body.featured_image || null,
      featured_image_alt: body.featured_image_alt || null,
      category_id: body.category_id || null,
      author_id: user.id,
      status: body.status || 'draft',
      meta_title: body.meta_title || body.title,
      meta_description: body.meta_description || body.excerpt || null,
      read_time: readTime,
      published_at: body.status === 'published' ? (body.published_at || new Date().toISOString()) : null,
    };

    // Insert the post
    const { data, error } = await supabase
      .from('blog_posts')
      .insert(postData)
      .select()
      .single();

    if (error) {
      console.error('Error creating blog post:', error);
      return NextResponse.json(
        { ok: false, error: `Failed to create blog post: ${error.message}` },
        { 
          status: 500,
          headers: jsonHeaders
        }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        post: data,
        message: 'Blog post created successfully',
      },
      {
        headers: jsonHeaders
      }
    );
  } catch (error: any) {
    console.error('Error in admin blog POST API:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: error.message || 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { 
        status: 500,
        headers: jsonHeaders
      }
    );
  }
}

