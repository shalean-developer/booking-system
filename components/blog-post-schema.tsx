interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string | null;
  published_at: string | null;
  category_name?: string;
  read_time: number;
}

interface BlogPostSchemaProps {
  post: BlogPost;
}

export function BlogPostSchema({ post }: BlogPostSchemaProps) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt,
    "image": post.featured_image ? {
      "@type": "ImageObject",
      "url": post.featured_image,
      "width": 1200,
      "height": 630
    } : undefined,
    "datePublished": post.published_at,
    "dateModified": post.published_at,
    "author": {
      "@type": "Organization",
      "name": "Shalean Cleaning Services",
      "url": "https://shalean.co.za"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Shalean Cleaning Services",
      "logo": {
        "@type": "ImageObject",
        "url": "https://shalean.co.za/logo.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://shalean.co.za/blog/${post.slug}`
    },
    "articleSection": post.category_name || "General",
    "wordCount": post.content.split(' ').length,
    "timeRequired": `PT${post.read_time}M`
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
