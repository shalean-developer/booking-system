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
      <header className="bg-white border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="text-2xl font-bold text-primary">Shalean</div>
              <span className="text-sm text-gray-500">Cleaning Services</span>
            </Link>
            <Button variant="outline" asChild>
              <Link href="/blog">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Blog
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Breadcrumb Navigation */}
      <nav className="bg-gray-50 border-b">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-3">
          <ol className="flex items-center gap-2 text-sm text-gray-600">
            <li>
              <Link href="/" className="hover:text-primary">Home</Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/blog" className="hover:text-primary">Blog</Link>
            </li>
            <li>/</li>
            <li className="text-gray-900 font-medium truncate">{post.title}</li>
          </ol>
        </div>
      </nav>

      {/* Article Hero */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Badge className="bg-primary/10 text-primary border-primary/20">
              {post.category_name}
            </Badge>
          </div>
          <h1 className="mb-6 text-5xl font-bold text-gray-900">
            {post.title}
          </h1>
          <div className="flex items-center gap-6 text-gray-600 mb-8">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : 'Draft'}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {post.read_time} min read
            </span>
          </div>
          {post.featured_image && (
            <div className="relative h-96 rounded-lg overflow-hidden">
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
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <article 
            className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-a:text-primary prose-strong:text-gray-900"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              Related Articles
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Card key={relatedPost.slug} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="h-48 relative bg-gradient-to-br from-primary/20 to-primary/40">
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
                    <Badge variant="outline" className="text-xs mb-3">
                      {relatedPost.category_name}
                    </Badge>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {relatedPost.title}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {relatedPost.excerpt}
                    </p>
                    <Link href={`/blog/${relatedPost.slug}`}>
                      <Button variant="ghost" className="text-primary hover:bg-primary/10 p-0">
                        Read More
                        <ArrowRight className="ml-2 h-4 w-4" />
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
      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready for a Professional Clean?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Let our expert team handle your cleaning needs
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg" asChild>
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

