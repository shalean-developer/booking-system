import { SocialShareButtons } from "@/components/social-share-buttons";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { BlogPostWithDetails } from "@/lib/blog-server";

interface BlogPostContentProps {
  content: string;
  title?: string;
  url?: string;
  otherPosts?: BlogPostWithDetails[];
}

/**
 * Sanitizes blog content HTML to fix broken links
 */
function sanitizeBlogContent(content: string): string {
  let sanitized = content;

  // Fix malformed /blog/shalean.co.za links - replace with homepage or correct destination
  sanitized = sanitized.replace(/href=["']\/blog\/shalean\.co\.za\/?["']/gi, 'href="/"');
  sanitized = sanitized.replace(/href=["']\/blog\/shalean\.co\.za\/booking\/service\/select["']/gi, 'href="/booking/service/select"');
  sanitized = sanitized.replace(/href=["']\/blog\/shalean\.co\.za\/?([^"']*)["']/gi, (match, path) => {
    // If there's a path after /blog/shalean.co.za, try to redirect to that path directly
    if (path && path !== '/') {
      return `href="${path.startsWith('/') ? path : '/' + path}"`;
    }
    return 'href="/"';
  });

  // Normalize any shalean.co.za links (with or without protocol) to root-relative paths
  sanitized = sanitized.replace(/href=["'](?:https?:\/\/)?(?:www\.)?shalean\.co\.za\/?([^"']*)["']/gi, (match, path) => {
    const cleanPath = path ? path.replace(/^\//, '') : '';
    return `href="/${cleanPath}"`;
  });
  
  // Fix /booking links to point to booking page
  sanitized = sanitized.replace(/href=["']\/booking["']/gi, 'href="/booking/service/select"');
  
  // Fix blog post links that might have incorrect slugs
  // eco-friendly-cleaning-practices -> the-benefits-of-eco-friendly-cleaning-products
  sanitized = sanitized.replace(/href=["']\/blog\/eco-friendly-cleaning-practices["']/gi, 'href="/blog/the-benefits-of-eco-friendly-cleaning-products"');
  
  // eco-friendly-cleaning-south-africa -> the-benefits-of-eco-friendly-cleaning-products
  sanitized = sanitized.replace(/href=["']\/blog\/eco-friendly-cleaning-south-africa["']/gi, 'href="/blog/the-benefits-of-eco-friendly-cleaning-products"');
  
  // move-out-cleaning-cost -> move-out-cleaning-cost-guide (if exists) or remove
  // Check if we should link to a service page instead
  sanitized = sanitized.replace(/href=["']\/blog\/move-out-cleaning-cost[^"']*["']/gi, 'href="/services/move-turnover"');
  
  return sanitized;
}

export function BlogPostContent({ content, title = "", url = "", otherPosts = [] }: BlogPostContentProps) {
  const sanitizedContent = sanitizeBlogContent(content);
  
  // Filter and limit other posts to 3
  const relatedPosts = otherPosts
    .filter(post => post.slug && post.title)
    .slice(0, 3);
  
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <article 
          className="blog-prose"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
        
        {/* Related Articles Section */}
        {relatedPosts.length > 0 && (
          <div className="mt-16 pt-12 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">
              You May Also Like
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((post) => (
                <Card key={post.slug} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white">
                  <div className="h-40 relative bg-gradient-to-br from-primary/10 to-primary/20">
                    {post.featured_image && post.featured_image.trim() !== '' ? (
                      <Image
                        src={post.featured_image}
                        alt={post.featured_image_alt || post.title}
                        fill
                        className="object-cover"
                        loading="lazy"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/20 flex items-center justify-center">
                        <span className="text-primary/60 text-xs font-medium">No Image</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    {post.category_name && (
                      <Badge variant="outline" className="text-xs mb-2 bg-primary/5 border-primary/20 text-primary">
                        {post.category_name}
                      </Badge>
                    )}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
                      {post.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                      {post.excerpt}
                    </p>
                    <Link href={`/blog/${post.slug}`}>
                      <Button variant="ghost" className="text-primary hover:bg-primary/10 p-0 h-auto group text-sm">
                        Read more
                        <ArrowRight className="ml-1 h-3 w-3 group-hover:translate-x-1 transition-transform duration-200" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {/* Social Share Buttons */}
        {url && title && (
          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-4">Share this article:</p>
            <SocialShareButtons 
              url={url}
              title={title}
              showLabel={false}
            />
          </div>
        )}
      </div>
    </section>
  );
}
