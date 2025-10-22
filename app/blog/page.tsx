import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/header";
import { NewsletterForm } from "@/components/newsletter-form";
import { 
  Home, 
  ArrowRight,
  Calendar,
  Clock
} from "lucide-react";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { getSeoConfig } from "@/lib/seo-config";
import { getPublishedPosts } from "@/lib/blog-server";

// Blog page metadata
export const metadata: Metadata = createMetadata(getSeoConfig("blog"));

// Revalidate every hour to show new posts
export const revalidate = 3600;

export default async function BlogPage() {
  const blogPosts = await getPublishedPosts();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-primary/5 to-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
              Cleaning Insights & Tips
            </Badge>
            <h1 className="mb-6 text-5xl font-bold text-gray-900 sm:text-6xl">
              Shalean <span className="text-primary">Blog</span>
            </h1>
            <p className="mx-auto mb-8 max-w-3xl text-xl text-gray-600">
              Expert cleaning tips, industry insights, and practical guides from
              professional cleaners. Learn how to maintain a spotless space.
            </p>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-600">
                No blog posts yet. Check back soon!
              </div>
            ) : (
              blogPosts.map((post) => (
                <Card key={post.slug} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="h-48 relative bg-gradient-to-br from-primary/20 to-primary/40">
                    {post.featured_image && post.featured_image.trim() !== '' && (
                      <Image
                        src={post.featured_image}
                        alt={post.featured_image_alt || post.title}
                        fill
                        className="object-cover"
                        onError={(e) => {
                          console.error('Featured image failed to load:', post.featured_image);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                      <Badge variant="outline" className="text-xs">{post.category_name}</Badge>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.read_time} min read
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'Draft'}
                      </span>
                      <Link href={`/blog/${post.slug}`}>
                        <Button variant="ghost" className="text-primary hover:bg-primary/10 p-0">
                          Read More
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 to-primary/20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Stay Updated
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Get cleaning tips and exclusive offers delivered to your inbox
            </p>
            <NewsletterForm />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Need Professional Cleaning?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Let our expert team take care of your cleaning needs
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

