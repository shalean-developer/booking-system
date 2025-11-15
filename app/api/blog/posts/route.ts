import { NextResponse } from 'next/server';
import { getPublishedPosts } from '@/lib/blog-server';

// Force dynamic rendering to prevent caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    // Fetch published posts from database
    const posts = await getPublishedPosts();
    
    // Limit the number of posts if specified
    const limitedPosts = limit > 0 ? posts.slice(0, limit) : posts;
    
    // Transform to match the format needed by the component
    const formattedPosts = limitedPosts.map((post) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || post.meta_description || '',
      featured_image: post.featured_image || '',
      featured_image_alt: post.featured_image_alt || `${post.title} - Shalean Cleaning Blog`,
      published_at: post.published_at || undefined,
    }));
    
    return NextResponse.json(
      { posts: formattedPosts },
      { headers: CACHE_HEADERS }
    );
  } catch (error: any) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch blog posts',
        message: error?.message || 'Unknown error occurred',
        posts: []
      },
      { 
        status: 500,
        headers: CACHE_HEADERS 
      }
    );
  }
}

