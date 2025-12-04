import { stringifyStructuredData } from "@/lib/structured-data-validator";

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
  // Enhanced BlogPosting schema with Article fields
  const wordCount = post.content.split(' ').length;
  const articleBody = post.content.replace(/<[^>]*>/g, '').substring(0, 5000); // Plain text, max 5000 chars
  
  // Detect if this is a HowTo guide (check title/content for keywords)
  const isHowTo = /how to|guide|step|tutorial|checklist|instructions/i.test(post.title) ||
    /step \d+|first|second|third|then|finally|instructions|guide/i.test(post.content);
  
  // Extract keywords from title and content
  const extractKeywords = () => {
    const baseKeywords = [
      "cleaning services",
      "professional cleaning",
      "Cape Town cleaning",
      "house cleaning",
      "deep cleaning"
    ];
    
    // Add category-specific keywords
    if (post.category_name) {
      baseKeywords.push(`${post.category_name.toLowerCase()} cleaning`);
    }
    
    // Extract location keywords from title/content
    const locationKeywords = ["Cape Town", "South Africa", "Johannesburg", "Durban", "Pretoria"];
    const hasLocation = locationKeywords.some(loc => 
      post.title.toLowerCase().includes(loc.toLowerCase()) || 
      post.content.toLowerCase().includes(loc.toLowerCase())
    );
    
    if (hasLocation) {
      const foundLocation = locationKeywords.find(loc => 
        post.title.toLowerCase().includes(loc.toLowerCase())
      );
      if (foundLocation) {
        baseKeywords.push(`cleaning services ${foundLocation}`);
      }
    }
    
    // Extract service-specific keywords
    const serviceKeywords = ["standard cleaning", "deep cleaning", "move in", "move out", "Airbnb", "office cleaning"];
    serviceKeywords.forEach(service => {
      if (post.title.toLowerCase().includes(service.toLowerCase()) || 
          post.content.toLowerCase().includes(service.toLowerCase())) {
        baseKeywords.push(service);
      }
    });
    
    return baseKeywords.filter((v, i, a) => a.indexOf(v) === i).slice(0, 10).join(", ");
  };
  
  // Determine article section more accurately
  const getArticleSection = () => {
    if (post.category_name) return post.category_name;
    
    // Auto-detect from title/content
    if (/deep|thorough|intensive/i.test(post.title)) return "Deep Cleaning";
    if (/airbnb|turnover|short.?term/i.test(post.title)) return "Airbnb Cleaning";
    if (/move|relocation|end of lease/i.test(post.title)) return "Move In/Out";
    if (/office|commercial|business/i.test(post.title)) return "Commercial Cleaning";
    if (/apartment|condo|flat/i.test(post.title)) return "Apartment Cleaning";
    if (/guide|how to|tips|tutorial/i.test(post.title)) return "Cleaning Tips";
    
    return "General";
  };
  
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
    "datePublished": post.published_at || new Date().toISOString(),
    "dateModified": post.published_at || new Date().toISOString(),
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
        "url": "https://shalean.co.za/icon-512.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://shalean.co.za/blog/${post.slug}`
    },
    "articleSection": getArticleSection(),
    "wordCount": wordCount,
    "timeRequired": `PT${post.read_time}M`,
    // Enhanced Article fields
    "articleBody": articleBody,
    "keywords": extractKeywords()
  };

  // Generate HowTo schema if this is a guide
  let howToSchema = null;
  if (isHowTo) {
    // Extract steps from content (look for numbered lists, h2/h3 headings that might be steps)
    const stepMatches = post.content.match(/<h[23][^>]*>([^<]+)<\/h[23]>/gi) || [];
    const steps = stepMatches.slice(0, 10).map((match, index) => {
      const text = match.replace(/<[^>]*>/g, '').trim();
      return {
        "@type": "HowToStep",
        "position": index + 1,
        "name": text,
        "text": text // Simplified - in production, extract full step content
      };
    });

    // If no steps found, create a basic structure
    if (steps.length === 0) {
      steps.push({
        "@type": "HowToStep",
        "position": 1,
        "name": "Read the guide",
        "text": post.excerpt || "Follow the instructions in this guide"
      });
    }

    howToSchema = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": post.title,
      "description": post.excerpt,
      "image": post.featured_image ? {
        "@type": "ImageObject",
        "url": post.featured_image,
        "width": 1200,
        "height": 630
      } : undefined,
      "totalTime": `PT${post.read_time}M`,
      "step": steps.length > 0 ? steps : undefined,
      "tool": ["Cleaning supplies", "Microfiber cloths", "Eco-friendly cleaning products"]
    };
  }

  // Use validator to clean and validate schema
  const validatedSchema = stringifyStructuredData(schema, "BlogPosting");
  // HowTo schema doesn't need type-specific validation, just clean it
  const validatedHowToSchema = howToSchema ? stringifyStructuredData(howToSchema) : null;

  return (
    <>
      {/* BlogPosting Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: validatedSchema }}
      />
      {/* HowTo Schema (if applicable) */}
      {validatedHowToSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: validatedHowToSchema }}
        />
      )}
    </>
  );
}
