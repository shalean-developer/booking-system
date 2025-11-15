'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  featured_image: string;
  featured_image_alt: string;
  published_at?: string;
}

export function HomeGuides() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBlogPosts() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch latest 3 published blog posts from database
        const response = await fetch('/api/blog/posts?limit=3', {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
          },
        }).catch((fetchError) => {
          // Handle network errors (Failed to fetch)
          console.warn('Network error fetching blog posts, using fallback guides:', fetchError);
          throw new Error('Network error - using fallback content');
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `API returned ${response.status}`);
        }
        
        const data = await response.json();
        const fetchedPosts = data.posts || [];
        
        console.log('Fetched blog posts:', fetchedPosts.length);
        
        if (fetchedPosts.length === 0) {
          console.warn('No blog posts found in database, using fallback guides');
          // Use fallback guides instead
          setPosts([]);
        } else {
          setPosts(fetchedPosts);
        }
      } catch (err: any) {
        // Silently handle errors - fallback guides will be used
        console.warn('Error fetching blog posts, using fallback guides:', err?.message || err);
        setError(null); // Don't set error state, just use fallback
        setPosts([]); // Empty array triggers fallback guides
      } finally {
        setLoading(false);
      }
    }

    fetchBlogPosts();
  }, []);

  // Loading state
  if (loading) {
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Cleaning Guides & Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-6">
                  <div className="h-6 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Fallback guides if API fails or no posts
  // Using local images or more reliable Unsplash URLs
  const fallbackGuides = [
    {
      id: '1',
      title: 'How to Prepare for a Deep Clean',
      slug: 'how-to-prepare-for-a-deep-clean',
      excerpt: 'Essential tips to get your home ready for professional deep cleaning services',
      featured_image: '/images/deep-specialty.jpg', // Use your local image
      featured_image_alt: 'How to Prepare for a Deep Clean - Shalean Cleaning Blog',
    },
    {
      id: '2',
      title: 'Eco Cleaning Tips',
      slug: 'eco-friendly-cleaning-tips',
      excerpt: 'Sustainable cleaning practices for a healthier home and environment',
      featured_image: '/images/service-standard-cleaning.jpg', // Use your local image
      featured_image_alt: 'Eco Cleaning Tips - Shalean Cleaning Blog',
    },
    {
      id: '3',
      title: 'Airbnb Cleaning Checklist',
      slug: 'airbnb-cleaning-checklist',
      excerpt: 'Complete guide to preparing your Airbnb for guests with professional cleaning',
      featured_image: '/images/service-airbnb-cleaning.jpg', // Use your local image
      featured_image_alt: 'Airbnb Cleaning Checklist - Shalean Cleaning Blog',
    },
  ];

  // Use database posts if available, otherwise use fallback
  const guidesToShow = posts.length > 0 ? posts : fallbackGuides;

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4 max-w-7xl">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Cleaning Guides & Tips</h2>
        
        {/* Grid Layout - 3 columns on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {guidesToShow.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={`/blog/${post.slug}`}
                className="block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="relative h-48 bg-gray-200">
                  <Image
                    src={post.featured_image || '/images/blog-placeholder.jpg'}
                    alt={post.featured_image_alt || `${post.title} - Shalean Cleaning Blog`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                    onError={(e) => {
                      // Fallback to gray background if image fails
                      e.currentTarget.parentElement!.style.backgroundColor = '#e5e7eb';
                    }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {post.excerpt || 'Read more about this cleaning guide...'}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

