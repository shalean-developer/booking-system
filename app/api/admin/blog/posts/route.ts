import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { isAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

// GET all posts (admin view - including drafts)
export async function GET() {
  try {
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('blog_posts_with_details')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ posts: data });
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST create new post
export async function POST(request: NextRequest) {
  try {
    console.log('=== BLOG POST CREATE API CALLED ===');
    
    const userIsAdmin = await isAdmin();
    if (!userIsAdmin) {
      console.log('❌ Admin access denied');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ Admin access granted');
    
    const supabase = await createClient();
    const body = await request.json();
    
    console.log('📝 Request body:', JSON.stringify(body, null, 2));

    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('❌ Auth error:', authError);
      throw new Error(`Auth error: ${authError.message}`);
    }
    
    const authorId = userData?.user?.id;
    console.log('👤 Author ID:', authorId);
    
    if (!authorId) {
      throw new Error('No authenticated user found');
    }

    const insertData = {
      ...body,
      author_id: authorId,
    };
    
    console.log('💾 Insert data:', JSON.stringify(insertData, null, 2));

    const { data, error } = await supabase
      .from('blog_posts')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      throw error;
    }

    console.log('✅ Post created successfully:', data);
    return NextResponse.json({ post: data }, { status: 201 });
  } catch (error) {
    console.error('💥 Error creating post:', error);
    console.error('💥 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

