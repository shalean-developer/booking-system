import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock
} from "lucide-react";
import type { Metadata } from "next";
import { getPublishedPostBySlug, getRelatedPosts, generateBlogPostSchema } from "@/lib/blog-server";

type Props = {
  params: Promise<{ slug: string }>;
};

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    return {
      title: 'Post Not Found',
    };
  }

  return {
    title: post.meta_title || `${post.title} | Shalean Blog`,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      type: 'article',
      publishedTime: post.published_at || undefined,
      modifiedTime: post.updated_at,
      authors: ['Shalean Cleaning Services'],
      images: post.featured_image ? [
        {
          url: post.featured_image,
          alt: post.featured_image_alt || post.title,
        },
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt,
      images: post.featured_image ? [post.featured_image] : [],
    },
  };
}

// Revalidate every hour
export const revalidate = 3600;

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);

  if (!post) {
    notFound();
  }

  // Get related posts if category exists
  const relatedPosts = post.category_id
    ? await getRelatedPosts(post.category_id, post.id, 3)
    : [];

  // Generate JSON-LD schema for SEO
  const schema = generateBlogPostSchema(post);

  return (
    <div className="min-h-screen bg-white">
      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* Header */}
      <header className="bg-white border-b shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="text-2xl font-bold text-primary">Shalean</div>
              <span className="text-sm text-gray-500">Cleaning Services</span>
            </Link>
            <Button variant="outline" asChild className="hover:bg-primary/5 hover:border-primary/20 transition-all duration-200">
              <Link href="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Breadcrumb Navigation */}
      <nav className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-4">
          <ol className="flex items-center gap-3 text-sm">
            <li>
              <Link href="/" className="text-gray-600 hover:text-primary transition-colors duration-200">Home</Link>
            </li>
            <li className="text-gray-400">/</li>
            <li>
              <Link href="/blog" className="text-gray-600 hover:text-primary transition-colors duration-200">Blog</Link>
            </li>
            <li className="text-gray-400">/</li>
            <li className="text-gray-900 font-medium truncate">{post.title}</li>
          </ol>
        </div>
      </nav>

      {/* Article Hero */}
      <section className="py-16 bg-gradient-to-b from-white to-gray-50/50">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-sm px-3 py-1">
              {post.category_name}
            </Badge>
          </div>
          <h1 className="mb-8 text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-12">
            <span className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-primary" />
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Draft'}
            </span>
            <span className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-primary" />
              {post.read_time} min read
            </span>
          </div>
          {post.featured_image && (
            <div className="relative h-96 md:h-[500px] rounded-xl overflow-hidden shadow-lg border border-gray-200">
              <Image
                src={post.featured_image}
                alt={post.featured_image_alt || post.title}
                fill
                className="object-cover"
                priority
              />
            </div>
          )}
        </div>
      </section>

      {/* Article Content */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <article 
            className="blog-prose"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">
              Related Articles
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Card key={relatedPost.slug} className="overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white">
                  <div className="h-48 relative bg-gradient-to-br from-primary/10 to-primary/20">
                    {relatedPost.featured_image && (
                      <Image
                        src={relatedPost.featured_image}
                        alt={relatedPost.featured_image_alt || relatedPost.title}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <CardContent className="p-6">
                    <Badge variant="outline" className="text-xs mb-3 bg-primary/5 border-primary/20 text-primary">
                      {relatedPost.category_name}
                    </Badge>
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
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-primary/15 to-primary/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/50"></div>
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready for a Professional Clean?
          </h2>
          <p className="text-xl text-gray-600 mb-10 leading-relaxed">
            Let our expert team handle your cleaning needs
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-10 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1" asChild>
            <Link href="/booking/service/select">
              Book a Service
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

