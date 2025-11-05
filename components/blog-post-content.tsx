import { SocialShareButtons } from "@/components/social-share-buttons";

interface BlogPostContentProps {
  content: string;
  title?: string;
  url?: string;
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

export function BlogPostContent({ content, title = "", url = "" }: BlogPostContentProps) {
  const sanitizedContent = sanitizeBlogContent(content);
  
  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <article 
          className="blog-prose"
          dangerouslySetInnerHTML={{ __html: sanitizedContent }}
        />
        
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
