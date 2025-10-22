import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

interface RelatedPost {
  slug: string;
  title: string;
  excerpt: string;
  category_name?: string;
  featured_image: string | null;
  featured_image_alt: string | null;
}

interface BlogPostRelatedProps {
  posts: RelatedPost[];
}

export function BlogPostRelated({ posts }: BlogPostRelatedProps) {
  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
          Related Articles
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((relatedPost) => (
            <Card key={relatedPost.slug} className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white">
              <div className="h-48 relative bg-gradient-to-br from-primary/10 to-primary/20">
                {relatedPost.featured_image && (
                  <Image
                    src={relatedPost.featured_image}
                    alt={relatedPost.featured_image_alt || relatedPost.title}
                    fill
                    className="object-cover"
                    loading="lazy"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                )}
              </div>
              <CardContent className="p-6">
                {relatedPost.category_name && (
                  <Badge variant="outline" className="text-xs mb-3 bg-primary/5 border-primary/20 text-primary">
                    {relatedPost.category_name}
                  </Badge>
                )}
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 leading-tight">
                  {relatedPost.title}
                </h3>
                <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                  {relatedPost.excerpt}
                </p>
                <Link href={`/blog/${relatedPost.slug}`}>
                  <Button variant="ghost" className="text-primary hover:bg-primary/10 p-0 group">
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
