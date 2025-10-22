import { createClient } from '@/lib/supabase-server';

// Types for blog system
export type BlogPostStatus = 'draft' | 'published';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string | null;
  featured_image_alt: string | null;
  category_id: string | null;
  author_id: string | null;
  status: BlogPostStatus;
  meta_title: string | null;
  meta_description: string | null;
  read_time: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogTag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface BlogPostWithDetails extends BlogPost {
  category_name?: string;
  category_slug?: string;
  tags?: string[];
}

// Server-side functions (for use in Server Components and API routes)
export async function getPublishedPosts(): Promise<BlogPostWithDetails[]> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('blog_posts_with_details')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.error('Error fetching blog posts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Database connection error in getPublishedPosts:', error);
    return [];
  }
}

export async function getPublishedPostBySlug(slug: string): Promise<BlogPostWithDetails | null> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('blog_posts_with_details')
      .select('*')
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (error) {
      console.error('Error fetching blog post:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Database connection error in getPublishedPostBySlug:', error);
    return null;
  }
}

export async function getRelatedPosts(categoryId: string, currentPostId: string, limit: number = 3): Promise<BlogPostWithDetails[]> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('blog_posts_with_details')
      .select('*')
      .eq('category_id', categoryId)
      .eq('status', 'published')
      .neq('id', currentPostId)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching related posts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Database connection error in getRelatedPosts:', error);
    return [];
  }
}

export async function getCategories(): Promise<BlogCategory[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  return data || [];
}

export async function getTags(): Promise<BlogTag[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('blog_tags')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching tags:', error);
    return [];
  }

  return data || [];
}

// Utility functions
export function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const wordCount = content.split(/\s+/).length;
  const readTime = Math.ceil(wordCount / wordsPerMinute);
  return Math.max(1, readTime); // Minimum 1 minute
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function truncateExcerpt(text: string, maxLength: number = 160): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

// Generate JSON-LD Schema for blog post
export function generateBlogPostSchema(post: BlogPostWithDetails, authorName?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image: post.featured_image,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: authorName || 'Shalean Cleaning Services',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Shalean Cleaning Services',
      logo: {
        '@type': 'ImageObject',
        url: 'https://shalean.co.za/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://shalean.co.za/blog/${post.slug}`,
    },
  };
}

