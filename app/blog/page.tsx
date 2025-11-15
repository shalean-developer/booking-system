import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { NewsletterForm } from "@/components/newsletter-form";
import { BlogFilterProvider } from "@/components/blog-filter";
import { BlogContent } from "@/components/blog-content";
import type { Metadata } from "next";
import { createMetadata } from "@/lib/metadata";
import { getSeoConfig } from "@/lib/seo-config";
import { getPublishedPosts, getCategories } from "@/lib/blog-server";

// Blog page metadata
export const metadata: Metadata = createMetadata(getSeoConfig("blog"));

// Revalidate every hour to show new posts
export const revalidate = 3600;

export default async function BlogPage() {
  const blogPosts = await getPublishedPosts();
  
  // Filter out any invalid posts and ensure we have valid data
  const validPosts = blogPosts.filter(
    (post) => post && post.slug && post.title && post.status === 'published'
  );
  
  // Get all categories from database, not just from posts
  const allCategories = await getCategories();
  const categoryNamesFromPosts = Array.from(
    new Set(
      validPosts
        .map((post) => post.category_name)
        .filter((category): category is string => Boolean(category))
    )
  );
  
  // Use all categories from database, or fallback to categories from posts
  const categories = allCategories.length > 0 
    ? allCategories.map(cat => cat.name)
    : categoryNamesFromPosts;
  
  // Ensure posts are sorted by published_at (newest first)
  const sortedPosts = [...validPosts].sort((a, b) => {
    const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
    const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
    return dateB - dateA;
  });

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" }
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-white to-white">
      {/* Header */}
      <Header />
      
      {/* Breadcrumbs */}
      <Breadcrumbs items={breadcrumbItems} />

      <main>
        <BlogFilterProvider allPosts={sortedPosts} categories={categories}>
          <BlogContent categories={categories} />
        </BlogFilterProvider>

        {/* Newsletter Section */}
        <section className="pb-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-r from-primary via-emerald-500 to-emerald-400 text-white shadow-xl">
              <div className="grid gap-8 lg:grid-cols-[1.1fr,0.9fr]">
                <div className="flex flex-col gap-6 p-10 sm:p-12">
                  <h2 className="text-3xl font-semibold leading-tight sm:text-4xl">
                    Subscribe to our Newsletter!
                  </h2>
                  <p className="max-w-xl text-base text-white/80">
                    Get blog articles, and offers into your email.
                  </p>
                  <div className="mt-2 max-w-md">
                    <NewsletterForm />
                  </div>
                </div>
                <div className="relative hidden items-center justify-center pr-4 pb-0 sm:flex">
                  <div className="absolute inset-y-0 left-0 w-1/2 rounded-full bg-white/10 blur-3xl" />
                  <div className="relative mx-auto h-full max-h-[340px] w-full max-w-[360px] overflow-hidden rounded-[2rem] border border-white/20 bg-white/10 shadow-2xl p-6 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold mb-2">Sustainable Living</div>
                      <div className="text-sm text-white/80">Stay updated with our latest content</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

